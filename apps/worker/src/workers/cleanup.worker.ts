import { QUEUE_NAMES, cleanupJobSchema } from '@ai-office/queue';
import type { CleanupJob } from '@ai-office/queue';
import { createTypedWorker } from './create-worker.js';

export function createCleanupWorker() {
  return createTypedWorker<CleanupJob>({
    queueName: QUEUE_NAMES.CLEANUP,
    concurrency: 1,
    schema: cleanupJobSchema,
    processor: async (job) => {
      const { type, olderThanDays } = job.data;
      console.log(`[cleanup] Processing: type=${type} olderThan=${olderThanDays}d`);

      // TODO: Delete expired sessions, old action logs, stale jobs
      await job.updateProgress(100);
      return { status: 'completed', type };
    },
  });
}
