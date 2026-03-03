import {
  pgTable,
  uuid,
  text,
  integer,
  numeric,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';
import { cascadeStatusEnum } from './enums.js';
import { projects } from './projects.js';
import { agents } from './agents.js';

export const cascadeEvents = pgTable(
  'cascade_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    cascadeId: uuid('cascade_id').notNull(),
    agentId: uuid('agent_id').references(() => agents.id, { onDelete: 'set null' }),
    workflowId: uuid('workflow_id'),
    depth: integer('depth').notNull().default(0),
    status: cascadeStatusEnum('status').notNull().default('in_progress'),
    triggerType: text('trigger_type'),
    costUsd: numeric('cost_usd', { precision: 12, scale: 6 }),
    durationMs: integer('duration_ms'),
    parentEventId: uuid('parent_event_id'),
    error: text('error'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('cascade_events_cascade_id_idx').on(table.cascadeId),
    index('cascade_events_project_id_idx').on(table.projectId),
  ],
);
