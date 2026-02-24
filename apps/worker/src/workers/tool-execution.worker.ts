import { QUEUE_NAMES, toolExecutionJobSchema } from '@ai-office/queue';
import type { ToolExecutionJob } from '@ai-office/queue';
import { createTypedWorker } from './create-worker.js';

export function createToolExecutionWorker() {
  return createTypedWorker<ToolExecutionJob>({
    queueName: QUEUE_NAMES.TOOL_EXECUTION,
    concurrency: 10,
    schema: toolExecutionJobSchema,
    processor: async (job) => {
      const { toolName, agentId, sessionId } = job.data;
      console.log(`[tool-execution] Processing: tool=${toolName} agent=${agentId}`);

      // TODO (P0-7.3): Look up tool in registry, execute, return result
      await job.updateProgress(100);
      return { status: 'completed', toolName, sessionId };
    },
  });
}
