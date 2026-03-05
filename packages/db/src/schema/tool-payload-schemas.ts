import {
  pgTable,
  uuid,
  text,
  integer,
  jsonb,
  timestamp,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core';
import { projects } from './projects.js';

export const toolPayloadSchemas = pgTable(
  'tool_payload_schemas',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    toolName: text('tool_name').notNull(),
    inputSchema: jsonb('input_schema').$type<Record<string, unknown>>(),
    outputSchema: jsonb('output_schema').$type<Record<string, unknown>>(),
    version: integer('version').notNull().default(1),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex('tool_payload_schema_unique_idx').on(table.projectId, table.toolName, table.version),
    index('tool_payload_schema_project_idx').on(table.projectId),
    index('tool_payload_schema_tool_idx').on(table.toolName),
  ],
);
