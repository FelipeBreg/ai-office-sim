import {
  pgTable,
  uuid,
  text,
  jsonb,
  timestamp,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import {
  whatsappProviderEnum,
  whatsappConnectionStatusEnum,
  whatsappMessageDirectionEnum,
  whatsappMessageStatusEnum,
  whatsappTemplateStatusEnum,
} from './enums.js';
import { projects } from './projects.js';
import { agents } from './agents.js';

/** WhatsApp connection for a project (one per project) */
export const whatsappConnections = pgTable(
  'whatsapp_connections',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    provider: whatsappProviderEnum('provider').notNull(),
    status: whatsappConnectionStatusEnum('status').notNull().default('disconnected'),
    phoneNumber: text('phone_number'),
    apiCredentials: jsonb('api_credentials').$type<
      | {
          instanceId?: string;
          token?: string;
          accountSid?: string;
          authToken?: string;
          phoneNumberId?: string;
          accessToken?: string;
        }
      | { encrypted: string }
    >(),
    handlerAgentId: uuid('handler_agent_id').references(() => agents.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex('whatsapp_conn_project_idx').on(table.projectId),
    index('whatsapp_conn_status_idx').on(table.status),
  ],
);

/** WhatsApp messages (inbound + outbound) */
export const whatsappMessages = pgTable(
  'whatsapp_messages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    connectionId: uuid('connection_id')
      .notNull()
      .references(() => whatsappConnections.id, { onDelete: 'cascade' }),
    direction: whatsappMessageDirectionEnum('direction').notNull(),
    status: whatsappMessageStatusEnum('status').notNull().default('sent'),
    contactPhone: text('contact_phone').notNull(),
    contactName: text('contact_name'),
    content: text('content').notNull(),
    mediaUrl: text('media_url'),
    providerMessageId: text('provider_message_id'),
    agentId: uuid('agent_id').references(() => agents.id, { onDelete: 'set null' }),
    rawPayload: jsonb('raw_payload'),
    sentAt: timestamp('sent_at', { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('whatsapp_msg_project_idx').on(table.projectId),
    index('whatsapp_msg_contact_idx').on(table.projectId, table.contactPhone),
    index('whatsapp_msg_agent_idx').on(table.agentId),
    index('whatsapp_msg_sent_at_idx').on(table.sentAt),
  ],
);

/** WhatsApp pre-approved message templates */
export const whatsappTemplates = pgTable(
  'whatsapp_templates',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    templateName: text('template_name').notNull(),
    language: text('language').notNull().default('pt-BR'),
    content: text('content').notNull(),
    status: whatsappTemplateStatusEnum('status').notNull().default('pending'),
    providerTemplateId: text('provider_template_id'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('whatsapp_tpl_project_idx').on(table.projectId),
    uniqueIndex('whatsapp_tpl_project_name_idx').on(table.projectId, table.templateName),
  ],
);
