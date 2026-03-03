import { pgTable, uuid, text, integer, timestamp, index } from 'drizzle-orm/pg-core';
import { agents } from './agents.js';
import { projects } from './projects.js';

export const agentSessionSummaries = pgTable(
  'agent_session_summaries',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    agentId: uuid('agent_id')
      .notNull()
      .references(() => agents.id, { onDelete: 'cascade' }),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    sessionId: text('session_id').notNull(),
    summary: text('summary').notNull(),
    tokenCount: integer('token_count'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('session_summary_agent_created_idx').on(table.agentId, table.createdAt),
    index('session_summary_project_id_idx').on(table.projectId),
  ],
);
