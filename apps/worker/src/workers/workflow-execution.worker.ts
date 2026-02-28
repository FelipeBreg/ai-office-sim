import { QUEUE_NAMES, workflowExecutionJobSchema } from '@ai-office/queue';
import type { WorkflowExecutionJob } from '@ai-office/queue';
import { createTypedWorker } from './create-worker.js';
import { processWorkflowExecution } from '../jobs/workflow-execution.js';

export function createWorkflowExecutionWorker() {
  return createTypedWorker<WorkflowExecutionJob>({
    queueName: QUEUE_NAMES.WORKFLOW_EXECUTION,
    concurrency: 3,
    schema: workflowExecutionJobSchema,
    processor: async (job) => {
      const { workflowId, workflowRunId, projectId } = job.data;
      console.log(
        `[workflow-execution] Processing: workflow=${workflowId} run=${workflowRunId}`,
      );

      await processWorkflowExecution(job.data);
      await job.updateProgress(100);
      return { status: 'completed', workflowId, workflowRunId, projectId };
    },
  });
}
