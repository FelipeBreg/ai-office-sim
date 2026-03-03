import { QUEUE_NAMES, orchestratorJobSchema, getAgentExecutionQueue, getRedisClient } from '@ai-office/queue';
import type { OrchestratorJob } from '@ai-office/queue';
import { createTypedWorker } from './create-worker.js';
import {
  db,
  agents,
  actionLogs,
  workflowRuns,
  orchestratorConfig,
  approvals,
  strategyKpis,
  eq,
  and,
  or,
  sql,
  gte,
  lte,
  count,
  isNull,
} from '@ai-office/db';
import { checkKpiThreshold } from '@ai-office/ai';
import { randomUUID } from 'crypto';
import { hostname } from 'os';
import { emitToProject } from '../socket/server.js';

const WORKER_ID = `worker:${hostname()}:${process.pid}`;
const LOCK_KEY = 'orchestrator:leader';
const LOCK_TTL_SECONDS = 90;

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

/** Acquire leader lock. Returns true if this worker is the leader. */
async function acquireLeaderLock(): Promise<boolean> {
  const redis = getRedisClient();
  const result = await redis.set(LOCK_KEY, WORKER_ID, 'EX', LOCK_TTL_SECONDS, 'NX');
  if (result === 'OK') return true;

  // Check if we already hold the lock and refresh TTL
  const holder = await redis.get(LOCK_KEY);
  if (holder === WORKER_ID) {
    await redis.expire(LOCK_KEY, LOCK_TTL_SECONDS);
    return true;
  }
  return false;
}

/** Main tick: checks fleet health across all projects with orchestrator configs */
async function processOrchestratorTick() {
  // Leader election: only one worker runs the tick
  const isLeader = await acquireLeaderLock();
  if (!isLeader) {
    console.log(`[orchestrator] Not leader (${WORKER_ID}), skipping tick`);
    return { skipped: true, reason: 'not_leader' };
  }

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

    // 5. Check expired approvals
    const expiredApprovals = await db
      .select({ id: approvals.id, agentId: approvals.agentId, sessionState: approvals.sessionState })
      .from(approvals)
      .where(
        and(
          eq(approvals.projectId, projectId),
          eq(approvals.status, 'pending'),
          sql`${approvals.expiresAt} IS NOT NULL AND ${approvals.expiresAt} < now()`,
        ),
      );

    for (const approval of expiredApprovals) {
      console.log(`[orchestrator] Approval ${approval.id} expired — auto-expiring`);
      await db
        .update(approvals)
        .set({ status: 'rejected' as any, expiredAt: new Date() })
        .where(eq(approvals.id, approval.id));

      // Resume agent with "expired" injected message if session state exists
      if (approval.sessionState && approval.agentId) {
        const queue = getAgentExecutionQueue();
        await queue.add(`approval-expired-${approval.id}`, {
          agentId: approval.agentId,
          projectId,
          sessionId: randomUUID(),
          triggerType: 'event' as const,
          resumeState: approval.sessionState as Record<string, unknown>,
          resumeApproved: false,
        });
      }

      emitToProject(projectId, 'approval:resolved', {
        approvalId: approval.id,
        status: 'rejected',
        reviewedBy: 'system:expired',
      });
    }

    // 6. Auto-recovery: check errored agents whose cooldown has expired
    const now = new Date();
    const recoverableAgents = await db
      .select({
        id: agents.id,
        name: agents.name,
        recoveryAttempts: agents.recoveryAttempts,
      })
      .from(agents)
      .where(
        and(
          eq(agents.projectId, projectId),
          eq(agents.status, 'error'),
          eq(agents.isActive, true),
          or(isNull(agents.cooldownUntil), lte(agents.cooldownUntil, now)),
        ),
      );

    const BACKOFF_HOURS = [1, 4, 24]; // exponential backoff schedule
    const MAX_RECOVERY_ATTEMPTS = 3;

    for (const agent of recoverableAgents) {
      const attempts = agent.recoveryAttempts;

      if (attempts >= MAX_RECOVERY_ATTEMPTS) {
        console.log(
          `[orchestrator] Agent ${agent.name} (${agent.id}) exceeded ${MAX_RECOVERY_ATTEMPTS} recovery attempts — disabling`,
        );
        await db
          .update(agents)
          .set({ isActive: false })
          .where(eq(agents.id, agent.id));
        continue;
      }

      // Set cooldown with exponential backoff and attempt recovery
      const backoffHours = BACKOFF_HOURS[Math.min(attempts, BACKOFF_HOURS.length - 1)]!;
      const cooldownUntil = new Date(Date.now() + backoffHours * 60 * 60 * 1000);

      console.log(
        `[orchestrator] Agent ${agent.name} (${agent.id}) — recovery attempt ${attempts + 1}/${MAX_RECOVERY_ATTEMPTS}, cooldown until ${cooldownUntil.toISOString()}`,
      );

      await db
        .update(agents)
        .set({
          status: 'idle',
          recoveryAttempts: attempts + 1,
          cooldownUntil,
        })
        .where(eq(agents.id, agent.id));
    }

    // 7. KPI polling: check monitored KPIs for threshold crossings
    const monitoredKpis = await db
      .select({ id: strategyKpis.id })
      .from(strategyKpis)
      .where(
        and(
          eq(strategyKpis.projectId, projectId),
          eq(strategyKpis.isMonitored, true),
        ),
      );

    for (const kpi of monitoredKpis) {
      await checkKpiThreshold(kpi.id);
    }

    // 8. Heartbeat: wake agents whose heartbeat interval has elapsed
    const heartbeatAgents = await db
      .select({
        id: agents.id,
        name: agents.name,
        heartbeatInstructions: agents.heartbeatInstructions,
        heartbeatIntervalMin: agents.heartbeatIntervalMin,
      })
      .from(agents)
      .where(
        and(
          eq(agents.projectId, projectId),
          eq(agents.isActive, true),
          eq(agents.status, 'idle'),
          sql`${agents.heartbeatIntervalMin} IS NOT NULL`,
          or(
            isNull(agents.lastHeartbeatAt),
            sql`now() - ${agents.lastHeartbeatAt} >= ${agents.heartbeatIntervalMin} * interval '1 minute'`,
          ),
        ),
      );

    for (const hbAgent of heartbeatAgents) {
      // Check concurrency before firing
      if (running >= config.maxConcurrency) {
        console.log(`[orchestrator] Skipping heartbeat for ${hbAgent.name} — at concurrency limit`);
        break;
      }

      console.log(`[orchestrator] Heartbeat firing for agent ${hbAgent.name} (${hbAgent.id})`);

      const queue = getAgentExecutionQueue();
      const sessionId = randomUUID();
      const instructions = hbAgent.heartbeatInstructions || '';
      const payload = instructions
        ? `Heartbeat check. Your instructions: ${instructions}`
        : 'Heartbeat check. No instructions set. Review your current situation and decide if any action is needed.';

      await queue.add(`heartbeat-${hbAgent.id}-${sessionId}`, {
        agentId: hbAgent.id,
        projectId,
        sessionId,
        triggerType: 'heartbeat' as const,
        triggerPayload: { message: payload },
      });

      await db
        .update(agents)
        .set({ lastHeartbeatAt: new Date() })
        .where(eq(agents.id, hbAgent.id));

      emitToProject(projectId, 'agent:heartbeat_fired' as any, {
        agentId: hbAgent.id,
        agentName: hbAgent.name,
      });
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
