/**
 * Approval notification service (P1-6.3).
 *
 * Sends notifications when a new approval is requested:
 * 1. Socket.IO event (real-time, handled by front-end)
 * 2. Email notification to project admins (PT-BR template)
 * 3. Optional WhatsApp notification (if configured)
 *
 * Rate-limited: max 1 notification batch per minute per user.
 */

import { db, users, projects, eq } from '@ai-office/db';

const RATE_LIMIT_MS = 60_000;
const rateLimitMap = new Map<string, number>();

interface ApprovalNotificationPayload {
  approvalId: string;
  projectId: string;
  agentId: string;
  agentName: string;
  actionDescription: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

/** Check if a notification is rate-limited for a given user */
function isRateLimited(userId: string): boolean {
  const lastSent = rateLimitMap.get(userId);
  if (lastSent && Date.now() - lastSent < RATE_LIMIT_MS) {
    return true;
  }
  return false;
}

/** Mark a user as notified for rate-limiting purposes */
function markNotified(userId: string): void {
  rateLimitMap.set(userId, Date.now());
}

/**
 * Build the PT-BR email body for an approval notification.
 */
function buildApprovalEmailBody(payload: ApprovalNotificationPayload): {
  subject: string;
  body: string;
} {
  const riskLabels: Record<string, string> = {
    low: 'Baixo',
    medium: 'Médio',
    high: 'Alto',
    critical: 'Crítico',
  };

  const subject = `[Aprovação Pendente] ${payload.agentName} - ${payload.actionDescription}`;
  const body = `
<div style="font-family: 'IBM Plex Mono', monospace; background: #0A0E14; color: #E0E0E0; padding: 24px;">
  <h2 style="color: #00C8E0; margin-bottom: 16px;">Nova Solicitação de Aprovação</h2>
  <table style="border-collapse: collapse; width: 100%;">
    <tr>
      <td style="padding: 8px 12px; color: #888;">Agente:</td>
      <td style="padding: 8px 12px; color: #E0E0E0;">${payload.agentName}</td>
    </tr>
    <tr>
      <td style="padding: 8px 12px; color: #888;">Ação:</td>
      <td style="padding: 8px 12px; color: #E0E0E0;">${payload.actionDescription}</td>
    </tr>
    <tr>
      <td style="padding: 8px 12px; color: #888;">Risco:</td>
      <td style="padding: 8px 12px; color: ${payload.riskLevel === 'critical' ? '#FF4444' : payload.riskLevel === 'high' ? '#FF8C00' : '#00C8E0'};">
        ${riskLabels[payload.riskLevel] ?? payload.riskLevel}
      </td>
    </tr>
  </table>
  <p style="margin-top: 16px;">
    <a href="${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/approvals"
       style="color: #00C8E0; text-decoration: underline;">
      Revisar no painel →
    </a>
  </p>
</div>`.trim();

  return { subject, body };
}

/**
 * Send approval notifications to all project admins.
 *
 * This function is designed to be called from the approval creation flow
 * (e.g., when the executor creates a new approval request).
 */
export async function notifyApprovalRequested(
  payload: ApprovalNotificationPayload,
  options?: {
    /** Socket.IO emit function (injected to avoid circular dependency) */
    socketEmit?: (room: string, event: string, data: unknown) => void;
    /** Email send function (injected) */
    sendEmail?: (to: string, subject: string, body: string) => Promise<void>;
    /** WhatsApp send function (injected, optional) */
    sendWhatsApp?: (to: string, message: string) => Promise<void>;
  },
): Promise<{ notifiedCount: number }> {
  let notifiedCount = 0;

  // 1. Socket.IO real-time event (always sent, no rate limit)
  if (options?.socketEmit) {
    options.socketEmit(`project:${payload.projectId}`, 'approval:requested', {
      approvalId: payload.approvalId,
      agentId: payload.agentId,
      actionType: payload.actionDescription,
      riskLevel: payload.riskLevel,
    });
  }

  // 2. Email notifications to project admins (rate-limited)
  if (options?.sendEmail) {
    // Look up the org that owns this project
    const [project] = await db
      .select({ orgId: projects.orgId })
      .from(projects)
      .where(eq(projects.id, payload.projectId))
      .limit(1);

    const admins = project
      ? await db
          .select({ id: users.id, email: users.email })
          .from(users)
          .where(eq(users.orgId, project.orgId))
      : [];

    const { subject, body } = buildApprovalEmailBody(payload);

    for (const admin of admins) {
      if (isRateLimited(admin.id)) continue;

      try {
        await options.sendEmail(admin.email, subject, body);
        markNotified(admin.id);
        notifiedCount++;
      } catch {
        // Log but don't fail the notification pipeline
        console.error(`Failed to send approval email to ${admin.email}`);
      }
    }
  }

  // 3. WhatsApp notification (optional, rate-limited)
  if (options?.sendWhatsApp) {
    const message =
      `📋 *Aprovação Pendente*\n` +
      `Agente: ${payload.agentName}\n` +
      `Ação: ${payload.actionDescription}\n` +
      `Risco: ${payload.riskLevel}`;

    // WhatsApp notifications are opt-in; the caller provides the number
    try {
      // The WhatsApp number for notifications is configured per-project
      // For now, this is a placeholder — the caller handles the routing
      await options.sendWhatsApp('', message);
    } catch {
      console.error('Failed to send WhatsApp approval notification');
    }
  }

  return { notifiedCount };
}

export type { ApprovalNotificationPayload };
