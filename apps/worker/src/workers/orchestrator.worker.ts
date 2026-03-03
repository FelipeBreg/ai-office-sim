import { QUEUE_NAMES, orchestratorJobSchema, getAgentExecutionQueue } from '@ai-office/queue';
import type { OrchestratorJob } from '@ai-office/queue';
import { createTypedWorker } from './create-worker.js';
import {
  db,
  agents,
  actionLogs,
  workflowRuns,
  orchestratorConfig,
  approvals,
  eq,
  and,
  sql,
  gte,
  count,
} from '@ai-office/db';
import { randomUUID } from 'crypto';

/**
 * Orchestrator Worker — runs on a 1-minute repeatable interval.
 *
 * Responsibilities:
 * 1. Monitor running agents & enforce concurrency limits
 * 2. Check token/cost budgets and pause agents if exceeded
 * 3. Detect stalled agent executions (running > 10min with no activity)
 * 4. Log fleet health summary
 */
export function createOrchestratorWorker() {
  return createTypedWorker<OrchestratorJob>({
    queueName: QUEUE_NAMES.ORCHESTRATOR,
    concurrency: 1,
    schema: orchestratorJobSchema,
    processor: async (job) => {
      const { type } = job.data;

      switch (type) {
        case 'tick':
          return processOrchestratorTick();
        case 'check_budgets':
          return checkBudgets();
        case 'check_stalled':
          return checkStalledExecutions();
      }
    },
  });
}

/** Main tick: checks fleet health across all projects with orchestrator configs */
async function processOrchestratorTick() {
  const configs = await db.select().from(orchestratorConfig);

  let totalProjects = 0;
  let totalPaused = 0;

  for (const config of configs) {
    const projectId = config.projectId;
    totalProjects++;

    // 1. Count currently running agents
    const [runningCount] = await db
      .select({ count: count() })
      .from(agents)
      .where(and(eq(agents.projectId, projectId), eq(agents.status, 'working')));

    const running = Number(runningCount?.count ?? 0);

    // 2. Enforce concurrency limit — if over limit, we don't kill running agents
    //    but we skip auto-triggering new ones. The limit is advisory for scheduling.
    if (running > config.maxConcurrency) {
      console.log(
        `[orchestrator] Project ${projectId}: ${running} agents running, limit ${config.maxConcurrency} — throttling`,
      );
    }

    // 3. Check daily spend
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dailyLimit = Number(config.dailySpendLimitUsd);

    if (dailyLimit > 0) {
      const [dailySpend] = await db
        .select({
          total: sql<number>`coalesce(sum(${actionLogs.costUsd}::numeric), 0)`,
        })
        .from(actionLogs)
        .where(and(eq(actionLogs.projectId, projectId), gte(actionLogs.createdAt, today)));

      const spent = Number(dailySpend?.total ?? 0);
      if (spent >= dailyLimit) {
        console.log(
          `[orchestrator] Project ${projectId}: daily spend $${spent.toFixed(2)} >= limit $${dailyLimit.toFixed(2)} — pausing active agents`,
        );
        // Pause all non-working active agents (don't interrupt running ones)
        await db
          .update(agents)
          .set({ status: 'offline' })
          .where(
            and(
              eq(agents.projectId, projectId),
              eq(agents.status, 'idle'),
              eq(agents.isActive, true),
            ),
          );
        totalPaused++;
      }
    }

    // 4. Check for stalled agents (status = 'working' for > 15 min with no recent action log)
    const stalledCutoff = new Date(Date.now() - 15 * 60 * 1000);
    const stalledAgents = await db
      .select({ id: agents.id, name: agents.name })
      .from(agents)
      .where(
        and(
          eq(agents.projectId, projectId),
          eq(agents.status, 'working'),
          sql`${agents.updatedAt} < ${stalledCutoff}`,
        ),
      );

    for (const stalled of stalledAgents) {
      console.log(
        `[orchestrator] Agent ${stalled.name} (${stalled.id}) appears stalled — resetting to error`,
      );
      await db
        .update(agents)
        .set({ status: 'error' })
        .where(eq(agents.id, stalled.id));
    }
  }

  console.log(
    `[orchestrator] Tick complete: ${totalProjects} projects, ${totalPaused} paused for budget`,
  );
  return { totalProjects, totalPaused };
}

/** Check budgets across all orchestrated projects */
async function checkBudgets() {
  const configs = await db.select().from(orchestratorConfig);
  const results: { projectId: string; dailySpent: number; monthlySpent: number; overBudget: boolean }[] = [];

  for (const config of configs) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const firstOfMonth = new Date();
    firstOfMonth.setDate(1);
    firstOfMonth.setHours(0, 0, 0, 0);

    const [dailySpend] = await db
      .select({ total: sql<number>`coalesce(sum(${actionLogs.costUsd}::numeric), 0)` })
      .from(actionLogs)
      .where(and(eq(actionLogs.projectId, config.projectId), gte(actionLogs.createdAt, today)));

    const [monthlySpend] = await db
      .select({ total: sql<number>`coalesce(sum(${actionLogs.costUsd}::numeric), 0)` })
      .from(actionLogs)
      .where(and(eq(actionLogs.projectId, config.projectId), gte(actionLogs.createdAt, firstOfMonth)));

    const dailyLimit = Number(config.dailySpendLimitUsd);
    const monthlyLimit = Number(config.monthlySpendLimitUsd);
    const dailySpent = Number(dailySpend?.total ?? 0);
    const monthlySpent = Number(monthlySpend?.total ?? 0);

    const overBudget = (dailyLimit > 0 && dailySpent >= dailyLimit) ||
      (monthlyLimit > 0 && monthlySpent >= monthlyLimit);

    results.push({ projectId: config.projectId, dailySpent, monthlySpent, overBudget });
  }

  return { results };
}

/** Check for stalled workflow runs and agent executions */
async function checkStalledExecutions() {
  const stalledCutoff = new Date(Date.now() - 30 * 60 * 1000); // 30 min

  // Check stalled workflow runs (running for > 30 min)
  const stalledRuns = await db
    .select({ id: workflowRuns.id, workflowId: workflowRuns.workflowId })
    .from(workflowRuns)
    .where(
      and(
        eq(workflowRuns.status, 'running'),
        sql`${workflowRuns.startedAt} < ${stalledCutoff}`,
      ),
    )
    .limit(50);

  for (const run of stalledRuns) {
    console.log(`[orchestrator] Workflow run ${run.id} appears stalled — marking as failed`);
    await db
      .update(workflowRuns)
      .set({ status: 'failed', error: 'Stalled — no progress for 30 minutes', completedAt: new Date() })
      .where(eq(workflowRuns.id, run.id));
  }

  // Check stalled agents
  const stalledAgents = await db
    .select({ id: agents.id, name: agents.name, projectId: agents.projectId })
    .from(agents)
    .where(
      and(
        eq(agents.status, 'working'),
        sql`${agents.updatedAt} < ${stalledCutoff}`,
      ),
    )
    .limit(50);

  for (const agent of stalledAgents) {
    console.log(`[orchestrator] Agent ${agent.name} appears stalled — resetting to error`);
    await db.update(agents).set({ status: 'error' }).where(eq(agents.id, agent.id));
  }

  return { stalledWorkflowRuns: stalledRuns.length, stalledAgents: stalledAgents.length };
}
