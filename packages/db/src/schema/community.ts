import {
  pgTable,
  uuid,
  text,
  boolean,
  integer,
  jsonb,
  timestamp,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { users } from './users.js';
import { organizations } from './organizations.js';
import { projects } from './projects.js';

export const communityListings = pgTable(
  'community_listings',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    type: text('type').notNull(), // 'agent' | 'workflow'
    slug: text('slug').notNull().unique(),
    nameEn: text('name_en').notNull(),
    namePtBr: text('name_pt_br'),
    descriptionEn: text('description_en').notNull(),
    descriptionPtBr: text('description_pt_br'),
    category: text('category').notNull(), // archetype for agents, workflow category
    icon: text('icon').default('bot'),
    snapshot: jsonb('snapshot').notNull(),
    publishedById: uuid('published_by_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    orgId: uuid('org_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    installCount: integer('install_count').notNull().default(0),
    ratingSum: integer('rating_sum').notNull().default(0),
    ratingCount: integer('rating_count').notNull().default(0),
    isVerified: boolean('is_verified').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex('community_listing_slug_idx').on(table.slug),
    index('community_listing_type_category_idx').on(table.type, table.category),
    index('community_listing_published_by_idx').on(table.publishedById),
    index('community_listing_install_count_idx').on(table.installCount),
    index('community_listing_created_at_idx').on(table.createdAt),
  ],
);

export const communityInstalls = pgTable(
  'community_installs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    listingId: uuid('listing_id')
      .notNull()
      .references(() => communityListings.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    installedAt: timestamp('installed_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('community_install_listing_project_idx').on(table.listingId, table.projectId),
  ],
);

export const communityReviews = pgTable(
  'community_reviews',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    listingId: uuid('listing_id')
      .notNull()
      .references(() => communityListings.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    rating: integer('rating').notNull(),
    comment: text('comment'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex('community_review_listing_user_idx').on(table.listingId, table.userId),
    index('community_review_listing_idx').on(table.listingId),
  ],
);
