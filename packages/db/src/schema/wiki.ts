import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { projects } from './projects.js';
import { users } from './users.js';

// ---------------------------------------------------------------------------
// Wiki Categories — hierarchical (max 3 levels)
// ---------------------------------------------------------------------------

export const wikiCategories = pgTable(
  'wiki_categories',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    parentId: uuid('parent_id').references((): any => wikiCategories.id, {
      onDelete: 'set null',
    }),
    name: text('name').notNull(),
    slug: text('slug').notNull(),
    description: text('description'),
    icon: text('icon'),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('wiki_category_project_id_idx').on(table.projectId),
    index('wiki_category_parent_id_idx').on(table.parentId),
    uniqueIndex('wiki_category_project_slug_idx').on(table.projectId, table.slug),
  ],
);

// ---------------------------------------------------------------------------
// Wiki Articles — knowledge base content
// ---------------------------------------------------------------------------

export const wikiArticles = pgTable(
  'wiki_articles',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    categoryId: uuid('category_id').references(() => wikiCategories.id, {
      onDelete: 'set null',
    }),
    title: text('title').notNull(),
    slug: text('slug').notNull(),
    summary: text('summary'),
    content: text('content').notNull(),
    tags: text('tags').array().notNull().default([]),
    authorId: uuid('author_id').references(() => users.id, { onDelete: 'set null' }),
    attachedDocumentIds: uuid('attached_document_ids').array().notNull().default([]),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('wiki_article_project_id_idx').on(table.projectId),
    index('wiki_article_category_id_idx').on(table.categoryId),
    uniqueIndex('wiki_article_project_slug_idx').on(table.projectId, table.slug),
  ],
);
