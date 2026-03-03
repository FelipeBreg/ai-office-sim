import {
  pgTable,
  uuid,
  text,
  jsonb,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';
import { organizations } from './organizations.js';
import { projects } from './projects.js';
import { users } from './users.js';

export const auditLogs = pgTable(
  'audit_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: uuid('org_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    projectId: uuid('project_id')
      .references(() => projects.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    // What happened
    resource: text('resource').notNull(),     // 'agent' | 'workflow' | 'deal' | ...
    action: text('action').notNull(),         // 'create' | 'update' | 'delete' | ...
    resourceId: text('resource_id'),          // ID of the affected resource
    path: text('path').notNull(),             // tRPC path e.g. 'agents.create'

    // State snapshots
    input: jsonb('input'),                    // mutation input (sanitized)
    result: jsonb('result'),                  // mutation result summary

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('audit_log_org_created_idx').on(table.orgId, table.createdAt),
    index('audit_log_project_created_idx').on(table.projectId, table.createdAt),
    index('audit_log_user_id_idx').on(table.userId),
    index('audit_log_resource_idx').on(table.resource, table.action),
  ],
);
