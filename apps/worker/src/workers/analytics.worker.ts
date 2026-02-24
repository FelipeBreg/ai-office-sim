import { QUEUE_NAMES, analyticsJobSchema } from '@ai-office/queue';
import type { AnalyticsJob } from '@ai-office/queue';
import { createTypedWorker } from './create-worker.js';

export function createAnalyticsWorker() {
  return createTypedWorker<AnalyticsJob>({
    queueName: QUEUE_NAMES.ANALYTICS,
    concurrency: 1,
    schema: analyticsJobSchema,
    processor: async (job) => {
      const { type, projectId, date } = job.data;
      console.log(`[analytics] Processing: type=${type} project=${projectId} date=${date}`);

      // TODO: Run aggregation queries, detect learnings, generate cost reports
      await job.updateProgress(100);
      return { status: 'completed', type, date };
    },
  });
}
