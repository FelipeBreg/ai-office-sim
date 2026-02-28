import { z } from 'zod';
import { createTRPCRouter, projectProcedure, adminProcedure } from '../trpc.js';
import { db, deals, pipelineStages, eq, and, asc, desc, gte, sql, count } from '@ai-office/db';
import { TRPCError } from '@trpc/server';

const DEAL_STAGES = [
  'prospect',
  'qualified',
  'proposal',
  'negotiation',
  'closed_won',
  'closed_lost',
] as const;

export const dealsRouter = createTRPCRouter({
  list: projectProcedure.query(async ({ ctx }) => {
    const rows = await db
      .select({
        id: deals.id,
        projectId: deals.projectId,
        title: deals.title,
        companyName: deals.companyName,
        contactName: deals.contactName,
        contactEmail: deals.contactEmail,
        value: deals.value,
        stage: deals.stage,
        stageId: deals.stageId,
        sortOrder: deals.sortOrder,
        notes: deals.notes,
        crmProvider: deals.crmProvider,
        crmExternalId: deals.crmExternalId,
        crmLastSyncAt: deals.crmLastSyncAt,
        createdByAgentId: deals.createdByAgentId,
        createdAt: deals.createdAt,
        updatedAt: deals.updatedAt,
        stageName: pipelineStages.name,
        stageColor: pipelineStages.color,
        stageSlug: pipelineStages.slug,
        stageIsWon: pipelineStages.isWon,
        stageIsLost: pipelineStages.isLost,
      })
      .from(deals)
      .leftJoin(pipelineStages, eq(deals.stageId, pipelineStages.id))
      .where(eq(deals.projectId, ctx.project!.id))
      .orderBy(asc(deals.sortOrder), desc(deals.createdAt));
    return rows;
  }),

  create: projectProcedure
    .input(
      z.object({
        title: z.string().min(1).max(200),
        companyName: z.string().max(200).optional(),
        contactName: z.string().max(200).optional(),
        contactEmail: z.string().email().max(200).optional(),
        value: z.string().regex(/^\d{1,10}(\.\d{1,2})?$/, 'Must be a valid decimal').optional(),
        stage: z.enum(DEAL_STAGES).optional(),
        stageId: z.string().uuid().optional(),
        notes: z.string().max(2000).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [deal] = await db
        .insert(deals)
        .values({
          projectId: ctx.project!.id,
          ...input,
        })
        .returning();
      return deal!;
    }),

  update: projectProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        title: z.string().min(1).max(200).optional(),
        companyName: z.string().max(200).nullish(),
        contactName: z.string().max(200).nullish(),
        contactEmail: z.string().email().max(200).nullish(),
        value: z.string().regex(/^\d{1,10}(\.\d{1,2})?$/, 'Must be a valid decimal').nullish(),
        stage: z.enum(DEAL_STAGES).optional(),
        stageId: z.string().uuid().nullish(),
        notes: z.string().max(2000).nullish(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const [updated] = await db
        .update(deals)
        .set(data)
        .where(and(eq(deals.id, id), eq(deals.projectId, ctx.project!.id)))
        .returning();

      if (!updated) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Deal not found' });
      }
      return updated;
    }),

  updateStage: projectProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        stageId: z.string().uuid(),
        sortOrder: z.number().int().min(0).default(0),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [updated] = await db
        .update(deals)
        .set({ stageId: input.stageId, sortOrder: input.sortOrder })
        .where(and(eq(deals.id, input.id), eq(deals.projectId, ctx.project!.id)))
        .returning();

      if (!updated) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Deal not found' });
      }
      return updated;
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [deleted] = await db
        .delete(deals)
        .where(and(eq(deals.id, input.id), eq(deals.projectId, ctx.project!.id)))
        .returning({ id: deals.id });

      if (!deleted) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Deal not found' });
      }
      return { deleted: true };
    }),

  kpis: projectProcedure
    .input(z.object({ days: z.number().min(1).max(90).default(30) }).default({}))
    .query(async ({ ctx, input }) => {
      const projectId = ctx.project!.id;
      const since = new Date(Date.now() - input.days * 24 * 60 * 60 * 1000);
      const prevSince = new Date(Date.now() - input.days * 2 * 24 * 60 * 60 * 1000);

      const [current, previous] = await Promise.all([
        db
          .select({
            totalDeals: count(),
            pipelineValue: sql<string>`COALESCE(SUM(CASE WHEN ${pipelineStages.isWon} = false AND ${pipelineStages.isLost} = false THEN ${deals.value} ELSE 0 END), 0)::text`,
            wonCount: sql<number>`COUNT(*) FILTER (WHERE ${pipelineStages.isWon} = true)::int`,
            wonValue: sql<string>`COALESCE(SUM(CASE WHEN ${pipelineStages.isWon} = true THEN ${deals.value} ELSE 0 END), 0)::text`,
            lostCount: sql<number>`COUNT(*) FILTER (WHERE ${pipelineStages.isLost} = true)::int`,
            lostValue: sql<string>`COALESCE(SUM(CASE WHEN ${pipelineStages.isLost} = true THEN ${deals.value} ELSE 0 END), 0)::text`,
          })
          .from(deals)
          .leftJoin(pipelineStages, eq(deals.stageId, pipelineStages.id))
          .where(and(eq(deals.projectId, projectId), gte(deals.createdAt, since))),
        db
          .select({
            wonCount: sql<number>`COUNT(*) FILTER (WHERE ${pipelineStages.isWon} = true)::int`,
            totalDeals: count(),
          })
          .from(deals)
          .leftJoin(pipelineStages, eq(deals.stageId, pipelineStages.id))
          .where(
            and(
              eq(deals.projectId, projectId),
              gte(deals.createdAt, prevSince),
              sql`${deals.createdAt} < ${since}`,
            ),
          ),
      ]);

      const c = current[0]!;
      const p = previous[0]!;
      const totalDeals = c.totalDeals;
      const wonCount = c.wonCount;
      const conversionRate = totalDeals > 0 ? Math.round((wonCount / totalDeals) * 100) : 0;
      const avgDealSize = totalDeals > 0 ? Number(c.pipelineValue) / totalDeals : 0;

      const prevConversion = p.totalDeals > 0 ? Math.round((p.wonCount / p.totalDeals) * 100) : 0;

      return {
        pipelineValue: Number(c.pipelineValue),
        wonCount,
        wonValue: Number(c.wonValue),
        lostCount: c.lostCount,
        lostValue: Number(c.lostValue),
        conversionRate,
        avgDealSize: Math.round(avgDealSize * 100) / 100,
        growth: {
          conversion: conversionRate - prevConversion,
        },
      };
    }),
});
