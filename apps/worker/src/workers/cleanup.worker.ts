import { QUEUE_NAMES, cleanupJobSchema } from '@ai-office/queue';
import type { CleanupJob } from '@ai-office/queue';
import { createTypedWorker } from './create-worker.js';
import { db, actionLogs, sql, lt } from '@ai-office/db';

export function createCleanupWorker() {
  return createTypedWorker<CleanupJob>({
    queueName: QUEUE_NAMES.CLEANUP,
    concurrency: 1,
    schema: cleanupJobSchema,
    processor: async (job) => {
      const { type, olderThanDays } = job.data;
      console.log(`[cleanup] Processing: type=${type} olderThan=${olderThanDays}d`);

      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - olderThanDays);

      let deletedCount = 0;

      switch (type) {
        case 'expired_sessions': {
          // Delete agent sessions older than cutoff that are completed or failed
          const result = await db
            .delete(actionLogs)
            .where(
              sql`${actionLogs.createdAt} < ${cutoff} AND ${actionLogs.status} IN ('completed', 'failed', 'cancelled')`,
            )
            .returning({ id: actionLogs.id });
          deletedCount = result.length;
          break;
        }

        case 'old_action_logs': {
          // Delete old action logs beyond retention period
          const result = await db
            .delete(actionLogs)
            .where(lt(actionLogs.createdAt, cutoff))
            .returning({ id: actionLogs.id });
          deletedCount = result.length;
          break;
        }

        case 'stale_jobs': {
          // Stale BullMQ jobs are handled by BullMQ's own removeOnComplete/removeOnFail
          // This is a no-op placeholder for future custom cleanup
          console.log(`[cleanup] Stale jobs cleanup delegated to BullMQ config`);
          break;
        }
      }

      console.log(`[cleanup] Completed: type=${type} deleted=${deletedCount}`);
      await job.updateProgress(100);
      return { status: 'completed', type, deletedCount };
    },
  });
}
