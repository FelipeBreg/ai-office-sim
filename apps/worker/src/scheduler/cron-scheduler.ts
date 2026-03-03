/**
 * Cron Scheduler — registers BullMQ repeatable jobs for scheduled agents.
 *
 * On worker startup:
 *   1. Query all agents where triggerType='scheduled' AND isActive=true
 *   2. Parse triggerConfig.cron for cron expression
 *   3. Register BullMQ repeatable jobs on the agent-scheduled queue
 *
 * syncAgentSchedule(agentId) is called by tRPC mutations when an agent
 * is created, updated, or deleted to keep repeatable jobs in sync.
 */
import { db, agents, orchestratorConfig, eq, and } from '@ai-office/db';
import { getAgentScheduledQueue, getAgentExecutionQueue } from '@ai-office/queue';
import { randomUUID } from 'crypto';

const REPEATABLE_KEY_PREFIX = 'cron:agent:';

function repeatableKey(agentId: string): string {
  return `${REPEATABLE_KEY_PREFIX}${agentId}`;
}

/**
 * Bootstrap: scan DB for all scheduled agents and register repeatable jobs.
 * Call once on worker startup.
 */
export async function registerAllScheduledAgents(): Promise<void> {
  const queue = getAgentScheduledQueue();

  // Remove all existing cron repeatables to avoid stale entries
  const existing = await queue.getRepeatableJobs();
  for (const job of existing) {
    if (job.key.includes(REPEATABLE_KEY_PREFIX) || job.name.startsWith(REPEATABLE_KEY_PREFIX)) {
      await queue.removeRepeatableByKey(job.key);
    }
  }

  // Query all active scheduled agents
  const scheduledAgents = await db
    .select({
      id: agents.id,
      projectId: agents.projectId,
      triggerConfig: agents.triggerConfig,
    })
    .from(agents)
    .where(and(eq(agents.triggerType, 'scheduled'), eq(agents.isActive, true)));

  let registered = 0;
  for (const agent of scheduledAgents) {
    const config = agent.triggerConfig as { cron?: string } | null;
    const cron = config?.cron;
    if (!cron) continue;

    await queue.add(
      repeatableKey(agent.id),
      {
        agentId: agent.id,
        projectId: agent.projectId,
        cron,
      },
      {
        repeat: { pattern: cron },
        jobId: repeatableKey(agent.id),
      },
    );
    registered++;
  }

  console.log(`[cron-scheduler] Registered ${registered} scheduled agent(s)`);

  // Register CEO daily briefings
  await registerCeoBriefings();
}

/**
 * Sync a single agent's repeatable job.
 * Call when an agent is created, updated, or deleted.
 */
export async function syncAgentSchedule(agentId: string): Promise<void> {
  const queue = getAgentScheduledQueue();
  const key = repeatableKey(agentId);

  // Remove existing repeatable for this agent
  const existing = await queue.getRepeatableJobs();
  for (const job of existing) {
    if (job.name === key || job.key.includes(agentId)) {
      await queue.removeRepeatableByKey(job.key);
    }
  }

  // Check current agent state
  const [agent] = await db
    .select({
      id: agents.id,
      projectId: agents.projectId,
      triggerType: agents.triggerType,
      triggerConfig: agents.triggerConfig,
      isActive: agents.isActive,
    })
    .from(agents)
    .where(eq(agents.id, agentId))
    .limit(1);

  // No agent, deleted, inactive, or not scheduled → no job needed
  if (!agent || !agent.isActive || agent.triggerType !== 'scheduled') {
    return;
  }

  const config = agent.triggerConfig as { cron?: string } | null;
  const cron = config?.cron;
  if (!cron) return;

  await queue.add(
    key,
    {
      agentId: agent.id,
      projectId: agent.projectId,
      cron,
    },
    {
      repeat: { pattern: cron },
      jobId: key,
    },
  );

  console.log(`[cron-scheduler] Synced schedule for agent ${agentId}: ${cron}`);
}

/**
 * Remove a single agent's repeatable job.
 * Call when an agent is deleted or deactivated.
 */
export async function removeAgentSchedule(agentId: string): Promise<void> {
  const queue = getAgentScheduledQueue();
  const existing = await queue.getRepeatableJobs();
  for (const job of existing) {
    if (job.name === repeatableKey(agentId) || job.key.includes(agentId)) {
      await queue.removeRepeatableByKey(job.key);
    }
  }
}

const CEO_BRIEFING_PREFIX = 'cron:ceo-briefing:';

/**
 * Register CEO daily briefing cron jobs for all projects with orchestrator config.
 */
async function registerCeoBriefings(): Promise<void> {
  const queue = getAgentExecutionQueue();

  // Remove stale CEO briefing repeatables
  const existing = await queue.getRepeatableJobs();
  for (const job of existing) {
    if (job.key.includes(CEO_BRIEFING_PREFIX) || job.name.startsWith(CEO_BRIEFING_PREFIX)) {
      await queue.removeRepeatableByKey(job.key);
    }
  }

  const configs = await db.select().from(orchestratorConfig);
  let registered = 0;

  for (const config of configs) {
    const cron = config.ceoBriefingCron;
    if (!cron) continue;

    // Find the CEO agent for this project
    const [ceoAgent] = await db
      .select({ id: agents.id })
      .from(agents)
      .where(
        and(
          eq(agents.projectId, config.projectId),
          eq(agents.archetype, 'ceo_strategist'),
          eq(agents.isSystemAgent, true),
          eq(agents.isActive, true),
        ),
      )
      .limit(1);

    if (!ceoAgent) continue;

    const jobName = `${CEO_BRIEFING_PREFIX}${config.projectId}`;
    await queue.add(
      jobName,
      {
        agentId: ceoAgent.id,
        projectId: config.projectId,
        sessionId: randomUUID(),
        triggerType: 'briefing' as const,
        triggerPayload: { type: 'daily_briefing' },
      },
      {
        repeat: { pattern: cron },
        jobId: jobName,
      },
    );
    registered++;
  }

  console.log(`[cron-scheduler] Registered ${registered} CEO daily briefing(s)`);
}
