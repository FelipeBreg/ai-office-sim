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
  agentTeamEnum,
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
    ragDocuments: text('rag_documents').array(),
    team: agentTeamEnum('team'),
    memoryScope: memoryScopeEnum('memory_scope').notNull().default('read_write'),
    triggerType: triggerTypeEnum('trigger_type').notNull().default('manual'),
    triggerConfig: jsonb('trigger_config').$type<{
      cron?: string;
      eventName?: string;
      sourceAgentId?: string;
    }>(),
    maxActionsPerSession: integer('max_actions_per_session').notNull().default(20),
    isActive: boolean('is_active').notNull().default(true),
    /** System agents (e.g., CEO) cannot be deleted by users */
    isSystemAgent: boolean('is_system_agent').notNull().default(false),
    /** Auto-recovery: when the agent can next be retried after an error */
    cooldownUntil: timestamp('cooldown_until', { withTimezone: true }),
    /** Auto-recovery: how many consecutive recovery attempts have been made */
    recoveryAttempts: integer('recovery_attempts').notNull().default(0),
    /** Heartbeat: self-programmed instructions executed on each heartbeat (max 500 chars) */
    heartbeatInstructions: text('heartbeat_instructions'),
    /** Heartbeat: interval in minutes (null = disabled, min 5, max 1440) */
    heartbeatIntervalMin: integer('heartbeat_interval_min'),
    /** Heartbeat: last time this agent was woken by heartbeat */
    lastHeartbeatAt: timestamp('last_heartbeat_at', { withTimezone: true }),
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
    index('agent_team_idx').on(table.team),
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
    uniqueIndex('agent_memory_agent_project_key_idx').on(table.agentId, table.projectId, table.key),
  ],
);
