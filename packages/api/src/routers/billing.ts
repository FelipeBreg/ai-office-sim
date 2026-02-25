import { z } from 'zod';
import { createTRPCRouter, protectedProcedure, requireRole } from '../trpc.js';
import { db, organizations, subscriptions, invoices, eq, and, desc } from '@ai-office/db';
import { TRPCError } from '@trpc/server';
import { PLAN_PRICING, PLAN_FEATURES } from '@ai-office/shared';

export const billingRouter = createTRPCRouter({
  /** Get current subscription for the org */
  currentSubscription: protectedProcedure.query(async ({ ctx }) => {
    const orgId = ctx.org!.id;

    const [sub] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.orgId, orgId))
      .orderBy(desc(subscriptions.createdAt))
      .limit(1);

    return sub ?? null;
  }),

  /** Get invoice history for the org */
  invoiceHistory: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(20),
      }).optional(),
    )
    .query(async ({ ctx, input }) => {
      const orgId = ctx.org!.id;
      const limit = input?.limit ?? 20;

      return db
        .select()
        .from(invoices)
        .where(eq(invoices.orgId, orgId))
        .orderBy(desc(invoices.createdAt))
        .limit(limit);
    }),

  /** Get plan pricing data */
  planPricing: protectedProcedure.query(() => {
    return { pricing: PLAN_PRICING, features: PLAN_FEATURES };
  }),

  /** Create a Stripe checkout session URL (stub — needs Stripe SDK in production) */
  createCheckoutSession: protectedProcedure.use(requireRole('admin'))
    .input(
      z.object({
        plan: z.enum(['growth', 'pro', 'enterprise']),
        interval: z.enum(['monthly', 'annual']),
        currency: z.enum(['brl', 'usd']),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const orgId = ctx.org!.id;

      // In production, this would:
      // 1. Look up or create Stripe customer
      // 2. Create Stripe Checkout Session with the correct price ID
      // 3. Return the session URL
      // For now, return a stub response

      const pricing = PLAN_PRICING[input.plan];
      if (!pricing) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: `Invalid plan: ${input.plan}` });
      }

      const amount = pricing[input.interval][input.currency];
      if (amount === -1) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Enterprise plan requires custom pricing. Contact sales.',
        });
      }

      // TODO: Replace with actual Stripe Checkout Session creation
      return {
        url: null as string | null,
        message: 'Stripe checkout session creation requires STRIPE_SECRET_KEY environment variable.',
        plan: input.plan,
        interval: input.interval,
        amount,
        currency: input.currency,
      };
    }),

  /** Create a Stripe Customer Portal session URL (stub) */
  createPortalSession: protectedProcedure.use(requireRole('admin')).mutation(async ({ ctx }) => {
    const orgId = ctx.org!.id;

    const [org] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, orgId))
      .limit(1);

    if (!org?.stripeCustomerId) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'No Stripe customer found. Subscribe to a plan first.',
      });
    }

    // TODO: Replace with actual Stripe Customer Portal session creation
    return {
      url: null as string | null,
      message: 'Stripe portal session creation requires STRIPE_SECRET_KEY environment variable.',
    };
  }),
});
