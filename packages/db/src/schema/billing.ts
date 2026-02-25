import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';
import { subscriptionStatusEnum, paymentMethodTypeEnum, invoiceStatusEnum } from './enums.js';
import { organizations } from './organizations.js';

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
