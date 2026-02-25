import {
  pgTable,
  uuid,
  text,
  integer,
  jsonb,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { marketFocusEnum } from './enums.js';

/** Agent spec for JSONB column — mirrors CompanyTemplateAgent from @ai-office/shared */
interface TemplateAgentSpec {
  archetype: string;
  nameEn: string;
  namePtBr: string;
  tools: string[];
}

/** Workflow spec for JSONB column — mirrors CompanyTemplateWorkflow from @ai-office/shared */
interface TemplateWorkflowSpec {
  nameEn: string;
  namePtBr: string;
  triggerType: string;
  steps: string[];
}

export const companyTemplates = pgTable(
  'company_templates',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    slug: text('slug').notNull(),
    nameEn: text('name_en').notNull(),
    namePtBr: text('name_pt_br').notNull(),
    descriptionEn: text('description_en').notNull(),
    descriptionPtBr: text('description_pt_br').notNull(),
    sector: text('sector').notNull(),
    marketFocus: marketFocusEnum('market_focus').notNull().default('both'),
    defaultAgents: jsonb('default_agents').$type<TemplateAgentSpec[]>().notNull().default([]),
    defaultWorkflows: jsonb('default_workflows').$type<TemplateWorkflowSpec[]>().notNull().default([]),
    icon: text('icon').notNull().default('building'),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('company_template_slug_idx').on(table.slug),
  ],
);
