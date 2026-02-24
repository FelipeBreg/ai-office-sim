import { QUEUE_NAMES, notificationJobSchema } from '@ai-office/queue';
import type { NotificationJob } from '@ai-office/queue';
import { createTypedWorker } from './create-worker.js';

export function createNotificationWorker() {
  return createTypedWorker<NotificationJob>({
    queueName: QUEUE_NAMES.NOTIFICATION,
    concurrency: 5,
    schema: notificationJobSchema,
    processor: async (job) => {
      const { type, projectId, agentId } = job.data;
      console.log(`[notification] Processing: type=${type} project=${projectId}`);

      // TODO: Emit Socket.IO event, send email/push notification
      await job.updateProgress(100);
      return { status: 'completed', type, agentId };
    },
  });
}
