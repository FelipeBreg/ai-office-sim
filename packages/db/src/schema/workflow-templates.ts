import {
  pgTable,
  uuid,
  text,
  integer,
  jsonb,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

/** React Flow node/edge definitions stored in JSONB */
export interface WorkflowTemplateDefinition {
  nodes: unknown[];
  edges: unknown[];
}

export const workflowTemplates = pgTable(
  'workflow_templates',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    slug: text('slug').notNull(),
    nameEn: text('name_en').notNull(),
    namePtBr: text('name_pt_br').notNull(),
    descriptionEn: text('description_en').notNull(),
    descriptionPtBr: text('description_pt_br').notNull(),
    category: text('category').notNull(),
    icon: text('icon').notNull().default('git-branch'),
    nodeCount: integer('node_count').notNull().default(0),
    definition: jsonb('definition').$type<WorkflowTemplateDefinition>().notNull(),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex('workflow_template_slug_idx').on(table.slug)],
);
