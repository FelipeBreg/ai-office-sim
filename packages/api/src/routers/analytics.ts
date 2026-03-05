import { z } from 'zod';
import { createTRPCRouter, projectProcedure } from '../trpc.js';
import { db, agentPerformanceSnapshots, kpiHistory, eq, and, gte, desc } from '@ai-office/db';

export const analyticsRouter = createTRPCRouter({
  /** Get performance snapshots for a specific agent over N days */
  getAgentPerformance: projectProcedure
    .input(z.object({
      agentId: z.string().uuid(),
      days: z.number().int().min(1).max(90).default(7),
    }))
    .query(async ({ ctx, input }) => {
      const since = new Date();
      since.setDate(since.getDate() - input.days);
      const sinceStr = since.toISOString().split('T')[0]!;

      return db
        .select()
        .from(agentPerformanceSnapshots)
        .where(
          and(
            eq(agentPerformanceSnapshots.projectId, ctx.project!.id),
            eq(agentPerformanceSnapshots.agentId, input.agentId),
            gte(agentPerformanceSnapshots.snapshotDate, sinceStr),
          ),
        )
        .orderBy(desc(agentPerformanceSnapshots.snapshotDate));
    }),

  /** Get KPI history (time-series) for a specific KPI */
  getKpiHistory: projectProcedure
    .input(z.object({
      kpiId: z.string().uuid(),
      days: z.number().int().min(1).max(365).default(30),
    }))
    .query(async ({ ctx, input }) => {
      const since = new Date();
      since.setDate(since.getDate() - input.days);

      return db
        .select()
        .from(kpiHistory)
        .where(
          and(
            eq(kpiHistory.projectId, ctx.project!.id),
            eq(kpiHistory.kpiId, input.kpiId),
            gte(kpiHistory.recordedAt, since),
          ),
        )
        .orderBy(desc(kpiHistory.recordedAt));
    }),

  /** Get all performance snapshots for the project (fleet overview) */
  getFleetPerformance: projectProcedure
    .input(z.object({
      days: z.number().int().min(1).max(30).default(7),
    }))
    .query(async ({ ctx, input }) => {
      const since = new Date();
      since.setDate(since.getDate() - input.days);
      const sinceStr = since.toISOString().split('T')[0]!;

      return db
        .select()
        .from(agentPerformanceSnapshots)
        .where(
          and(
            eq(agentPerformanceSnapshots.projectId, ctx.project!.id),
            gte(agentPerformanceSnapshots.snapshotDate, sinceStr),
          ),
        )
        .orderBy(desc(agentPerformanceSnapshots.snapshotDate));
    }),
});
