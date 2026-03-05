import {
  pgTable,
  uuid,
  date,
  integer,
  numeric,
  jsonb,
  timestamp,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { agents } from './agents.js';
import { projects } from './projects.js';

export const agentPerformanceSnapshots = pgTable(
  'agent_performance_snapshots',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    agentId: uuid('agent_id')
      .notNull()
      .references(() => agents.id, { onDelete: 'cascade' }),
    snapshotDate: date('snapshot_date').notNull(),
    sessionsRun: integer('sessions_run').notNull().default(0),
    actionsExecuted: integer('actions_executed').notNull().default(0),
    actionsSucceeded: integer('actions_succeeded').notNull().default(0),
    actionsFailed: integer('actions_failed').notNull().default(0),
    tokensUsed: integer('tokens_used').notNull().default(0),
    costUsd: numeric('cost_usd', { precision: 10, scale: 6 }).notNull().default('0'),
    avgSessionDurationMs: integer('avg_session_duration_ms').notNull().default(0),
    /** Per-tool breakdown: { "send_email": { success: 10, fail: 1 }, ... } */
    toolBreakdown: jsonb('tool_breakdown').$type<Record<string, { success: number; fail: number }>>(),
    /** Outcome signals: { "emails_sent": 15, "replies_received": 2, ... } */
    outcomeSignals: jsonb('outcome_signals').$type<Record<string, number>>(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('perf_agent_date_idx').on(table.agentId, table.snapshotDate),
    index('perf_project_id_idx').on(table.projectId),
    index('perf_agent_id_idx').on(table.agentId),
  ],
);
