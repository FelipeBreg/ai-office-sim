import {
  pgTable,
  uuid,
  text,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';
import { pgEnum } from 'drizzle-orm/pg-core';
import { projects } from './projects.js';

export const touchpointTypeEnum = pgEnum('touchpoint_type', [
  'linkedin',
  'instagram',
  'twitter',
  'facebook',
  'domain',
  'physical',
  'youtube',
  'tiktok',
  'email',
  'other',
]);

export const touchpointStatusEnum = pgEnum('touchpoint_status', [
  'active',
  'inactive',
  'planned',
]);

export const brandTouchpoints = pgTable(
  'brand_touchpoints',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    type: touchpointTypeEnum('type').notNull().default('other'),
    label: text('label').notNull(),
    url: text('url'),
    description: text('description'),
    status: touchpointStatusEnum('status').notNull().default('active'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('touchpoint_project_id_idx').on(table.projectId),
    index('touchpoint_type_idx').on(table.type),
  ],
);
