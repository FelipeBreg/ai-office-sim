import { QUEUE_NAMES, agentScheduledJobSchema, getAgentExecutionQueue } from '@ai-office/queue';
import type { AgentScheduledJob } from '@ai-office/queue';
import { createTypedWorker } from './create-worker.js';
import { randomUUID } from 'crypto';

export function createAgentScheduledWorker() {
  return createTypedWorker<AgentScheduledJob>({
    queueName: QUEUE_NAMES.AGENT_SCHEDULED,
    concurrency: 3,
    schema: agentScheduledJobSchema,
    processor: async (job) => {
      const { agentId, projectId } = job.data;
      console.log(`[agent-scheduled] Processing: agent=${agentId}`);

      const sessionId = randomUUID();
      const queue = getAgentExecutionQueue();

      await queue.add(`scheduled-${agentId}`, {
        agentId,
        projectId,
        sessionId,
      });

      console.log(
        `[agent-scheduled] Enqueued execution: agent=${agentId} session=${sessionId}`,
      );

      await job.updateProgress(100);
      return { status: 'completed', agentId, projectId, sessionId };
    },
  });
}
