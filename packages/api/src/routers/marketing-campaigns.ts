import { z } from 'zod';
import { createTRPCRouter, projectProcedure, adminProcedure } from '../trpc.js';
import { db, marketingCampaigns, eq, and, gte, sql, count, desc } from '@ai-office/db';
import { TRPCError } from '@trpc/server';

const PLATFORMS = [
  'meta_ads', 'youtube_ads', 'email', 'linkedin',
  'instagram', 'google_ads', 'tiktok', 'other',
] as const;
const STATUSES = ['active', 'paused', 'completed'] as const;
const FUNNEL_STAGES = ['top', 'middle', 'bottom'] as const;

const periodInput = z
  .object({ days: z.number().min(1).max(90).default(30) })
  .default({});

export const marketingCampaignsRouter = createTRPCRouter({
  list: projectProcedure.query(async ({ ctx }) => {
    return db
      .select()
      .from(marketingCampaigns)
      .where(eq(marketingCampaigns.projectId, ctx.project!.id))
      .orderBy(desc(marketingCampaigns.createdAt));
  }),

  create: adminProcedure
    .input(
      z.object({
        name: z.string().min(1).max(200),
        platform: z.enum(PLATFORMS).default('other'),
        status: z.enum(STATUSES).default('active'),
        spend: z.string().optional(),
        impressions: z.number().int().min(0).optional(),
        clicks: z.number().int().min(0).optional(),
        conversions: z.number().int().min(0).optional(),
        revenue: z.string().optional(),
        startDate: z.string().datetime().optional(),
        endDate: z.string().datetime().optional(),
        funnelStage: z.enum(FUNNEL_STAGES).default('top'),
        notes: z.string().max(2000).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [campaign] = await db
        .insert(marketingCampaigns)
        .values({
          projectId: ctx.project!.id,
          name: input.name,
          platform: input.platform,
          status: input.status,
          spend: input.spend ?? '0',
          impressions: input.impressions ?? 0,
          clicks: input.clicks ?? 0,
          conversions: input.conversions ?? 0,
          revenue: input.revenue ?? '0',
          startDate: input.startDate ? new Date(input.startDate) : null,
          endDate: input.endDate ? new Date(input.endDate) : null,
          funnelStage: input.funnelStage,
          notes: input.notes ?? null,
        })
        .returning();
      return campaign!;
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).max(200).optional(),
        platform: z.enum(PLATFORMS).optional(),
        status: z.enum(STATUSES).optional(),
        spend: z.string().optional(),
        impressions: z.number().int().min(0).optional(),
        clicks: z.number().int().min(0).optional(),
        conversions: z.number().int().min(0).optional(),
        revenue: z.string().optional(),
        funnelStage: z.enum(FUNNEL_STAGES).optional(),
        notes: z.string().max(2000).nullish(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const [updated] = await db
        .update(marketingCampaigns)
        .set(data)
        .where(and(eq(marketingCampaigns.id, id), eq(marketingCampaigns.projectId, ctx.project!.id)))
        .returning();

      if (!updated) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Campaign not found' });
      }
      return updated;
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [deleted] = await db
        .delete(marketingCampaigns)
        .where(and(eq(marketingCampaigns.id, input.id), eq(marketingCampaigns.projectId, ctx.project!.id)))
        .returning({ id: marketingCampaigns.id });

      if (!deleted) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Campaign not found' });
      }
      return { deleted: true };
    }),

  funnelMetrics: projectProcedure.input(periodInput).query(async ({ ctx, input }) => {
    const projectId = ctx.project!.id;
    const since = new Date(Date.now() - input.days * 24 * 60 * 60 * 1000);

    const metrics = await db
      .select({
        funnelStage: marketingCampaigns.funnelStage,
        campaigns: count(),
        totalSpend: sql<string>`COALESCE(SUM(${marketingCampaigns.spend}), 0)::text`,
        totalImpressions: sql<number>`COALESCE(SUM(${marketingCampaigns.impressions}), 0)::int`,
        totalClicks: sql<number>`COALESCE(SUM(${marketingCampaigns.clicks}), 0)::int`,
        totalConversions: sql<number>`COALESCE(SUM(${marketingCampaigns.conversions}), 0)::int`,
        totalRevenue: sql<string>`COALESCE(SUM(${marketingCampaigns.revenue}), 0)::text`,
      })
      .from(marketingCampaigns)
      .where(and(eq(marketingCampaigns.projectId, projectId), gte(marketingCampaigns.createdAt, since)))
      .groupBy(marketingCampaigns.funnelStage);

    const top = metrics.find((m) => m.funnelStage === 'top');
    const middle = metrics.find((m) => m.funnelStage === 'middle');
    const bottom = metrics.find((m) => m.funnelStage === 'bottom');

    const topImpressions = top?.totalImpressions ?? 0;
    const middleClicks = middle?.totalClicks ?? 0;
    const bottomConversions = bottom?.totalConversions ?? 0;

    return {
      stages: metrics,
      conversionRates: {
        topToMiddle: topImpressions > 0 ? Math.round((middleClicks / topImpressions) * 100) : 0,
        middleToBottom: middleClicks > 0 ? Math.round((bottomConversions / middleClicks) * 100) : 0,
      },
    };
  }),
});
