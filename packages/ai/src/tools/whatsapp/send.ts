import { z } from 'zod';
import { db, whatsappConnections, whatsappMessages, eq } from '@ai-office/db';
import { decryptCredentials } from '@ai-office/shared';
import type { ToolDefinition, ToolExecutionContext } from '../../engine/types.js';
import { createWhatsAppClient, type WhatsAppProvider, type WhatsAppCredentials } from './client.js';

// E.164 phone number format: + followed by 1-15 digits
const E164_REGEX = /^\+[1-9]\d{1,14}$/;

export const sendWhatsAppMessageTool: ToolDefinition = {
  name: 'send_whatsapp_message',
  description:
    'Send a WhatsApp message to a phone number. Requires human approval before sending. ' +
    'Phone number must be in E.164 format (e.g. +5511999998888).',
  inputSchema: z.object({
    to: z.string().describe('Phone number in E.164 format (e.g. +5511999998888)'),
    message: z.string().min(1).max(4096).describe('Message text to send'),
    mediaUrl: z.string().url().optional().describe('Optional URL of media to attach'),
  }),
  requiresApproval: true,

  execute: async (input: unknown, context: ToolExecutionContext) => {
    const { to, message, mediaUrl } = input as {
      to: string;
      message: string;
      mediaUrl?: string;
    };

    // Validate phone number format
    if (!E164_REGEX.test(to)) {
      return {
        success: false,
        error: `Invalid phone number format: "${to}". Must be E.164 format (e.g. +5511999998888).`,
      };
    }

    // Look up WhatsApp connection for this project
    const [connection] = await db
      .select()
      .from(whatsappConnections)
      .where(eq(whatsappConnections.projectId, context.projectId))
      .limit(1);

    if (!connection) {
      return {
        success: false,
        error: 'No WhatsApp connection configured for this project. Set it up in Settings > Tools.',
      };
    }

    if (connection.status !== 'connected') {
      return {
        success: false,
        error: `WhatsApp connection is ${connection.status}. Please reconnect in Settings > Tools.`,
      };
    }

    // Insert message with 'pending' status (audit trail before sending)
    const [messageRecord] = await db
      .insert(whatsappMessages)
      .values({
        projectId: context.projectId,
        connectionId: connection.id,
        direction: 'outbound',
        status: 'pending',
        contactPhone: to,
        content: message,
        mediaUrl,
        agentId: context.agentId,
      })
      .returning();

    // Send via provider (wrapped in try/catch for network errors)
    try {
      // Decrypt credentials if stored encrypted
      const rawCreds = connection.apiCredentials as { encrypted?: string } | WhatsAppCredentials | null;
      const credentials: WhatsAppCredentials =
        rawCreds && 'encrypted' in rawCreds && rawCreds.encrypted
          ? JSON.parse(decryptCredentials(rawCreds.encrypted))
          : (rawCreds ?? {}) as WhatsAppCredentials;

      const client = createWhatsAppClient(
        connection.provider as WhatsAppProvider,
        credentials,
        connection.phoneNumber ?? undefined,
      );

      const result = await client.sendMessage({ to, message, mediaUrl });

      // Update message record with provider response
      await db
        .update(whatsappMessages)
        .set({
          providerMessageId: result.providerMessageId || undefined,
          status: result.status === 'sent' ? 'sent' : 'failed',
        })
        .where(eq(whatsappMessages.id, messageRecord!.id));

      if (result.status === 'failed') {
        return {
          success: false,
          error: result.error ?? 'Failed to send message',
          messageId: messageRecord!.id,
        };
      }

      return {
        success: true,
        messageId: messageRecord!.id,
        providerMessageId: result.providerMessageId,
        to,
        messageSent: message.slice(0, 200) + (message.length > 200 ? '...' : ''),
      };
    } catch (err) {
      // Network timeout, provider down, etc.
      await db
        .update(whatsappMessages)
        .set({ status: 'failed' })
        .where(eq(whatsappMessages.id, messageRecord!.id));

      const errorMessage = err instanceof Error ? err.message : 'Unknown provider error';
      return {
        success: false,
        error: `Provider error: ${errorMessage}`,
        messageId: messageRecord!.id,
      };
    }
  },
};
