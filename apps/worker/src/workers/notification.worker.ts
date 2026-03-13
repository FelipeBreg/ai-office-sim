import { QUEUE_NAMES, notificationJobSchema } from '@ai-office/queue';
import type { NotificationJob } from '@ai-office/queue';
import { createTypedWorker } from './create-worker.js';
import { db, approvals, eq } from '@ai-office/db';
import { emitToProject } from '../socket/server.js';

export function createNotificationWorker() {
  return createTypedWorker<NotificationJob>({
    queueName: QUEUE_NAMES.NOTIFICATION,
    concurrency: 5,
    schema: notificationJobSchema,
    processor: async (job) => {
      const { type, projectId, agentId, approvalId, userId, message, resolvedStatus } = job.data;
      console.log(`[notification] Processing: type=${type} project=${projectId}`);

      switch (type) {
        case 'approval_requested':
          if (agentId && approvalId) {
            // Read real actionType and riskLevel from the approval record
            let actionType = 'tool_call';
            let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'medium';
            try {
              const [approval] = await db
                .select({ actionType: approvals.actionType, riskLevel: approvals.riskLevel })
                .from(approvals)
                .where(eq(approvals.id, approvalId))
                .limit(1);
              if (approval) {
                actionType = approval.actionType;
                riskLevel = approval.riskLevel;
              }
            } catch {
              // Use defaults if DB lookup fails
            }
            emitToProject(projectId, 'approval:requested', {
              approvalId,
              agentId,
              actionType,
              riskLevel,
            });
          }
          break;

        case 'approval_resolved':
          if (approvalId) {
            emitToProject(projectId, 'approval:resolved', {
              approvalId,
              status: resolvedStatus ?? 'approved',
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
