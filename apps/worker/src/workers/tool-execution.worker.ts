import { QUEUE_NAMES, toolExecutionJobSchema } from '@ai-office/queue';
import type { ToolExecutionJob } from '@ai-office/queue';
import { createTypedWorker } from './create-worker.js';
import { toolRegistry } from '@ai-office/ai';
import { db, actionLogs, eq } from '@ai-office/db';

export function createToolExecutionWorker() {
  return createTypedWorker<ToolExecutionJob>({
    queueName: QUEUE_NAMES.TOOL_EXECUTION,
    concurrency: 10,
    schema: toolExecutionJobSchema,
    processor: async (job) => {
      const { toolName, agentId, projectId, sessionId, toolInput, actionLogId } = job.data;
      console.log(`[tool-execution] Processing: tool=${toolName} agent=${agentId}`);

      const tool = toolRegistry.get(toolName);
      if (!tool) {
        const error = `Tool "${toolName}" not found in registry`;
        console.error(`[tool-execution] ${error}`);
        await db
          .update(actionLogs)
          .set({ status: 'failed', error })
          .where(eq(actionLogs.id, actionLogId));
        return { status: 'failed', toolName, error };
      }

      const startTime = Date.now();

      try {
        const result = await tool.execute(toolInput, {
          agentId,
          projectId,
          sessionId,
        });

        const durationMs = Date.now() - startTime;

        // Update action log with result
        await db
          .update(actionLogs)
          .set({
            status: 'completed',
            output: result as Record<string, unknown>,
            durationMs,
          })
          .where(eq(actionLogs.id, actionLogId));

        await job.updateProgress(100);
        return { status: 'completed', toolName, sessionId, durationMs };
      } catch (err) {
        const durationMs = Date.now() - startTime;
        const error = err instanceof Error ? err.message : String(err);

        await db
          .update(actionLogs)
          .set({
            status: 'failed',
            error,
            durationMs,
          })
          .where(eq(actionLogs.id, actionLogId));

        console.error(`[tool-execution] Tool "${toolName}" failed:`, error);
        return { status: 'failed', toolName, error, durationMs };
      }
    },
  });
}
