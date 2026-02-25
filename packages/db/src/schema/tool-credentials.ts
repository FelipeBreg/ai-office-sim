import {
  pgTable,
  uuid,
  text,
  jsonb,
  timestamp,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { toolTypeEnum } from './enums.js';
import { projects } from './projects.js';

/** OAuth2 / API credentials for third-party tool integrations */
export const toolCredentials = pgTable(
  'tool_credentials',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    toolType: toolTypeEnum('tool_type').notNull(),
    /** Encrypted OAuth2 access token */
    accessToken: text('access_token').notNull(),
    /** Encrypted OAuth2 refresh token */
    refreshToken: text('refresh_token'),
    /** When the access token expires */
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    /** Provider-specific metadata (scopes, account info, etc.) */
    metadata: jsonb('metadata').$type<{
      email?: string;
      scopes?: string[];
      accountName?: string;
      [key: string]: unknown;
    }>(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex('tool_cred_project_type_idx').on(table.projectId, table.toolType),
    index('tool_cred_expires_idx').on(table.expiresAt),
  ],
);
