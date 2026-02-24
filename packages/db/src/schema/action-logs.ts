import {
  pgTable,
  uuid,
  text,
  integer,
  numeric,
  jsonb,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';
import { actionStatusEnum } from './enums.js';
import { projects } from './projects.js';
import { agents } from './agents.js';

export const actionLogs = pgTable(
  'action_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    agentId: uuid('agent_id')
      .notNull()
      .references(() => agents.id, { onDelete: 'cascade' }),
    sessionId: uuid('session_id').notNull(),
    actionType: text('action_type').notNull(), // 'tool_call' | 'llm_response' | 'approval_request'
    toolName: text('tool_name'),
    input: jsonb('input'),
    output: jsonb('output'),
    status: actionStatusEnum('status').notNull().default('pending'),
    error: text('error'),
    tokensUsed: integer('tokens_used'),
    costUsd: numeric('cost_usd', { precision: 10, scale: 6 }),
    durationMs: integer('duration_ms'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('action_log_project_created_idx').on(table.projectId, table.createdAt),
    index('action_log_agent_id_idx').on(table.agentId),
    index('action_log_session_id_idx').on(table.sessionId),
    index('action_log_status_idx').on(table.status),
  ],
);
