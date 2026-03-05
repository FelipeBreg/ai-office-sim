import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { agents } from './agents.js';
import { projects } from './projects.js';

export const agentTrustScores = pgTable(
  'agent_trust_scores',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    agentId: uuid('agent_id')
      .notNull()
      .references(() => agents.id, { onDelete: 'cascade' }),
    toolName: text('tool_name').notNull(),
    /** Consecutive successful uses of this tool */
    successCount: integer('success_count').notNull().default(0),
    /** Total failures (for display/analytics) */
    failureCount: integer('failure_count').notNull().default(0),
    /** Last time this tool failed (for display) */
    lastFailureAt: timestamp('last_failure_at', { withTimezone: true }),
    /** Whether this tool is auto-approved for this agent */
    autoApproved: boolean('auto_approved').notNull().default(false),
    /** N successes needed (inherited from project config, cached here) */
    threshold: integer('threshold').notNull().default(10),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex('trust_agent_tool_idx').on(table.agentId, table.toolName),
    index('trust_project_id_idx').on(table.projectId),
    index('trust_agent_id_idx').on(table.agentId),
  ],
);
