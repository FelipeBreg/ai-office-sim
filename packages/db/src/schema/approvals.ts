import { pgTable, uuid, text, jsonb, timestamp, index } from 'drizzle-orm/pg-core';
import { riskLevelEnum, approvalStatusEnum } from './enums.js';
import { projects } from './projects.js';
import { agents } from './agents.js';
import { actionLogs } from './action-logs.js';
import { users } from './users.js';

export const approvals = pgTable(
  'approvals',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    agentId: uuid('agent_id')
      .notNull()
      .references(() => agents.id, { onDelete: 'cascade' }),
    actionLogId: uuid('action_log_id')
      .notNull()
      .references(() => actionLogs.id, { onDelete: 'cascade' }),
    actionType: text('action_type').notNull(),
    actionPayload: jsonb('action_payload'),
    reason: text('reason'),
    riskLevel: riskLevelEnum('risk_level').notNull().default('low'),
    status: approvalStatusEnum('status').notNull().default('pending'),
    reviewedBy: uuid('reviewed_by').references(() => users.id, { onDelete: 'set null' }),
    reviewComment: text('review_comment'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  },
  (table) => [
    index('approval_project_id_idx').on(table.projectId),
    index('approval_agent_id_idx').on(table.agentId),
    index('approval_status_idx').on(table.status),
  ],
);
