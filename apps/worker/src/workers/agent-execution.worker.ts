import { QUEUE_NAMES, agentExecutionJobSchema } from '@ai-office/queue';
import type { AgentExecutionJob } from '@ai-office/queue';
import { createTypedWorker } from './create-worker.js';

export function createAgentExecutionWorker() {
  return createTypedWorker<AgentExecutionJob>({
    queueName: QUEUE_NAMES.AGENT_EXECUTION,
    concurrency: 5,
    schema: agentExecutionJobSchema,
    processor: async (job) => {
      const { agentId, projectId, sessionId } = job.data;
      console.log(
        `[agent-execution] Processing: agent=${agentId} session=${sessionId}`,
      );

      // TODO (P0-7.5): Load agent config, build context, invoke executor
      await job.updateProgress(100);
      return { status: 'completed', agentId, projectId, sessionId };
    },
  });
}
