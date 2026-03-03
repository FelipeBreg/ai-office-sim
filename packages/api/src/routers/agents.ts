import { z } from 'zod';
import { randomUUID } from 'crypto';
import { createTRPCRouter, projectProcedure, adminProcedure, enforceResourceLimit } from '../trpc.js';
import { db, agents, actionLogs, eq, and, desc, sql, gte, count } from '@ai-office/db';
import { TRPCError } from '@trpc/server';
import { getAgentExecutionQueue } from '@ai-office/queue';

export const agentsRouter = createTRPCRouter({
  list: projectProcedure.query(async ({ ctx }) => {
    return db
      .select()
      .from(agents)
      .where(eq(agents.projectId, ctx.project!.id))
      .orderBy(desc(agents.createdAt));
  }),

  listByTeam: projectProcedure
    .input(z.object({ team: z.enum(['development', 'research', 'marketing', 'sales', 'support', 'finance', 'operations']) }))
    .query(async ({ ctx, input }) => {
      return db
        .select()
        .from(agents)
        .where(and(eq(agents.projectId, ctx.project!.id), eq(agents.team, input.team)))
        .orderBy(desc(agents.createdAt));
    }),

  getById: projectProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [agent] = await db
        .select()
        .from(agents)
        .where(and(eq(agents.id, input.id), eq(agents.projectId, ctx.project!.id)))
        .limit(1);

      if (!agent) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Agent not found' });
      }
      return agent;
    }),

  create: adminProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        slug: z.string().min(1).max(50),
        archetype: z.enum([
          'support', 'sales', 'marketing', 'data_analyst', 'content_writer',
          'developer', 'project_manager', 'hr', 'finance',
          'email_campaign_manager', 'research', 'recruiter', 'social_media',
          'mercado_livre', 'inventory_monitor', 'legal_research', 'ad_analyst',
          'account_manager', 'deployment_monitor', 'custom',
        ]),
        systemPromptEn: z.string().optional(),
        systemPromptPtBr: z.string().optional(),
        triggerType: z.enum(['always_on', 'scheduled', 'event', 'manual', 'agent']).optional(),
        triggerConfig: z.object({
          cron: z.string().optional(),
          eventName: z.string().optional(),
          sourceAgentId: z.string().uuid().optional(),
        }).optional(),
        tools: z.array(z.string().max(100)).max(50).optional(),
        team: z.enum(['development', 'research', 'marketing', 'sales', 'support', 'finance', 'operations']).optional(),
        config: z.object({
          model: z.string(),
          temperature: z.number().min(0).max(2),
          maxTokens: z.number().min(1).max(200_000),
          budget: z.number().min(0),
        }).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await enforceResourceLimit(ctx.org!.id, ctx.org!.plan, 'maxAgents');

      const [agent] = await db
        .insert(agents)
        .values({
          projectId: ctx.project!.id,
          ...input,
        })
        .returning();
      return agent!;
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).max(100).optional(),
        systemPromptEn: z.string().optional(),
        systemPromptPtBr: z.string().optional(),
        triggerType: z.enum(['always_on', 'scheduled', 'event', 'manual', 'agent']).optional(),
        triggerConfig: z.object({
          cron: z.string().optional(),
          eventName: z.string().optional(),
          sourceAgentId: z.string().uuid().optional(),
        }).optional(),
        tools: z.array(z.string().max(100)).max(50).optional(),
        team: z.enum(['development', 'research', 'marketing', 'sales', 'support', 'finance', 'operations']).nullish(),
        isActive: z.boolean().optional(),
        config: z.object({
          model: z.string(),
          temperature: z.number().min(0).max(2),
          maxTokens: z.number().min(1).max(200_000),
          budget: z.number().min(0),
        }).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const [updated] = await db
        .update(agents)
        .set(data)
        .where(and(eq(agents.id, id), eq(agents.projectId, ctx.project!.id)))
        .returning();

      if (!updated) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Agent not found' });
      }
      return updated;
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [deleted] = await db
        .delete(agents)
        .where(and(eq(agents.id, input.id), eq(agents.projectId, ctx.project!.id)))
        .returning({ id: agents.id });

      if (!deleted) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Agent not found' });
      }
      return { deleted: true };
    }),

  updateStatus: adminProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        status: z.enum(['idle', 'working', 'awaiting_approval', 'error', 'offline']),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [updated] = await db
        .update(agents)
        .set({ status: input.status })
        .where(and(eq(agents.id, input.id), eq(agents.projectId, ctx.project!.id)))
        .returning();

      if (!updated) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Agent not found' });
      }
      return updated;
    }),

  trigger: adminProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        payload: z.unknown().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [agent] = await db
        .select()
        .from(agents)
        .where(and(eq(agents.id, input.id), eq(agents.projectId, ctx.project!.id)))
        .limit(1);

      if (!agent) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Agent not found' });
      }
      if (!agent.isActive) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Agent is inactive' });
      }

      const sessionId = randomUUID();
      await getAgentExecutionQueue().add(
        `agent-${agent.id}-${sessionId}`,
        {
          agentId: agent.id,
          projectId: ctx.project!.id,
          sessionId,
          ...(input.payload ? { triggerPayload: input.payload as Record<string, unknown> } : {}),
        },
      );

      return { triggered: true, agentId: agent.id, sessionId };
    }),

  /** Per-agent health metrics (last N days) */
  getMetrics: projectProcedure
    .input(z.object({
      agentId: z.string().uuid(),
      days: z.number().int().min(1).max(90).default(7),
    }))
    .query(async ({ ctx, input }) => {
      const since = new Date();
      since.setDate(since.getDate() - input.days);

      // Aggregate stats from action_logs
      const [stats] = await db
        .select({
          total: count(),
          completed: sql<number>`count(*) filter (where ${actionLogs.status} = 'completed')`,
          failed: sql<number>`count(*) filter (where ${actionLogs.status} = 'failed')`,
          totalTokens: sql<number>`coalesce(sum(${actionLogs.tokensUsed}), 0)`,
          totalCost: sql<string>`coalesce(sum(${actionLogs.costUsd}), 0)`,
          avgDuration: sql<number>`coalesce(avg(${actionLogs.durationMs}), 0)`,
        })
        .from(actionLogs)
        .where(
          and(
            eq(actionLogs.agentId, input.agentId),
            eq(actionLogs.projectId, ctx.project!.id),
            gte(actionLogs.createdAt, since),
          ),
        );

      const total = Number(stats?.total ?? 0);
      const completed = Number(stats?.completed ?? 0);
      const failed = Number(stats?.failed ?? 0);
      const successRate = total > 0 ? Math.round((completed / total) * 100) : 100;

      // Count unique sessions
      const sessions = await db
        .select({ sessionId: actionLogs.sessionId })
        .from(actionLogs)
        .where(
          and(
            eq(actionLogs.agentId, input.agentId),
            eq(actionLogs.projectId, ctx.project!.id),
            gte(actionLogs.createdAt, since),
          ),
        )
        .groupBy(actionLogs.sessionId);

      // Daily breakdown (last N days)
      const daily = await db
        .select({
          day: sql<string>`to_char(${actionLogs.createdAt}, 'YYYY-MM-DD')`.as('day'),
          actions: count(),
          failures: sql<number>`count(*) filter (where ${actionLogs.status} = 'failed')`,
          tokens: sql<number>`coalesce(sum(${actionLogs.tokensUsed}), 0)`,
        })
        .from(actionLogs)
        .where(
          and(
            eq(actionLogs.agentId, input.agentId),
            eq(actionLogs.projectId, ctx.project!.id),
            gte(actionLogs.createdAt, since),
          ),
        )
        .groupBy(sql`to_char(${actionLogs.createdAt}, 'YYYY-MM-DD')`)
        .orderBy(sql`to_char(${actionLogs.createdAt}, 'YYYY-MM-DD')`);

      // Health score: weighted combo of success rate, activity, and error trend
      // Higher is better. 100 = perfect.
      let healthScore = successRate;
      if (total === 0) healthScore = 100; // no data = assume healthy

      const healthLabel =
        healthScore >= 90 ? 'healthy' :
        healthScore >= 70 ? 'degraded' :
        'failing';

      return {
        successRate,
        healthScore,
        healthLabel: healthLabel as 'healthy' | 'degraded' | 'failing',
        totalActions: total,
        completedActions: completed,
        failedActions: failed,
        sessionCount: sessions.length,
        totalTokens: Number(stats?.totalTokens ?? 0),
        totalCost: String(stats?.totalCost ?? '0'),
        avgDurationMs: Math.round(Number(stats?.avgDuration ?? 0)),
        daily: daily.map((d) => ({
          day: d.day,
          actions: Number(d.actions),
          failures: Number(d.failures),
          tokens: Number(d.tokens),
        })),
      };
    }),

  /** Fleet-wide health summary (all agents in project) */
  getFleetHealth: projectProcedure.query(async ({ ctx }) => {
    const since = new Date();
    since.setDate(since.getDate() - 7);

    // Per-agent aggregation
    const perAgent = await db
      .select({
        agentId: actionLogs.agentId,
        total: count(),
        failed: sql<number>`count(*) filter (where ${actionLogs.status} = 'failed')`,
      })
      .from(actionLogs)
      .where(
        and(
          eq(actionLogs.projectId, ctx.project!.id),
          gte(actionLogs.createdAt, since),
        ),
      )
      .groupBy(actionLogs.agentId);

    const healthMap = new Map<string, { successRate: number; healthLabel: string }>();
    for (const row of perAgent) {
      const total = Number(row.total);
      const failed = Number(row.failed);
      const rate = total > 0 ? Math.round(((total - failed) / total) * 100) : 100;
      healthMap.set(row.agentId, {
        successRate: rate,
        healthLabel: rate >= 90 ? 'healthy' : rate >= 70 ? 'degraded' : 'failing',
      });
    }

    return Object.fromEntries(healthMap);
  }),
});
