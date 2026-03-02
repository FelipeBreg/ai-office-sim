import { QUEUE_NAMES, notificationJobSchema } from '@ai-office/queue';
import type { NotificationJob } from '@ai-office/queue';
import { createTypedWorker } from './create-worker.js';
import { emitToProject } from '../socket/server.js';

export function createNotificationWorker() {
  return createTypedWorker<NotificationJob>({
    queueName: QUEUE_NAMES.NOTIFICATION,
    concurrency: 5,
    schema: notificationJobSchema,
    processor: async (job) => {
      const { type, projectId, agentId, approvalId, userId, message } = job.data;
      console.log(`[notification] Processing: type=${type} project=${projectId}`);

      switch (type) {
        case 'approval_requested':
          if (agentId && approvalId) {
            emitToProject(projectId, 'approval:requested', {
              approvalId,
              agentId,
              actionType: 'tool_call',
              riskLevel: 'medium',
            });
          }
          break;

        case 'approval_resolved':
          if (approvalId) {
            emitToProject(projectId, 'approval:resolved', {
              approvalId,
              status: 'approved',
              reviewedBy: userId ?? 'system',
            });
          }
          break;

        case 'agent_error':
          if (agentId) {
            emitToProject(projectId, 'agent:error', {
              agentId,
              sessionId: '',
              error: message ?? 'Unknown error',
              timestamp: new Date().toISOString(),
            });
          }
          break;

        case 'agent_complete':
          if (agentId) {
            emitToProject(projectId, 'agent:status_changed', {
              agentId,
              status: 'idle',
              timestamp: new Date().toISOString(),
            });
          }
          break;
      }

      await job.updateProgress(100);
      return { status: 'completed', type, agentId };
    },
  });
}
