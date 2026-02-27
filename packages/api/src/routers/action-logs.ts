import { z } from 'zod';
import { createTRPCRouter, projectProcedure } from '../trpc.js';
import { db, actionLogs, eq, and, desc, count, gte, lte, sql } from '@ai-office/db';
import { TRPCError } from '@trpc/server';

export const actionLogsRouter = createTRPCRouter({
  list: projectProcedure
    .input(
      z.object({
        agentId: z.string().uuid().optional(),
        sessionId: z.string().uuid().optional(),
        status: z.enum(['pending', 'completed', 'failed', 'cancelled']).optional(),
        from: z.string().datetime().optional(),
        to: z.string().datetime().optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      }).default({}),
    )
    .query(async ({ ctx, input }) => {
      const conditions = [eq(actionLogs.projectId, ctx.project!.id)];

      if (input.agentId) conditions.push(eq(actionLogs.agentId, input.agentId));
      if (input.sessionId) conditions.push(eq(actionLogs.sessionId, input.sessionId));
      if (input.status) conditions.push(eq(actionLogs.status, input.status));
      if (input.from) conditions.push(gte(actionLogs.createdAt, new Date(input.from)));
      if (input.to) conditions.push(lte(actionLogs.createdAt, new Date(input.to)));

      const [items, [total]] = await Promise.all([
        db
          .select()
          .from(actionLogs)
          .where(and(...conditions))
          .orderBy(desc(actionLogs.createdAt))
          .limit(input.limit)
          .offset(input.offset),
        db
          .select({ count: count() })
          .from(actionLogs)
          .where(and(...conditions)),
      ]);

      return { items, total: total?.count ?? 0 };
    }),

  getById: projectProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [log] = await db
        .select()
        .from(actionLogs)
        .where(and(eq(actionLogs.id, input.id), eq(actionLogs.projectId, ctx.project!.id)))
        .limit(1);

      if (!log) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Action log not found' });
      }
      return log;
    }),

  stats: projectProcedure
    .input(
      z.object({
        days: z.number().min(1).max(90).default(7),
      }).default({}),
    )
    .query(async ({ ctx, input }) => {
      const projectId = ctx.project!.id;
      const since = new Date(Date.now() - input.days * 24 * 60 * 60 * 1000);

      // Run all aggregate queries in parallel
      const [totals, daily, byModel] = await Promise.all([
        // Totals
        db
          .select({
            totalActions: count(),
            totalTokens: sql<number>`COALESCE(SUM(${actionLogs.tokensUsed}), 0)::int`,
            totalCost: sql<string>`COALESCE(SUM(${actionLogs.costUsd}), 0)::text`,
          })
          .from(actionLogs)
          .where(and(eq(actionLogs.projectId, projectId), gte(actionLogs.createdAt, since)))
          .then((rows) => rows[0]!),

        // Daily breakdown
        db
          .select({
            day: sql<string>`DATE(${actionLogs.createdAt})::text`,
            actions: count(),
            tokens: sql<number>`COALESCE(SUM(${actionLogs.tokensUsed}), 0)::int`,
            cost: sql<string>`COALESCE(SUM(${actionLogs.costUsd}), 0)::text`,
          })
          .from(actionLogs)
          .where(and(eq(actionLogs.projectId, projectId), gte(actionLogs.createdAt, since)))
          .groupBy(sql`DATE(${actionLogs.createdAt})`)
          .orderBy(sql`DATE(${actionLogs.createdAt})`),

        // Cost by model (extracted from llm_response input JSON)
        db
          .select({
            model: sql<string>`${actionLogs.input}->>'model'`,
            tokens: sql<number>`COALESCE(SUM(${actionLogs.tokensUsed}), 0)::int`,
            cost: sql<string>`COALESCE(SUM(${actionLogs.costUsd}), 0)::text`,
            count: count(),
          })
          .from(actionLogs)
          .where(
            and(
              eq(actionLogs.projectId, projectId),
              gte(actionLogs.createdAt, since),
              eq(actionLogs.actionType, 'llm_response'),
              sql`${actionLogs.input}->>'model' IS NOT NULL`,
            ),
          )
          .groupBy(sql`${actionLogs.input}->>'model'`),
      ]);

      return { totals, daily, byModel };
    }),
});
