import { z } from 'zod';
import { createTRPCRouter, protectedProcedure, projectProcedure, requireRole } from '../trpc.js';
import {
  db,
  organizations,
  subscriptions,
  invoices,
  usageRecords,
  tokenBalances,
  actionLogs,
  eq,
  and,
  desc,
  sql,
  gte,
  lte,
} from '@ai-office/db';
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

  /** Get token balance for the org */
  tokenBalance: protectedProcedure.query(async ({ ctx }) => {
    const orgId = ctx.org!.id;

    const [balance] = await db
      .select()
      .from(tokenBalances)
      .where(eq(tokenBalances.orgId, orgId))
      .limit(1);

    return balance ?? {
      balanceCents: 0,
      autoRechargeEnabled: false,
      autoRechargeThresholdCents: 500,
      autoRechargeAmountCents: 5000,
      isPaused: false,
    };
  }),

  /** Get usage records for a project within a date range */
  usageHistory: projectProcedure
    .input(
      z.object({
        days: z.number().min(1).max(90).default(30),
      }),
    )
    .query(async ({ ctx, input }) => {
      const projectId = ctx.project!.id;
      const since = new Date();
      since.setDate(since.getDate() - input.days);
      const sinceStr = since.toISOString().split('T')[0]!;

      return db
        .select()
        .from(usageRecords)
        .where(
          and(
            eq(usageRecords.projectId, projectId),
            gte(usageRecords.periodDate, sinceStr),
          ),
        )
        .orderBy(desc(usageRecords.periodDate));
    }),

  /** Aggregate current period usage (real-time from action_logs) */
  currentPeriodUsage: projectProcedure.query(async ({ ctx }) => {
    const projectId = ctx.project!.id;
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [result] = await db
      .select({
        totalTokens: sql<number>`coalesce(sum(${actionLogs.tokensUsed}), 0)::int`,
        totalCostUsd: sql<string>`coalesce(sum(${actionLogs.costUsd}), 0)`,
        actionCount: sql<number>`count(*)::int`,
      })
      .from(actionLogs)
      .where(
        and(
          eq(actionLogs.projectId, projectId),
          gte(actionLogs.createdAt, startOfMonth),
        ),
      );

    return result ?? { totalTokens: 0, totalCostUsd: '0', actionCount: 0 };
  }),

  /** Update token balance settings */
  updateTokenSettings: protectedProcedure
    .use(requireRole('admin'))
    .input(
      z.object({
        autoRechargeEnabled: z.boolean().optional(),
        autoRechargeThresholdCents: z.number().min(100).optional(),
        autoRechargeAmountCents: z.number().min(1000).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const orgId = ctx.org!.id;

      // Upsert token balance
      const existing = await db
        .select({ id: tokenBalances.id })
        .from(tokenBalances)
        .where(eq(tokenBalances.orgId, orgId))
        .limit(1);

      if (existing.length > 0) {
        const [updated] = await db
          .update(tokenBalances)
          .set(input)
          .where(eq(tokenBalances.orgId, orgId))
          .returning();
        return updated!;
      } else {
        const [created] = await db
          .insert(tokenBalances)
          .values({ orgId, ...input })
          .returning();
        return created!;
      }
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
      // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
      // const session = await stripe.checkout.sessions.create({ ... });
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
