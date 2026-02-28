import {
  pgTable,
  uuid,
  text,
  integer,
  numeric,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';
import { pgEnum } from 'drizzle-orm/pg-core';
import { projects } from './projects.js';

export const campaignPlatformEnum = pgEnum('campaign_platform', [
  'meta_ads',
  'youtube_ads',
  'email',
  'linkedin',
  'instagram',
  'google_ads',
  'tiktok',
  'other',
]);

export const campaignStatusEnum = pgEnum('campaign_status', [
  'active',
  'paused',
  'completed',
]);

export const funnelStageEnum = pgEnum('funnel_stage', [
  'top',
  'middle',
  'bottom',
]);

export const marketingCampaigns = pgTable(
  'marketing_campaigns',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    platform: campaignPlatformEnum('platform').notNull().default('other'),
    status: campaignStatusEnum('status').notNull().default('active'),
    spend: numeric('spend', { precision: 12, scale: 2 }).default('0'),
    impressions: integer('impressions').default(0),
    clicks: integer('clicks').default(0),
    conversions: integer('conversions').default(0),
    revenue: numeric('revenue', { precision: 12, scale: 2 }).default('0'),
    startDate: timestamp('start_date', { withTimezone: true }),
    endDate: timestamp('end_date', { withTimezone: true }),
    funnelStage: funnelStageEnum('funnel_stage').notNull().default('top'),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('campaign_project_id_idx').on(table.projectId),
    index('campaign_status_idx').on(table.status),
    index('campaign_funnel_idx').on(table.funnelStage),
  ],
);
