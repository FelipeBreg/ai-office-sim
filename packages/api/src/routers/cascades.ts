import { z } from 'zod';
import { createTRPCRouter, projectProcedure } from '../trpc.js';
import { db, cascadeEvents, agents, eq, and, desc, sql } from '@ai-office/db';

export const cascadesRouter = createTRPCRouter({
  listRecent: projectProcedure
    .input(z.object({ limit: z.number().min(1).max(100).default(50) }))
    .query(async ({ ctx, input }) => {
      const projectId = ctx.project!.id;

      const rows = await db
        .select({
          cascadeId: cascadeEvents.cascadeId,
          eventCount: sql<number>`count(*)::int`,
          totalCostUsd: sql<string>`coalesce(sum(${cascadeEvents.costUsd}), 0)`,
          maxDurationMs: sql<number>`coalesce(max(${cascadeEvents.durationMs}), 0)::int`,
          maxDepth: sql<number>`max(${cascadeEvents.depth})::int`,
          rootTriggerType: sql<string>`min(case when ${cascadeEvents.depth} = 0 then ${cascadeEvents.triggerType} end)`,
          hasFailure: sql<boolean>`bool_or(${cascadeEvents.status} = 'failed')`,
          hasPartial: sql<boolean>`bool_or(${cascadeEvents.status} = 'partial_failure')`,
          hasInProgress: sql<boolean>`bool_or(${cascadeEvents.status} = 'in_progress')`,
          createdAt: sql<string>`min(${cascadeEvents.createdAt})`,
        })
        .from(cascadeEvents)
        .where(eq(cascadeEvents.projectId, projectId))
        .groupBy(cascadeEvents.cascadeId)
        .orderBy(desc(sql`min(${cascadeEvents.createdAt})`))
        .limit(input.limit);

      return rows.map((r) => ({
        ...r,
        status: r.hasInProgress
          ? 'in_progress'
          : r.hasFailure
            ? 'failed'
            : r.hasPartial
              ? 'partial_failure'
              : 'completed',
      }));
    }),

  getCascadeTree: projectProcedure
    .input(z.object({ cascadeId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const projectId = ctx.project!.id;

      const events = await db
        .select({
          id: cascadeEvents.id,
          cascadeId: cascadeEvents.cascadeId,
          agentId: cascadeEvents.agentId,
          workflowId: cascadeEvents.workflowId,
          depth: cascadeEvents.depth,
          status: cascadeEvents.status,
          triggerType: cascadeEvents.triggerType,
          costUsd: cascadeEvents.costUsd,
          durationMs: cascadeEvents.durationMs,
          parentEventId: cascadeEvents.parentEventId,
          error: cascadeEvents.error,
          createdAt: cascadeEvents.createdAt,
        })
        .from(cascadeEvents)
        .where(
          and(
            eq(cascadeEvents.projectId, projectId),
            eq(cascadeEvents.cascadeId, input.cascadeId),
          ),
        )
        .orderBy(cascadeEvents.depth, cascadeEvents.createdAt);

      // Resolve agent names
      const agentIds = [...new Set(events.filter((e) => e.agentId).map((e) => e.agentId!))];
      const agentNames: Record<string, string> = {};
      if (agentIds.length > 0) {
        const agentRows = await db
          .select({ id: agents.id, name: agents.name })
          .from(agents)
          .where(sql`${agents.id} = any(${agentIds})`);
        for (const a of agentRows) agentNames[a.id] = a.name;
      }

      return events.map((e) => ({
        ...e,
        agentName: e.agentId ? agentNames[e.agentId] ?? null : null,
      }));
    }),
});
