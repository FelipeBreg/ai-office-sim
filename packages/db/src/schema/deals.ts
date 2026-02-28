import {
  pgTable,
  uuid,
  text,
  integer,
  numeric,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';
import { dealStageEnum } from './enums.js';
import { projects } from './projects.js';
import { agents } from './agents.js';

export const deals = pgTable(
  'deals',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    companyName: text('company_name'),
    contactName: text('contact_name'),
    contactEmail: text('contact_email'),
    value: numeric('value', { precision: 12, scale: 2 }),
    stage: dealStageEnum('stage').notNull().default('prospect'),
    sortOrder: integer('sort_order').notNull().default(0),
    notes: text('notes'),
    crmProvider: text('crm_provider'),
    crmExternalId: text('crm_external_id'),
    crmLastSyncAt: timestamp('crm_last_sync_at', { withTimezone: true }),
    createdByAgentId: uuid('created_by_agent_id').references(() => agents.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('deal_project_id_idx').on(table.projectId),
    index('deal_stage_idx').on(table.stage),
    index('deal_crm_external_idx').on(table.projectId, table.crmExternalId),
  ],
);
