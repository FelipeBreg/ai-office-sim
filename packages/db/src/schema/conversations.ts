import {
  pgTable,
  uuid,
  text,
  integer,
  jsonb,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';
import {
  conversationChannelEnum,
  conversationStatusEnum,
  conversationPriorityEnum,
  conversationMessageDirectionEnum,
  conversationSenderTypeEnum,
  conversationContentTypeEnum,
} from './enums.js';
import { projects } from './projects.js';
import { agents } from './agents.js';
import { users } from './users.js';

// ── Conversations ──

export const conversations = pgTable(
  'conversations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    channel: conversationChannelEnum('channel').notNull(),
    contactIdentifier: text('contact_identifier').notNull(),
    contactName: text('contact_name'),
    status: conversationStatusEnum('status').notNull().default('open'),
    priority: conversationPriorityEnum('priority').notNull().default('medium'),
    assignedAgentId: uuid('assigned_agent_id').references(() => agents.id, {
      onDelete: 'set null',
    }),
    assignedUserId: uuid('assigned_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    handlerAgentId: uuid('handler_agent_id').references(() => agents.id, {
      onDelete: 'set null',
    }),
    lastMessageAt: timestamp('last_message_at', { withTimezone: true }),
    lastMessagePreview: text('last_message_preview'),
    unreadCount: integer('unread_count').notNull().default(0),
    metadata: jsonb('metadata'),
    snoozedUntil: timestamp('snoozed_until', { withTimezone: true }),
    resolvedAt: timestamp('resolved_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('conv_project_status_idx').on(table.projectId, table.status),
    index('conv_project_channel_idx').on(table.projectId, table.channel),
    index('conv_project_contact_idx').on(table.projectId, table.contactIdentifier),
  ],
);

// ── Conversation Messages ──

export const conversationMessages = pgTable(
  'conversation_messages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    conversationId: uuid('conversation_id')
      .notNull()
      .references(() => conversations.id, { onDelete: 'cascade' }),
    direction: conversationMessageDirectionEnum('direction').notNull(),
    senderType: conversationSenderTypeEnum('sender_type').notNull(),
    senderId: uuid('sender_id'),
    content: text('content').notNull(),
    contentType: conversationContentTypeEnum('content_type').notNull().default('text'),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('conv_msg_conversation_idx').on(table.conversationId, table.createdAt),
  ],
);
