import { pgTable, uuid, text, integer, numeric, jsonb, timestamp, index } from 'drizzle-orm/pg-core';
import { agents } from './agents.js';
import { projects } from './projects.js';

export const sessionTranscripts = pgTable(
  'session_transcripts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    agentId: uuid('agent_id')
      .notNull()
      .references(() => agents.id, { onDelete: 'cascade' }),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    sessionId: text('session_id').notNull(),
    messages: jsonb('messages').notNull(),
    triggerType: text('trigger_type'),
    tokenCount: integer('token_count'),
    costUsd: numeric('cost_usd', { precision: 10, scale: 6 }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('transcript_agent_id_idx').on(table.agentId),
    index('transcript_project_id_idx').on(table.projectId),
    index('transcript_session_id_idx').on(table.sessionId),
  ],
);
