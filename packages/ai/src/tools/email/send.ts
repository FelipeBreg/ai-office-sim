import { z } from 'zod';
import { db, emailConnections, emailMessages, eq } from '@ai-office/db';
import { decryptCredentials } from '@ai-office/shared';
import type { ToolDefinition, ToolExecutionContext } from '../../engine/types.js';
import { createEmailClient, type EmailProvider, type EmailCredentials } from './client.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_BODY_SIZE = 256 * 1024;
const MAX_SUBJECT_LENGTH = 998;

/** Strip HTML tags to produce plaintext (basic but sufficient for email fallback) */
function htmlToPlaintext(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Sanitize a display name to prevent header injection */
function sanitizeDisplayName(name: string): string {
  return name.replace(/[\r\n<>]/g, '').trim();
}

/** Validate that a URL is safe for use as an attachment (HTTPS only, no private IPs) */
function isAllowedAttachmentUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:') return false;
    // Block private/internal hostnames
    const host = parsed.hostname.toLowerCase();
    if (
      host === 'localhost' ||
      host === '0.0.0.0' ||
      host === '[::1]' ||
      host.startsWith('127.') ||
      host.startsWith('10.') ||
      host.startsWith('192.168.') ||
      host.startsWith('169.254.') ||
      host.startsWith('[fe80:') ||
      host.startsWith('[fd') ||
      // 172.16.0.0 - 172.31.255.255
      /^172\.(1[6-9]|2\d|3[01])\./.test(host) ||
      host.endsWith('.internal') ||
      host.endsWith('.local')
    ) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export const sendEmailTool: ToolDefinition = {
  name: 'send_email',
  description:
    'Send an email to a recipient. Requires human approval before sending. ' +
    'Supports HTML body, CC, BCC, and file attachments. ' +
    'Set isMarketing=true for promotional emails to include CAN-SPAM/LGPD unsubscribe headers.',
  inputSchema: z.object({
    to: z.string().describe('Recipient email address'),
    subject: z.string().min(1).max(MAX_SUBJECT_LENGTH).describe('Email subject line'),
    body: z.string().min(1).max(MAX_BODY_SIZE).describe('Email body in HTML format'),
    cc: z.string().optional().describe('CC recipient email address'),
    bcc: z.string().optional().describe('BCC recipient email address'),
    isMarketing: z.boolean().optional().describe(
      'Set to true for marketing/promotional emails. Adds List-Unsubscribe header for CAN-SPAM/LGPD compliance.',
    ),
    attachments: z
      .array(
        z.object({
          filename: z.string().describe('Attachment file name'),
          url: z.string().url().describe('URL of the attachment file'),
          contentType: z.string().optional().describe('MIME type (e.g. application/pdf)'),
        }),
      )
      .optional()
      .describe('Optional file attachments'),
  }),
  requiresApproval: true,

  execute: async (input: unknown, context: ToolExecutionContext) => {
    const {
      to,
      subject,
      body,
      cc,
      bcc,
      isMarketing = false,
      attachments,
    } = input as {
      to: string;
      subject: string;
      body: string;
      cc?: string;
      bcc?: string;
      isMarketing?: boolean;
      attachments?: Array<{ filename: string; url: string; contentType?: string }>;
    };

    // Validate email addresses
    if (!EMAIL_REGEX.test(to)) {
      return {
        success: false,
        error: `Invalid email format: "${to}". Expected format: user@domain.com`,
      };
    }
    if (cc && !EMAIL_REGEX.test(cc)) {
      return {
        success: false,
        error: `Invalid CC email format: "${cc}". Expected format: user@domain.com`,
      };
    }
    if (bcc && !EMAIL_REGEX.test(bcc)) {
      return {
        success: false,
        error: `Invalid BCC email format: "${bcc}". Expected format: user@domain.com`,
      };
    }

    // Validate attachment URLs (HTTPS only, no private IPs)
    if (attachments) {
      for (const att of attachments) {
        if (!isAllowedAttachmentUrl(att.url)) {
          return {
            success: false,
            error: `Invalid attachment URL: "${att.url}". Only HTTPS URLs from public hosts are allowed.`,
          };
        }
      }
    }

    // Look up email connection for this project
    const [connection] = await db
      .select()
      .from(emailConnections)
      .where(eq(emailConnections.projectId, context.projectId))
      .limit(1);

    if (!connection) {
      return {
        success: false,
        error: 'No email connection configured for this project. Set it up in Settings > Tools.',
      };
    }

    if (connection.status !== 'connected') {
      return {
        success: false,
        error: `Email connection is ${connection.status}. Please reconnect in Settings > Tools.`,
      };
    }

    // Build headers (CAN-SPAM/LGPD compliance for marketing emails)
    const customHeaders: Record<string, string> = {};
    const messageType = isMarketing ? 'marketing' : 'transactional';

    if (isMarketing) {
      // mailto: form for List-Unsubscribe (CAN-SPAM/LGPD compliance)
      // One-click HTTPS unsubscribe (List-Unsubscribe-Post) requires a web endpoint — added in P1-2.6
      customHeaders['List-Unsubscribe'] = `<mailto:${connection.fromEmail}?subject=unsubscribe>`;
    }

    const toRecipients = [to];
    const ccRecipients = cc ? [cc] : undefined;
    const bccRecipients = bcc ? [bcc] : undefined;

    // Insert message with 'pending' status (audit trail before sending)
    let messageRecord: { id: string } | undefined;
    try {
      [messageRecord] = await db
        .insert(emailMessages)
        .values({
          projectId: context.projectId,
          connectionId: connection.id,
          status: 'pending',
          messageType,
          fromEmail: connection.fromEmail,
          fromName: connection.fromName,
          toRecipients,
          ccRecipients,
          bccRecipients,
          subject,
          bodyHtml: body,
          bodyText: htmlToPlaintext(body),
          headers: Object.keys(customHeaders).length > 0 ? customHeaders : undefined,
          attachments: attachments?.map((a) => ({
            filename: a.filename,
            url: a.url,
            contentType: a.contentType,
          })),
          agentId: context.agentId,
        })
        .returning();
    } catch (err) {
      return {
        success: false,
        error: `Failed to create audit record: ${err instanceof Error ? err.message : 'DB error'}`,
      };
    }

    if (!messageRecord) {
      return { success: false, error: 'Failed to create audit record' };
    }

    // Send via provider
    try {
      const rawCreds = connection.apiCredentials as { encrypted?: string } | EmailCredentials | null;
      const credentials: EmailCredentials =
        rawCreds && 'encrypted' in rawCreds && rawCreds.encrypted
          ? JSON.parse(decryptCredentials(rawCreds.encrypted))
          : ((rawCreds ?? {}) as EmailCredentials);

      const client = createEmailClient(
        connection.provider as EmailProvider,
        credentials,
      );

      const safeName = connection.fromName ? sanitizeDisplayName(connection.fromName) : null;
      const fromField = safeName
        ? `${safeName} <${connection.fromEmail}>`
        : connection.fromEmail;

      const plaintext = htmlToPlaintext(body);

      const result = await client.sendEmail({
        from: fromField,
        to: toRecipients,
        cc: ccRecipients,
        bcc: bccRecipients,
        replyTo: connection.replyTo ?? undefined,
        subject,
        html: body,
        text: plaintext,
        headers: customHeaders,
        attachments: attachments?.map((a) => ({
          filename: a.filename,
          path: a.url,
          contentType: a.contentType,
        })),
      });

      // Update message record with result
      await db
        .update(emailMessages)
        .set({
          providerMessageId: result.providerMessageId || undefined,
          status: result.status === 'sent' ? 'sent' : 'failed',
          error: result.error,
          sentAt: result.status === 'sent' ? new Date() : undefined,
        })
        .where(eq(emailMessages.id, messageRecord.id));

      if (result.status === 'failed') {
        return {
          success: false,
          error: result.error ?? 'Failed to send email',
          messageId: messageRecord.id,
        };
      }

      return {
        success: true,
        messageId: messageRecord.id,
        providerMessageId: result.providerMessageId,
        to,
        subject,
        bodyPreview: plaintext.slice(0, 200) + (plaintext.length > 200 ? '...' : ''),
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown provider error';

      await db
        .update(emailMessages)
        .set({ status: 'failed', error: errorMessage })
        .where(eq(emailMessages.id, messageRecord.id));

      return {
        success: false,
        error: `Provider error: ${errorMessage}`,
        messageId: messageRecord.id,
      };
    }
  },
};
