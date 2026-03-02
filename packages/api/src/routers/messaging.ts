import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { createTRPCRouter, projectProcedure, adminProcedure } from '../trpc.js';
import {
  db,
  conversations,
  conversationMessages,
  agents,
  users,
  eq,
  and,
  desc,
  ilike,
  sql,
} from '@ai-office/db';

export const messagingRouter = createTRPCRouter({
  // ── List conversations (paginated, filterable) ──
  listConversations: projectProcedure
    .input(
      z.object({
        channel: z.enum(['whatsapp', 'email', 'webchat']).optional(),
        status: z.enum(['open', 'snoozed', 'resolved', 'closed']).optional(),
        assignedAgentId: z.string().uuid().optional(),
        assignedUserId: z.string().uuid().optional(),
        limit: z.number().int().min(1).max(100).default(50),
        cursor: z.string().uuid().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const projectId = ctx.project!.id;
      const conditions = [eq(conversations.projectId, projectId)];

      if (input.channel) {
        conditions.push(eq(conversations.channel, input.channel));
      }
      if (input.status) {
        conditions.push(eq(conversations.status, input.status));
      }
      if (input.assignedAgentId) {
        conditions.push(eq(conversations.assignedAgentId, input.assignedAgentId));
      }
      if (input.assignedUserId) {
        conditions.push(eq(conversations.assignedUserId, input.assignedUserId));
      }

      const rows = await db
        .select()
        .from(conversations)
        .where(and(...conditions))
        .orderBy(desc(conversations.lastMessageAt))
        .limit(input.limit + 1);

      const hasMore = rows.length > input.limit;
      const items = hasMore ? rows.slice(0, input.limit) : rows;

      return {
        items,
        nextCursor: hasMore ? items[items.length - 1]?.id : undefined,
      };
    }),

  // ── Get single conversation + messages ──
  getConversation: projectProcedure
    .input(
      z.object({
        conversationId: z.string().uuid(),
        messageLimit: z.number().int().min(1).max(200).default(50),
        messageCursor: z.string().uuid().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const projectId = ctx.project!.id;

      const [conv] = await db
        .select()
        .from(conversations)
        .where(
          and(
            eq(conversations.id, input.conversationId),
            eq(conversations.projectId, projectId),
          ),
        )
        .limit(1);

      if (!conv) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Conversation not found' });
      }

      const messages = await db
        .select()
        .from(conversationMessages)
        .where(eq(conversationMessages.conversationId, input.conversationId))
        .orderBy(desc(conversationMessages.createdAt))
        .limit(input.messageLimit + 1);

      const hasMore = messages.length > input.messageLimit;
      const items = hasMore ? messages.slice(0, input.messageLimit) : messages;

      return {
        conversation: conv,
        messages: items.reverse(),
        hasMoreMessages: hasMore,
        nextMessageCursor: hasMore ? items[0]?.id : undefined,
      };
    }),

  // ── Send a message in a conversation ──
  sendMessage: adminProcedure
    .input(
      z.object({
        conversationId: z.string().uuid(),
        content: z.string().min(1),
        contentType: z.enum(['text', 'html', 'image', 'file', 'template']).default('text'),
        isInternalNote: z.boolean().default(false),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const projectId = ctx.project!.id;
      const userId = ctx.user!.id;

      const [conv] = await db
        .select()
        .from(conversations)
        .where(
          and(
            eq(conversations.id, input.conversationId),
            eq(conversations.projectId, projectId),
          ),
        )
        .limit(1);

      if (!conv) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Conversation not found' });
      }

      const [message] = await db
        .insert(conversationMessages)
        .values({
          conversationId: input.conversationId,
          direction: input.isInternalNote ? 'internal_note' : 'outbound',
          senderType: 'user',
          senderId: userId,
          content: input.content,
          contentType: input.contentType,
        })
        .returning();

      // Update conversation last message
      await db
        .update(conversations)
        .set({
          lastMessageAt: new Date(),
          lastMessagePreview: input.content.slice(0, 200),
        })
        .where(eq(conversations.id, input.conversationId));

      return message!;
    }),

  // ── Assign conversation to user or agent ──
  assignConversation: adminProcedure
    .input(
      z.object({
        conversationId: z.string().uuid(),
        assignedAgentId: z.string().uuid().nullable().optional(),
        assignedUserId: z.string().uuid().nullable().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const projectId = ctx.project!.id;

      const [updated] = await db
        .update(conversations)
        .set({
          assignedAgentId: input.assignedAgentId ?? null,
          assignedUserId: input.assignedUserId ?? null,
        })
        .where(
          and(
            eq(conversations.id, input.conversationId),
            eq(conversations.projectId, projectId),
          ),
        )
        .returning();

      if (!updated) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Conversation not found' });
      }

      return updated;
    }),

  // ── Update conversation status ──
  updateStatus: adminProcedure
    .input(
      z.object({
        conversationId: z.string().uuid(),
        status: z.enum(['open', 'snoozed', 'resolved', 'closed']),
        snoozedUntil: z.string().datetime().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const projectId = ctx.project!.id;

      const setValues: Record<string, unknown> = { status: input.status };
      if (input.status === 'resolved') {
        setValues.resolvedAt = new Date();
      }
      if (input.status === 'snoozed' && input.snoozedUntil) {
        setValues.snoozedUntil = new Date(input.snoozedUntil);
      }

      const [updated] = await db
        .update(conversations)
        .set(setValues)
        .where(
          and(
            eq(conversations.id, input.conversationId),
            eq(conversations.projectId, projectId),
          ),
        )
        .returning();

      if (!updated) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Conversation not found' });
      }

      return updated;
    }),

  // ── Mark conversation as read ──
  markRead: projectProcedure
    .input(z.object({ conversationId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const projectId = ctx.project!.id;

      await db
        .update(conversations)
        .set({ unreadCount: 0 })
        .where(
          and(
            eq(conversations.id, input.conversationId),
            eq(conversations.projectId, projectId),
          ),
        );

      return { success: true };
    }),

  // ── Search across messages ──
  search: projectProcedure
    .input(
      z.object({
        query: z.string().min(1).max(200),
        limit: z.number().int().min(1).max(50).default(20),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const projectId = ctx.project!.id;

      const results = await db
        .select({
          messageId: conversationMessages.id,
          conversationId: conversationMessages.conversationId,
          content: conversationMessages.content,
          createdAt: conversationMessages.createdAt,
          channel: conversations.channel,
          contactName: conversations.contactName,
          contactIdentifier: conversations.contactIdentifier,
        })
        .from(conversationMessages)
        .innerJoin(
          conversations,
          eq(conversationMessages.conversationId, conversations.id),
        )
        .where(
          and(
            eq(conversations.projectId, projectId),
            ilike(conversationMessages.content, `%${input.query}%`),
          ),
        )
        .orderBy(desc(conversationMessages.createdAt))
        .limit(input.limit);

      return results;
    }),
});
