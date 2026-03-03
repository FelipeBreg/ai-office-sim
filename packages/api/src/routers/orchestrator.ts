import { z } from 'zod';
import { createTRPCRouter, projectProcedure, adminProcedure } from '../trpc.js';
import {
  db,
  orchestratorConfig,
  agents,
  actionLogs,
  workflowRuns,
  approvals,
  eq,
  and,
  sql,
  gte,
  count,
} from '@ai-office/db';
import { TRPCError } from '@trpc/server';

export const orchestratorRouter = createTRPCRouter({
  /** Get or create orchestrator config for the current project */
  getConfig: projectProcedure.query(async ({ ctx }) => {
    const [config] = await db
      .select()
      .from(orchestratorConfig)
      .where(eq(orchestratorConfig.projectId, ctx.project!.id))
      .limit(1);

    if (!config) {
      // Auto-create default config
      const [created] = await db
        .insert(orchestratorConfig)
        .values({ projectId: ctx.project!.id })
        .returning();
      return created!;
    }

    return config;
  }),

  /** Update orchestrator config */
  updateConfig: adminProcedure
    .input(
      z.object({
        maxConcurrency: z.number().int().min(1).max(50).optional(),
        dailyTokenBudget: z.number().int().min(0).optional(),
        monthlyTokenBudget: z.number().int().min(0).optional(),
        dailySpendLimitUsd: z.string().optional(),
        monthlySpendLimitUsd: z.string().optional(),
        priorityRules: z
          .array(
            z.object({
              team: z.string(),
              priority: z.enum(['critical', 'high', 'normal', 'low']),
              maxConcurrency: z.number().int().min(1).optional(),
            }),
          )
          .optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Upsert config
      const [existing] = await db
        .select({ id: orchestratorConfig.id })
        .from(orchestratorConfig)
        .where(eq(orchestratorConfig.projectId, ctx.project!.id))
        .limit(1);

      if (!existing) {
        const [created] = await db
          .insert(orchestratorConfig)
          .values({ projectId: ctx.project!.id, ...input })
          .returning();
        return created!;
      }

      const [updated] = await db
        .update(orchestratorConfig)
        .set(input)
        .where(eq(orchestratorConfig.projectId, ctx.project!.id))
        .returning();

      return updated!;
    }),

  /** Get fleet status: agent counts by status, running workflows, pending approvals, cost */
  getFleetStatus: projectProcedure.query(async ({ ctx }) => {
    const projectId = ctx.project!.id;

    // Agent counts by status
    const agentCounts = await db
      .select({
        status: agents.status,
        count: count(),
      })
      .from(agents)
      .where(and(eq(agents.projectId, projectId), eq(agents.isActive, true)))
      .groupBy(agents.status);

    const agentsByStatus: Record<string, number> = {};
    for (const row of agentCounts) {
      agentsByStatus[row.status] = Number(row.count);
    }

    // Running workflow count
    const [runningWorkflows] = await db
      .select({ count: count() })
      .from(workflowRuns)
      .where(and(eq(workflowRuns.projectId, projectId), eq(workflowRuns.status, 'running')));

    // Pending approvals count
    const [pendingApprovals] = await db
      .select({ count: count() })
      .from(approvals)
      .where(and(eq(approvals.projectId, projectId), eq(approvals.status, 'pending')));

    // Today's cost
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [todayCost] = await db
      .select({
        totalCost: sql<number>`coalesce(sum(${actionLogs.costUsd}::numeric), 0)`,
        totalTokens: sql<number>`coalesce(sum(${actionLogs.tokensUsed}), 0)`,
      })
      .from(actionLogs)
      .where(and(eq(actionLogs.projectId, projectId), gte(actionLogs.createdAt, today)));

    // This month's cost
    const firstOfMonth = new Date();
    firstOfMonth.setDate(1);
    firstOfMonth.setHours(0, 0, 0, 0);
    const [monthCost] = await db
      .select({
        totalCost: sql<number>`coalesce(sum(${actionLogs.costUsd}::numeric), 0)`,
        totalTokens: sql<number>`coalesce(sum(${actionLogs.tokensUsed}), 0)`,
      })
      .from(actionLogs)
      .where(and(eq(actionLogs.projectId, projectId), gte(actionLogs.createdAt, firstOfMonth)));

    // Total active agents
    const [totalAgents] = await db
      .select({ count: count() })
      .from(agents)
      .where(and(eq(agents.projectId, projectId), eq(agents.isActive, true)));

    return {
      agents: {
        total: Number(totalAgents?.count ?? 0),
        idle: agentsByStatus['idle'] ?? 0,
        working: agentsByStatus['working'] ?? 0,
        awaitingApproval: agentsByStatus['awaiting_approval'] ?? 0,
        error: agentsByStatus['error'] ?? 0,
        offline: agentsByStatus['offline'] ?? 0,
      },
      workflowsRunning: Number(runningWorkflows?.count ?? 0),
      pendingApprovals: Number(pendingApprovals?.count ?? 0),
      cost: {
        todayUsd: Number(todayCost?.totalCost ?? 0),
        todayTokens: Number(todayCost?.totalTokens ?? 0),
        monthUsd: Number(monthCost?.totalCost ?? 0),
        monthTokens: Number(monthCost?.totalTokens ?? 0),
      },
    };
  }),

  /** Get cost report: per-agent breakdown for the last N days */
  getCostReport: projectProcedure
    .input(z.object({ days: z.number().int().min(1).max(90).default(7) }).optional())
    .query(async ({ ctx, input }) => {
      const days = input?.days ?? 7;
      const since = new Date(Date.now() - days * 86_400_000);
      const projectId = ctx.project!.id;

      // Per-agent cost
      const perAgent = await db
        .select({
          agentId: actionLogs.agentId,
          agentName: agents.name,
          totalCost: sql<number>`coalesce(sum(${actionLogs.costUsd}::numeric), 0)`,
          totalTokens: sql<number>`coalesce(sum(${actionLogs.tokensUsed}), 0)`,
          actionCount: count(),
        })
        .from(actionLogs)
        .innerJoin(agents, eq(actionLogs.agentId, agents.id))
        .where(and(eq(actionLogs.projectId, projectId), gte(actionLogs.createdAt, since)))
        .groupBy(actionLogs.agentId, agents.name)
        .orderBy(sql`sum(${actionLogs.costUsd}::numeric) DESC NULLS LAST`);

      // Daily totals
      const daily = await db
        .select({
          date: sql<string>`date(${actionLogs.createdAt})`,
          totalCost: sql<number>`coalesce(sum(${actionLogs.costUsd}::numeric), 0)`,
          totalTokens: sql<number>`coalesce(sum(${actionLogs.tokensUsed}), 0)`,
        })
        .from(actionLogs)
        .where(and(eq(actionLogs.projectId, projectId), gte(actionLogs.createdAt, since)))
        .groupBy(sql`date(${actionLogs.createdAt})`)
        .orderBy(sql`date(${actionLogs.createdAt})`);

      return {
        days,
        perAgent: perAgent.map((row) => ({
          agentId: row.agentId,
          agentName: row.agentName,
          totalCostUsd: Number(row.totalCost),
          totalTokens: Number(row.totalTokens),
          actionCount: Number(row.actionCount),
        })),
        daily: daily.map((row) => ({
          date: row.date,
          totalCostUsd: Number(row.totalCost),
          totalTokens: Number(row.totalTokens),
        })),
      };
    }),

  /** Pause all agents on a team */
  pauseTeam: adminProcedure
    .input(z.object({ team: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const result = await db
        .update(agents)
        .set({ status: 'offline' })
        .where(
          and(
            eq(agents.projectId, ctx.project!.id),
            eq(agents.team, input.team as any),
            eq(agents.isActive, true),
          ),
        )
        .returning({ id: agents.id });

      return { paused: result.length };
    }),

  /** Set an agent's priority level */
  setAgentPriority: adminProcedure
    .input(
      z.object({
        agentId: z.string().uuid(),
        priority: z.enum(['critical', 'high', 'normal', 'low']),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [agent] = await db
        .select({ id: agents.id, config: agents.config })
        .from(agents)
        .where(and(eq(agents.id, input.agentId), eq(agents.projectId, ctx.project!.id)))
        .limit(1);

      if (!agent) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Agent not found' });
      }

      const currentConfig = (agent.config ?? {
        model: 'claude-sonnet-4-5-20250514',
        temperature: 0.7,
        maxTokens: 4096,
        budget: 10,
      }) as Record<string, unknown>;

      const [updated] = await db
        .update(agents)
        .set({ config: { ...currentConfig, priority: input.priority } as any })
        .where(eq(agents.id, input.agentId))
        .returning({ id: agents.id, name: agents.name });

      return updated!;
    }),

  /** Get agents with their priorities */
  getAgentPriorities: projectProcedure.query(async ({ ctx }) => {
    const rows = await db
      .select({
        id: agents.id,
        name: agents.name,
        status: agents.status,
        team: agents.team,
        config: agents.config,
      })
      .from(agents)
      .where(and(eq(agents.projectId, ctx.project!.id), eq(agents.isActive, true)))
      .orderBy(agents.name);

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      status: row.status,
      team: row.team,
      priority: ((row.config as { priority?: string } | null)?.priority ?? 'normal') as string,
    }));
  }),

  /** Resume all agents on a team (set to idle) */
  resumeTeam: adminProcedure
    .input(z.object({ team: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const result = await db
        .update(agents)
        .set({ status: 'idle' })
        .where(
          and(
            eq(agents.projectId, ctx.project!.id),
            eq(agents.team, input.team as any),
            eq(agents.status, 'offline'),
            eq(agents.isActive, true),
          ),
        )
        .returning({ id: agents.id });

      return { resumed: result.length };
    }),
});
