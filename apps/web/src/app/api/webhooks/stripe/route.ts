import { headers } from 'next/headers';
import { timingSafeEqual } from 'crypto';
import { db, organizations, subscriptions, invoices, eq } from '@ai-office/db';
import type { Plan } from '@ai-office/shared';

/* -------------------------------------------------------------------------- */
/*  Stripe type stubs (avoids hard dependency on stripe package at build time) */
/* -------------------------------------------------------------------------- */

interface StripeEvent {
  id: string;
  type: string;
  data: { object: Record<string, unknown> };
}

/* -------------------------------------------------------------------------- */
/*  Valid subscription statuses                                               */
/* -------------------------------------------------------------------------- */

const VALID_SUB_STATUSES = new Set(['active', 'past_due', 'canceled', 'trialing', 'unpaid']);

type SubStatus = typeof subscriptions.$inferInsert['status'];

function mapStripeStatus(stripeStatus: string): SubStatus {
  if (VALID_SUB_STATUSES.has(stripeStatus)) {
    return stripeStatus as SubStatus;
  }
  // Map Stripe-specific statuses to closest equivalent
  if (stripeStatus === 'incomplete' || stripeStatus === 'incomplete_expired') return 'unpaid';
  if (stripeStatus === 'paused') return 'active';
  return 'unpaid';
}

/* -------------------------------------------------------------------------- */
/*  Price-to-plan mapping (set via env vars in production)                     */
/* -------------------------------------------------------------------------- */

function planFromPriceId(priceId: string): Plan | null {
  if (!priceId) return null;
  const entries: [string | undefined, Plan][] = [
    [process.env.STRIPE_PRICE_GROWTH_MONTHLY, 'growth'],
    [process.env.STRIPE_PRICE_GROWTH_ANNUAL, 'growth'],
    [process.env.STRIPE_PRICE_PRO_MONTHLY, 'pro'],
    [process.env.STRIPE_PRICE_PRO_ANNUAL, 'pro'],
    [process.env.STRIPE_PRICE_ENTERPRISE, 'enterprise'],
  ];
  const map: Record<string, Plan> = {};
  for (const [key, plan] of entries) {
    if (key) map[key] = plan;
  }
  return map[priceId] ?? null;
}

/* -------------------------------------------------------------------------- */
/*  Signature verification (timing-safe)                                      */
/* -------------------------------------------------------------------------- */

async function verifyStripeWebhook(body: string, signature: string): Promise<StripeEvent | null> {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    console.error('STRIPE_WEBHOOK_SECRET not configured');
    return null;
  }

  const encoder = new TextEncoder();
  const parts = signature.split(',');
  const timestampPart = parts.find((p) => p.startsWith('t='));
  const sigPart = parts.find((p) => p.startsWith('v1='));

  if (!timestampPart || !sigPart) return null;

  const timestamp = timestampPart.slice(2);
  const expectedSig = sigPart.slice(3);
  const payload = `${timestamp}.${body}`;

  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );

  const sigBytes = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  const computed = Array.from(new Uint8Array(sigBytes))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  // Timing-safe comparison to prevent timing oracle attacks
  const computedBuf = Buffer.from(computed, 'hex');
  const expectedBuf = Buffer.from(expectedSig, 'hex');
  if (computedBuf.length !== expectedBuf.length || !timingSafeEqual(computedBuf, expectedBuf)) {
    console.error('Stripe webhook signature mismatch');
    return null;
  }

  // Check timestamp isn't too old (5 min tolerance)
  const age = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (age > 300) {
    console.error('Stripe webhook timestamp too old');
    return null;
  }

  return JSON.parse(body) as StripeEvent;
}

/* -------------------------------------------------------------------------- */
/*  Event handlers                                                            */
/* -------------------------------------------------------------------------- */

async function handleCheckoutCompleted(data: Record<string, unknown>) {
  const customerId = data.customer as string;
  const subscriptionId = data.subscription as string;
  if (!customerId || !subscriptionId) return;

  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.stripeCustomerId, customerId))
    .limit(1);

  if (!org) {
    console.error(`Stripe checkout: no org for customer ${customerId}`);
    return;
  }

  // Upsert subscription (idempotent on stripeSubscriptionId)
  await db
    .insert(subscriptions)
    .values({
      orgId: org.id,
      stripeSubscriptionId: subscriptionId,
      status: 'active',
    })
    .onConflictDoUpdate({
      target: subscriptions.stripeSubscriptionId,
      set: { status: 'active', orgId: org.id },
    });
}

async function handleInvoicePaid(data: Record<string, unknown>) {
  const stripeInvoiceId = data.id as string;
  const customerId = data.customer as string;
  const amountPaid = (data.amount_paid as number) ?? 0;
  const currency = (data.currency as string) ?? 'brl';
  const invoiceUrl = data.hosted_invoice_url as string | undefined;
  const invoicePdf = data.invoice_pdf as string | undefined;
  const periodStart = data.period_start as number | undefined;
  const periodEnd = data.period_end as number | undefined;

  // Only store HTTPS URLs
  const safeInvoiceUrl = invoiceUrl?.startsWith('https://') ? invoiceUrl : null;
  const safeInvoicePdf = invoicePdf?.startsWith('https://') ? invoicePdf : null;

  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.stripeCustomerId, customerId))
    .limit(1);

  if (!org) return;

  await db
    .insert(invoices)
    .values({
      orgId: org.id,
      stripeInvoiceId,
      status: 'paid',
      amountDue: amountPaid,
      amountPaid,
      currency,
      invoiceUrl: safeInvoiceUrl,
      invoicePdf: safeInvoicePdf,
      periodStart: periodStart ? new Date(periodStart * 1000) : undefined,
      periodEnd: periodEnd ? new Date(periodEnd * 1000) : undefined,
      paidAt: new Date(),
    })
    .onConflictDoUpdate({
      target: invoices.stripeInvoiceId,
      set: { status: 'paid', amountPaid, paidAt: new Date() },
    });
}

async function handleInvoicePaymentFailed(data: Record<string, unknown>) {
  const subscriptionId = (data.subscription as string) ?? null;
  if (!subscriptionId) return;

  await db
    .update(subscriptions)
    .set({ status: 'past_due' })
    .where(eq(subscriptions.stripeSubscriptionId, subscriptionId));
}

async function handleSubscriptionUpdated(data: Record<string, unknown>) {
  const subscriptionId = data.id as string;
  const customerId = data.customer as string;
  const status = data.status as string;
  const cancelAtPeriodEnd = (data.cancel_at_period_end as boolean) ?? false;
  const canceledAt = data.canceled_at as number | null;
  const currentPeriodStart = data.current_period_start as number | undefined;
  const currentPeriodEnd = data.current_period_end as number | undefined;
  const items = data.items as { data?: Array<{ price?: { id: string } }> } | undefined;
  const priceId = items?.data?.[0]?.price?.id;

  const mappedStatus = mapStripeStatus(status);

  await db
    .update(subscriptions)
    .set({
      status: mappedStatus,
      cancelAtPeriodEnd,
      canceledAt: canceledAt ? new Date(canceledAt * 1000) : null,
      currentPeriodStart: currentPeriodStart ? new Date(currentPeriodStart * 1000) : undefined,
      currentPeriodEnd: currentPeriodEnd ? new Date(currentPeriodEnd * 1000) : undefined,
      stripePriceId: priceId ?? undefined,
    })
    .where(eq(subscriptions.stripeSubscriptionId, subscriptionId));

  // Update org plan tier if price changed
  if (priceId) {
    const plan = planFromPriceId(priceId);
    if (plan) {
      const [org] = await db
        .select()
        .from(organizations)
        .where(eq(organizations.stripeCustomerId, customerId))
        .limit(1);

      if (org) {
        await db
          .update(organizations)
          .set({ plan })
          .where(eq(organizations.id, org.id));
      }
    }
  }
}

async function handleSubscriptionDeleted(data: Record<string, unknown>) {
  const subscriptionId = data.id as string;
  const customerId = data.customer as string;

  await db
    .update(subscriptions)
    .set({ status: 'canceled', canceledAt: new Date() })
    .where(eq(subscriptions.stripeSubscriptionId, subscriptionId));

  // Downgrade org to starter
  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.stripeCustomerId, customerId))
    .limit(1);

  if (org) {
    await db
      .update(organizations)
      .set({ plan: 'starter' })
      .where(eq(organizations.id, org.id));
  }
}

/* -------------------------------------------------------------------------- */
/*  POST handler                                                              */
/* -------------------------------------------------------------------------- */

export async function POST(req: Request): Promise<Response> {
  const headerPayload = await headers();
  const signature = headerPayload.get('stripe-signature');

  if (!signature) {
    return new Response('Missing stripe-signature header', { status: 400 });
  }

  const body = await req.text();
  const event = await verifyStripeWebhook(body, signature);

  if (!event) {
    return new Response('Invalid signature', { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object);
        break;
      case 'invoice.paid':
        await handleInvoicePaid(event.data.object);
        break;
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object);
        break;
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;
      default:
        break;
    }
  } catch (err) {
    console.error(`Stripe webhook handler error for ${event.type}:`, err);
    // Return 200 to prevent Stripe from retrying on permanent logic errors
    return new Response('Webhook handler error (acknowledged)', { status: 200 });
  }

  return new Response('OK', { status: 200 });
}
