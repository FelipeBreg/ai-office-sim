import { QUEUE_NAMES, agentScheduledJobSchema } from '@ai-office/queue';
import type { AgentScheduledJob } from '@ai-office/queue';
import { createTypedWorker } from './create-worker.js';

export function createAgentScheduledWorker() {
  return createTypedWorker<AgentScheduledJob>({
    queueName: QUEUE_NAMES.AGENT_SCHEDULED,
    concurrency: 3,
    schema: agentScheduledJobSchema,
    processor: async (job) => {
      const { agentId, projectId } = job.data;
      console.log(`[agent-scheduled] Processing: agent=${agentId}`);

      // TODO: Enqueue an agent-execution job with a fresh sessionId
      await job.updateProgress(100);
      return { status: 'completed', agentId, projectId };
    },
  });
}
