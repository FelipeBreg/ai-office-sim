import {
  pgTable,
  uuid,
  text,
  jsonb,
  boolean,
  timestamp,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import {
  emailProviderEnum,
  emailConnectionStatusEnum,
  emailMessageStatusEnum,
  emailMessageTypeEnum,
} from './enums.js';
import { projects } from './projects.js';
import { agents } from './agents.js';

/** Email connection for a project (one per project) */
export const emailConnections = pgTable(
  'email_connections',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    provider: emailProviderEnum('provider').notNull(),
    status: emailConnectionStatusEnum('status').notNull().default('disconnected'),
    fromEmail: text('from_email').notNull(),
    fromName: text('from_name'),
    replyTo: text('reply_to'),
    apiCredentials: jsonb('api_credentials').$type<
      | {
          // SMTP
          host?: string;
          port?: number;
          secure?: boolean;
          user?: string;
          pass?: string;
          // IMAP (optional overrides — defaults to SMTP host, port 993, secure true)
          imapHost?: string;
          imapPort?: number;
          imapSecure?: boolean;
          // SendGrid
          apiKey?: string;
          // AWS SES
          accessKeyId?: string;
          secretAccessKey?: string;
          region?: string;
        }
      | { encrypted: string }
    >(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex('email_conn_project_idx').on(table.projectId),
    index('email_conn_status_idx').on(table.status),
  ],
);

/** Email messages (outbound; inbound added in P1-2.2) */
export const emailMessages = pgTable(
  'email_messages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    connectionId: uuid('connection_id')
      .notNull()
      .references(() => emailConnections.id, { onDelete: 'cascade' }),
    status: emailMessageStatusEnum('status').notNull().default('pending'),
    messageType: emailMessageTypeEnum('message_type').notNull().default('transactional'),
    fromEmail: text('from_email').notNull(),
    fromName: text('from_name'),
    toRecipients: text('to_recipients').array().notNull(),
    ccRecipients: text('cc_recipients').array(),
    bccRecipients: text('bcc_recipients').array(),
    subject: text('subject').notNull(),
    bodyHtml: text('body_html').notNull(),
    bodyText: text('body_text'),
    headers: jsonb('headers').$type<Record<string, string>>(),
    attachments: jsonb('attachments').$type<
      Array<{ filename: string; url: string; contentType?: string }>
    >(),
    providerMessageId: text('provider_message_id'),
    agentId: uuid('agent_id').references(() => agents.id, { onDelete: 'set null' }),
    error: text('error'),
    sentAt: timestamp('sent_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('email_msg_project_idx').on(table.projectId),
    index('email_msg_agent_idx').on(table.agentId),
    index('email_msg_status_idx').on(table.status),
    index('email_msg_sent_at_idx').on(table.sentAt),
  ],
);

/** Email templates */
export const emailTemplates = pgTable(
  'email_templates',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    subject: text('subject').notNull(),
    bodyHtml: text('body_html').notNull(),
    bodyText: text('body_text'),
    messageType: emailMessageTypeEnum('message_type').notNull().default('transactional'),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('email_tpl_project_idx').on(table.projectId),
    uniqueIndex('email_tpl_project_name_idx').on(table.projectId, table.name),
  ],
);
