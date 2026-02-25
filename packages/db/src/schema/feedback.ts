import { pgTable, uuid, text, integer, jsonb, timestamp, index } from 'drizzle-orm/pg-core';
import { feedbackCategoryEnum } from './enums.js';
import { projects } from './projects.js';
import { users } from './users.js';

export const feedback = pgTable(
  'feedback',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    rating: integer('rating').notNull(),
    category: feedbackCategoryEnum('category').notNull(),
    description: text('description').notNull(),
    screenshotUrl: text('screenshot_url'),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('feedback_project_id_idx').on(table.projectId),
    index('feedback_category_idx').on(table.category),
    index('feedback_created_at_idx').on(table.createdAt),
  ],
);
