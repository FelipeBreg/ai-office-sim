import {
  pgTable,
  uuid,
  text,
  boolean,
  jsonb,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';
import {
  calendarEventTypeEnum,
  calendarEventStatusEnum,
  calendarEventSourceTypeEnum,
  calendarEventPriorityEnum,
  calendarReminderChannelEnum,
} from './enums.js';
import { projects } from './projects.js';
import { agents } from './agents.js';
import { users } from './users.js';

// ── Calendar Events ──

export const calendarEvents = pgTable(
  'calendar_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    description: text('description'),
    eventType: calendarEventTypeEnum('event_type').notNull(),
    sourceType: calendarEventSourceTypeEnum('source_type').notNull().default('manual'),
    sourceId: uuid('source_id'),
    startAt: timestamp('start_at', { withTimezone: true }).notNull(),
    endAt: timestamp('end_at', { withTimezone: true }),
    allDay: boolean('all_day').notNull().default(false),
    recurrence: jsonb('recurrence').$type<{
      freq: 'daily' | 'weekly' | 'monthly' | 'yearly';
      interval?: number;
      until?: string;
      count?: number;
      byDay?: string[];
    }>(),
    status: calendarEventStatusEnum('status').notNull().default('scheduled'),
    priority: calendarEventPriorityEnum('priority').notNull().default('medium'),
    assignedAgentId: uuid('assigned_agent_id').references(() => agents.id, {
      onDelete: 'set null',
    }),
    assignedUserId: uuid('assigned_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    metadata: jsonb('metadata'),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('cal_event_project_start_idx').on(table.projectId, table.startAt),
    index('cal_event_project_status_idx').on(table.projectId, table.status),
    index('cal_event_project_type_idx').on(table.projectId, table.eventType),
  ],
);

// ── Calendar Reminders ──

export const calendarReminders = pgTable(
  'calendar_reminders',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    eventId: uuid('event_id')
      .notNull()
      .references(() => calendarEvents.id, { onDelete: 'cascade' }),
    remindAt: timestamp('remind_at', { withTimezone: true }).notNull(),
    channel: calendarReminderChannelEnum('channel').notNull().default('in_app'),
    sent: boolean('sent').notNull().default(false),
    sentAt: timestamp('sent_at', { withTimezone: true }),
  },
  (table) => [
    index('cal_reminder_event_idx').on(table.eventId),
    index('cal_reminder_pending_idx').on(table.remindAt, table.sent),
  ],
);
