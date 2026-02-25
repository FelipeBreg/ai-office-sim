import {
  pgTable,
  uuid,
  text,
  timestamp,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { projects } from './projects.js';
import { agents } from './agents.js';
import { users } from './users.js';

/** Approval rules: always_allow, always_block, or require_approval per agent+tool */
export const approvalRules = pgTable(
  'approval_rules',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    agentId: uuid('agent_id')
      .notNull()
      .references(() => agents.id, { onDelete: 'cascade' }),
    toolName: text('tool_name').notNull(),
    action: text('action').notNull().$type<'always_allow' | 'always_block' | 'require_approval'>(),
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('approval_rule_unique_idx').on(table.projectId, table.agentId, table.toolName),
    index('approval_rule_project_idx').on(table.projectId),
    index('approval_rule_agent_idx').on(table.agentId),
  ],
);
