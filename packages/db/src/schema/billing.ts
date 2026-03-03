import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  numeric,
  timestamp,
  date,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { subscriptionStatusEnum, paymentMethodTypeEnum, invoiceStatusEnum } from './enums.js';
import { organizations } from './organizations.js';
import { projects } from './projects.js';

export const subscriptions = pgTable(
  'subscriptions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: uuid('org_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    stripeSubscriptionId: text('stripe_subscription_id').unique(),
    stripePriceId: text('stripe_price_id'),
    status: subscriptionStatusEnum('status').notNull().default('active'),
    paymentMethod: paymentMethodTypeEnum('payment_method').notNull().default('credit_card'),
    currentPeriodStart: timestamp('current_period_start', { withTimezone: true }),
    currentPeriodEnd: timestamp('current_period_end', { withTimezone: true }),
    cancelAtPeriodEnd: boolean('cancel_at_period_end').notNull().default(false),
    canceledAt: timestamp('canceled_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('subscription_org_id_idx').on(table.orgId),
    index('subscription_stripe_id_idx').on(table.stripeSubscriptionId),
  ],
);

export const invoices = pgTable(
  'invoices',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: uuid('org_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    stripeInvoiceId: text('stripe_invoice_id').unique(),
    status: invoiceStatusEnum('status').notNull().default('draft'),
    amountDue: integer('amount_due').notNull().default(0),
    amountPaid: integer('amount_paid').notNull().default(0),
    currency: text('currency').notNull().default('brl'),
    invoiceUrl: text('invoice_url'),
    invoicePdf: text('invoice_pdf'),
    periodStart: timestamp('period_start', { withTimezone: true }),
    periodEnd: timestamp('period_end', { withTimezone: true }),
    paidAt: timestamp('paid_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('invoice_org_id_idx').on(table.orgId),
    index('invoice_stripe_id_idx').on(table.stripeInvoiceId),
  ],
);

/** Daily aggregated token usage per project — populated by billing worker */
export const usageRecords = pgTable(
  'usage_records',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: uuid('org_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    periodDate: date('period_date').notNull(),
    totalTokens: integer('total_tokens').notNull().default(0),
    totalCostUsd: numeric('total_cost_usd', { precision: 12, scale: 6 }).notNull().default('0'),
    actionCount: integer('action_count').notNull().default(0),
    stripeUsageRecordId: text('stripe_usage_record_id'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('usage_record_project_date_idx').on(table.projectId, table.periodDate),
    index('usage_record_org_id_idx').on(table.orgId),
  ],
);

/** Organization token balance — for pay-as-you-go billing */
export const tokenBalances = pgTable(
  'token_balances',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: uuid('org_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' })
      .unique(),
    balanceCents: integer('balance_cents').notNull().default(0),
    autoRechargeEnabled: boolean('auto_recharge_enabled').notNull().default(false),
    autoRechargeThresholdCents: integer('auto_recharge_threshold_cents').notNull().default(500),
    autoRechargeAmountCents: integer('auto_recharge_amount_cents').notNull().default(5000),
    isPaused: boolean('is_paused').notNull().default(false),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
);
