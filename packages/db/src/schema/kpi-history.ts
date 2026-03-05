import {
  pgTable,
  uuid,
  text,
  numeric,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';
import { pgEnum } from 'drizzle-orm/pg-core';
import { projects } from './projects.js';

export const kpiSourceEnum = pgEnum('kpi_source', [
  'agent',
  'manual',
  'sync',
  'system',
]);

export const kpiHistory = pgTable(
  'kpi_history',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    kpiId: uuid('kpi_id').notNull(),
    value: numeric('value', { precision: 20, scale: 6 }).notNull(),
    source: kpiSourceEnum('source').notNull().default('system'),
    /** ID of the agent or sync job that produced this value */
    sourceId: text('source_id'),
    recordedAt: timestamp('recorded_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('kpi_history_kpi_id_idx').on(table.kpiId, table.recordedAt),
    index('kpi_history_project_id_idx').on(table.projectId),
  ],
);
