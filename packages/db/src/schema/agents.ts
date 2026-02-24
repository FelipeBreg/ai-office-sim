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
import {
  agentArchetypeEnum,
  agentStatusEnum,
  triggerTypeEnum,
  memoryScopeEnum,
} from './enums.js';
import { projects } from './projects.js';
import { vector } from './custom-types.js';

export const agents = pgTable(
  'agents',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    namePtBr: text('name_pt_br'),
    slug: text('slug').notNull(),
    archetype: agentArchetypeEnum('archetype').notNull().default('custom'),
    avatarUrl: text('avatar_url'),
    status: agentStatusEnum('status').notNull().default('offline'),
    systemPromptEn: text('system_prompt_en'),
    systemPromptPtBr: text('system_prompt_pt_br'),
    config: jsonb('config').$type<{
      model: string;
      temperature: number;
      maxTokens: number;
      budget: number;
    }>(),
    tools: text('tools').array(),
    memoryScope: memoryScopeEnum('memory_scope').notNull().default('read_write'),
    triggerType: triggerTypeEnum('trigger_type').notNull().default('manual'),
    triggerConfig: jsonb('trigger_config').$type<{
      cron?: string;
      eventName?: string;
      sourceAgentId?: string;
    }>(),
    maxActionsPerSession: integer('max_actions_per_session').notNull().default(20),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex('agent_project_slug_idx').on(table.projectId, table.slug),
    index('agent_project_id_idx').on(table.projectId),
    index('agent_status_idx').on(table.status),
    index('agent_archetype_idx').on(table.archetype),
  ],
);

export const agentMemory = pgTable(
  'agent_memory',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    agentId: uuid('agent_id')
      .notNull()
      .references(() => agents.id, { onDelete: 'cascade' }),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    key: text('key').notNull(),
    value: jsonb('value').notNull(),
    embedding: vector('embedding'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('agent_memory_agent_id_idx').on(table.agentId),
    index('agent_memory_project_id_idx').on(table.projectId),
  ],
);
