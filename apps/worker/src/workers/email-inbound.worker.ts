import { QUEUE_NAMES, emailInboundJobSchema, getAgentExecutionQueue } from '@ai-office/queue';
import type { EmailInboundJob } from '@ai-office/queue';
import { randomUUID } from 'node:crypto';
import { createTypedWorker } from './create-worker.js';
import {
  db,
  emailConnections,
  emailMessages,
  conversations,
  conversationMessages,
  eq,
  and,
} from '@ai-office/db';
import { createEmailClient } from '@ai-office/ai';
import { decryptCredentials } from '@ai-office/shared';
import type { EmailProvider, EmailCredentials } from '@ai-office/ai';
import { emitToProject } from '../socket/server.js';

/**
 * Email Inbound Polling Worker
 *
 * Polls IMAP inboxes for new emails across all projects (or a specific project).
 * For each new inbound email:
 *  1. Stores raw email in email_messages table
 *  2. Finds or creates a conversation by (projectId, 'email', fromEmail)
 *  3. Inserts a conversation_message linked to the conversation
 *  4. Updates conversation metadata (lastMessageAt, preview, unreadCount)
 *  5. Emits conversation:new_message Socket.IO event
 *
 * Designed to run as a repeatable BullMQ job every 5 minutes.
 */
export function createEmailInboundWorker() {
  return createTypedWorker<EmailInboundJob>({
    queueName: QUEUE_NAMES.EMAIL_INBOUND,
    concurrency: 2,
    schema: emailInboundJobSchema,
    processor: async (job) => {
      const { type, projectId } = job.data;
      console.log(`[email-inbound] Processing: type=${type} projectId=${projectId ?? 'all'}`);

      // Load email connections to poll
      const whereClause =
        type === 'poll_project' && projectId
          ? and(
              eq(emailConnections.status, 'connected'),
              eq(emailConnections.projectId, projectId),
            )
          : eq(emailConnections.status, 'connected');

      const connections = await db
        .select()
        .from(emailConnections)
        .where(whereClause);

      if (connections.length === 0) {
        console.log(`[email-inbound] No connected email accounts to poll`);
        await job.updateProgress(100);
        return { status: 'completed', polled: 0, newMessages: 0 };
      }

      let totalNew = 0;

      for (let i = 0; i < connections.length; i++) {
        const conn = connections[i]!;
        try {
          // Decrypt credentials
          const rawCreds = conn.apiCredentials as
            | { encrypted?: string }
            | EmailCredentials
            | null;
          const credentials: EmailCredentials =
            rawCreds && 'encrypted' in rawCreds && rawCreds.encrypted
              ? JSON.parse(decryptCredentials(rawCreds.encrypted))
              : ((rawCreds ?? {}) as EmailCredentials);

          const client = createEmailClient(conn.provider as EmailProvider, credentials);

          // Fetch unread emails
          const result = await client.readEmails({ unreadOnly: true, limit: 50 });
          if (result.error) {
            console.error(
              `[email-inbound] IMAP error for project=${conn.projectId}: ${result.error}`,
            );
            continue;
          }

          if (result.emails.length === 0) continue;

          for (const email of result.emails) {
            // Extract sender email address from "Name <email>" format
            const fromEmail = extractEmail(email.from);
            const fromName = extractName(email.from);

            // Check if we already have this message (by messageId) to avoid duplicates
            const existing = await db
              .select({ id: emailMessages.id })
              .from(emailMessages)
              .where(
                and(
                  eq(emailMessages.projectId, conn.projectId),
                  eq(emailMessages.providerMessageId, email.messageId),
                ),
              )
              .limit(1);

            if (existing.length > 0) continue; // Already processed

            // 1. Store raw email in email_messages
            const [rawMsg] = await db
              .insert(emailMessages)
              .values({
                projectId: conn.projectId,
                connectionId: conn.id,
                status: 'delivered',
                messageType: 'transactional',
                fromEmail: fromEmail,
                fromName: fromName,
                toRecipients: [conn.fromEmail ?? ''],
                subject: email.subject,
                bodyText: email.body,
                bodyHtml: email.body,
                providerMessageId: email.messageId,
                sentAt: email.date ? new Date(email.date) : new Date(),
              })
              .returning({ id: emailMessages.id });

            // 2. Find or create conversation
            const [existingConv] = await db
              .select()
              .from(conversations)
              .where(
                and(
                  eq(conversations.projectId, conn.projectId),
                  eq(conversations.channel, 'email'),
                  eq(conversations.contactIdentifier, fromEmail),
                ),
              )
              .limit(1);

            let conversationId: string;

            if (existingConv) {
              conversationId = existingConv.id;
              // Reopen if resolved/closed
              const updates: Record<string, unknown> = {
                lastMessageAt: new Date(),
                lastMessagePreview: email.subject.slice(0, 200),
                unreadCount: (existingConv.unreadCount ?? 0) + 1,
                updatedAt: new Date(),
              };
              if (existingConv.status === 'resolved' || existingConv.status === 'closed') {
                updates.status = 'open';
                updates.resolvedAt = null;
              }
              await db
                .update(conversations)
                .set(updates)
                .where(eq(conversations.id, conversationId));
            } else {
              const [newConv] = await db
                .insert(conversations)
                .values({
                  projectId: conn.projectId,
                  channel: 'email',
                  contactIdentifier: fromEmail,
                  contactName: fromName || null,
                  status: 'open',
                  priority: 'medium',
                  lastMessageAt: new Date(),
                  lastMessagePreview: email.subject.slice(0, 200),
                  unreadCount: 1,
                  metadata: { firstSubject: email.subject },
                })
                .returning({ id: conversations.id });
              conversationId = newConv!.id;
            }

            // 3. Insert conversation message
            const [convMsg] = await db
              .insert(conversationMessages)
              .values({
                conversationId,
                direction: 'inbound',
                senderType: 'contact',
                content: `**${email.subject}**\n\n${email.body}`,
                contentType: 'text',
                metadata: {
                  rawEmailMessageId: rawMsg!.id,
                  originalMessageId: email.messageId,
                  fromEmail,
                  subject: email.subject,
                  date: email.date,
                },
              })
              .returning({ id: conversationMessages.id });

            // 4. Emit real-time event
            emitToProject(conn.projectId, 'conversation:new_message', {
              conversationId,
              messageId: convMsg!.id,
              direction: 'inbound',
              senderType: 'contact',
              content: email.subject,
              contentType: 'text',
              timestamp: new Date().toISOString(),
            });

            // 5. Auto-trigger handler agent if conversation has one assigned
            const conv = existingConv ?? (await db
              .select({ handlerAgentId: conversations.handlerAgentId })
              .from(conversations)
              .where(eq(conversations.id, conversationId))
              .limit(1)
              .then((r) => r[0]));

            if (conv?.handlerAgentId) {
              try {
                await getAgentExecutionQueue().add(
                  `inbound-msg-${convMsg!.id}`,
                  {
                    agentId: conv.handlerAgentId,
                    projectId: conn.projectId,
                    sessionId: randomUUID(),
                    triggerType: 'agent_message' as const,
                    triggerPayload: {
                      conversationId,
                      messageId: convMsg!.id,
                      fromEmail,
                      subject: email.subject,
                      content: email.body,
                    },
                  },
                );
                console.log(
                  `[email-inbound] Auto-triggered agent=${conv.handlerAgentId} for conversation=${conversationId}`,
                );
              } catch (triggerErr) {
                console.error(
                  `[email-inbound] Failed to trigger agent for conversation=${conversationId}:`,
                  triggerErr instanceof Error ? triggerErr.message : triggerErr,
                );
              }
            }

            totalNew++;
          }
        } catch (err) {
          console.error(
            `[email-inbound] Failed for project=${conn.projectId}:`,
            err instanceof Error ? err.message : err,
          );
        }

        await job.updateProgress(Math.round(((i + 1) / connections.length) * 100));
      }

      console.log(
        `[email-inbound] Completed: polled=${connections.length} newMessages=${totalNew}`,
      );
      return { status: 'completed', polled: connections.length, newMessages: totalNew };
    },
  });
}

/** Extract email address from "Name <email@example.com>" or plain "email@example.com" */
function extractEmail(from: string): string {
  const match = from.match(/<([^>]+)>/);
  return match ? match[1]! : from.trim();
}

/** Extract display name from "Name <email@example.com>" */
function extractName(from: string): string {
  const match = from.match(/^([^<]+)</);
  return match ? match[1]!.trim() : '';
}
