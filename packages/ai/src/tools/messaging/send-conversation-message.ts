import { z } from 'zod';
import type { ToolDefinition, ToolExecutionContext } from '../../engine/types.js';
import { db, conversations, conversationMessages, eq, and } from '@ai-office/db';

export const sendConversationMessageTool: ToolDefinition = {
  name: 'send_conversation_message',
  description:
    'Send a message in an existing conversation. The message is stored in the unified inbox ' +
    'and the conversation metadata is updated. Use this to reply to customers in WhatsApp, ' +
    'email, or webchat conversations.',
  inputSchema: z.object({
    conversationId: z.string().describe('UUID of the conversation to send the message in'),
    content: z.string().describe('Message content to send'),
    contentType: z
      .enum(['text', 'html'])
      .optional()
      .describe('Content type (default: text)'),
    isInternalNote: z
      .boolean()
      .optional()
      .describe('If true, message is an internal note not visible to the contact (default: false)'),
  }),
  requiresApproval: false,
  isMutation: true,
  execute: async (input: unknown, context: ToolExecutionContext) => {
    const {
      conversationId,
      content,
      contentType = 'text',
      isInternalNote = false,
    } = input as {
      conversationId: string;
      content: string;
      contentType?: string;
      isInternalNote?: boolean;
    };

    // Verify conversation belongs to this project
    const [conv] = await db
      .select({ id: conversations.id, channel: conversations.channel })
      .from(conversations)
      .where(
        and(
          eq(conversations.id, conversationId),
          eq(conversations.projectId, context.projectId),
        ),
      )
      .limit(1);

    if (!conv) {
      return { success: false, error: 'Conversation not found or does not belong to this project' };
    }

    // Insert message
    const [message] = await db
      .insert(conversationMessages)
      .values({
        conversationId,
        direction: isInternalNote ? 'internal_note' : 'outbound',
        senderType: 'agent',
        senderId: context.agentId,
        content: content.slice(0, 50_000),
        contentType: contentType as 'text' | 'html',
      })
      .returning({ id: conversationMessages.id });

    // Update conversation last message
    await db
      .update(conversations)
      .set({
        lastMessageAt: new Date(),
        lastMessagePreview: content.slice(0, 200),
      })
      .where(eq(conversations.id, conversationId));

    return {
      success: true,
      messageId: message!.id,
      channel: conv.channel,
      message: `Message sent in ${conv.channel} conversation.`,
    };
  },
};
