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

export const financialRecordTypeEnum = pgEnum('financial_record_type', [
  'revenue',
  'expense',
  'tax',
  'investment',
]);

export const financialCategoryEnum = pgEnum('financial_category', [
  'mrr',
  'arr',
  'cogs',
  'salary',
  'tax_obligation',
  'marketing_spend',
  'infrastructure',
  'software',
  'consulting',
  'other',
]);

export const financialRecords = pgTable(
  'financial_records',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    type: financialRecordTypeEnum('type').notNull(),
    category: financialCategoryEnum('category').notNull().default('other'),
    label: text('label').notNull(),
    amount: numeric('amount', { precision: 14, scale: 2 }).notNull(),
    currency: text('currency').notNull().default('BRL'),
    periodStart: timestamp('period_start', { withTimezone: true }),
    periodEnd: timestamp('period_end', { withTimezone: true }),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('financial_record_project_id_idx').on(table.projectId),
    index('financial_record_type_idx').on(table.type),
    index('financial_record_category_idx').on(table.category),
  ],
);
