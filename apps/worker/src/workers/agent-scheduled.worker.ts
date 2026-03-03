import { QUEUE_NAMES, agentScheduledJobSchema, getAgentExecutionQueue, toBullMQPriority } from '@ai-office/queue';
import type { AgentScheduledJob } from '@ai-office/queue';
import { createTypedWorker } from './create-worker.js';
import { db, agents, eq } from '@ai-office/db';
import { randomUUID } from 'crypto';

export function createAgentScheduledWorker() {
  return createTypedWorker<AgentScheduledJob>({
    queueName: QUEUE_NAMES.AGENT_SCHEDULED,
    concurrency: 3,
    schema: agentScheduledJobSchema,
    processor: async (job) => {
      const { agentId, projectId } = job.data;
      console.log(`[agent-scheduled] Processing: agent=${agentId}`);

      // Look up agent priority from config
      const [agent] = await db
        .select({ config: agents.config })
        .from(agents)
        .where(eq(agents.id, agentId))
        .limit(1);

      const priority = (agent?.config as { priority?: string } | null)?.priority;

      const sessionId = randomUUID();
      const queue = getAgentExecutionQueue();

      await queue.add(
        `scheduled-${agentId}`,
        { agentId, projectId, sessionId },
        { priority: toBullMQPriority(priority) },
      );

      console.log(
        `[agent-scheduled] Enqueued execution: agent=${agentId} session=${sessionId} priority=${priority ?? 'normal'}`,
      );

      await job.updateProgress(100);
      return { status: 'completed', agentId, projectId, sessionId };
    },
  });
}
