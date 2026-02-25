import { z } from 'zod';
import { createTRPCRouter, projectProcedure } from '../trpc.js';
import { db, actionLogs, eq, and, desc, count, gte, lte } from '@ai-office/db';
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
});
