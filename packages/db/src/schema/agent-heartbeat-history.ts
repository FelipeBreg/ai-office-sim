import { pgTable, uuid, text, timestamp, index } from 'drizzle-orm/pg-core';
import { agents } from './agents.js';

export const agentHeartbeatHistory = pgTable(
  'agent_heartbeat_history',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    agentId: uuid('agent_id')
      .notNull()
      .references(() => agents.id, { onDelete: 'cascade' }),
    instructions: text('instructions').notNull(),
    previousInstructions: text('previous_instructions'),
    changedAt: timestamp('changed_at', { withTimezone: true }).notNull().defaultNow(),
    changedBySessionId: text('changed_by_session_id'),
  },
  (table) => [
    index('heartbeat_history_agent_id_idx').on(table.agentId),
  ],
);
