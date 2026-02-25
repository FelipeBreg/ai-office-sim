import { z } from 'zod';
import { db, whatsappMessages, eq, and, desc } from '@ai-office/db';
import type { ToolDefinition, ToolExecutionContext } from '../../engine/types.js';

export const readWhatsAppMessagesTool: ToolDefinition = {
  name: 'read_whatsapp_messages',
  description:
    'Read recent WhatsApp conversation history with a specific contact. ' +
    'Returns messages with sender, content, and timestamp. ' +
    'Phone number must be in E.164 format (e.g. +5511999998888).',
  inputSchema: z.object({
    contactPhone: z.string().describe('Contact phone number in E.164 format'),
    limit: z.number().int().min(1).max(100).optional().describe('Max messages to return (default: 20)'),
  }),
  requiresApproval: false,

  execute: async (input: unknown, context: ToolExecutionContext) => {
    const { contactPhone, limit = 20 } = input as {
      contactPhone: string;
      limit?: number;
    };

    // Validate E.164 format
    if (!/^\+[1-9]\d{1,14}$/.test(contactPhone)) {
      return {
        contactPhone,
        messageCount: 0,
        messages: [],
        error: `Invalid phone number format: "${contactPhone}". Must be E.164 format (e.g. +5511999998888).`,
      };
    }

    const messages = await db
      .select({
        id: whatsappMessages.id,
        direction: whatsappMessages.direction,
        content: whatsappMessages.content,
        contactPhone: whatsappMessages.contactPhone,
        contactName: whatsappMessages.contactName,
        mediaUrl: whatsappMessages.mediaUrl,
        status: whatsappMessages.status,
        sentAt: whatsappMessages.sentAt,
      })
      .from(whatsappMessages)
      .where(
        and(
          eq(whatsappMessages.projectId, context.projectId),
          eq(whatsappMessages.contactPhone, contactPhone),
        ),
      )
      .orderBy(desc(whatsappMessages.sentAt))
      .limit(limit);

    // Reverse to chronological order (oldest first)
    messages.reverse();

    return {
      contactPhone,
      messageCount: messages.length,
      messages: messages.map((m) => ({
        id: m.id,
        direction: m.direction,
        sender: m.direction === 'inbound' ? (m.contactName ?? m.contactPhone) : 'agent',
        content: m.content,
        mediaUrl: m.mediaUrl,
        status: m.status,
        sentAt: m.sentAt.toISOString(),
      })),
    };
  },
};
