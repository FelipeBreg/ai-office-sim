import { QUEUE_NAMES, agentExecutionJobSchema } from '@ai-office/queue';
import type { AgentExecutionJob } from '@ai-office/queue';
import { createTypedWorker } from './create-worker.js';
import { processAgentExecution } from '../jobs/agent-execution.js';

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

      await processAgentExecution(job.data);

      await job.updateProgress(100);
      return { status: 'completed', agentId, projectId, sessionId };
    },
  });
}
