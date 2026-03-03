import {
  pgTable,
  uuid,
  text,
  integer,
  numeric,
  boolean,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';
import {
  strategyTypeEnum,
  strategyStatusEnum,
  kpiDirectionEnum,
  kpiTriggerDirectionEnum,
  goalHorizonEnum,
  goalStatusEnum,
} from './enums.js';
import { projects } from './projects.js';
import { users } from './users.js';
import { agents } from './agents.js';
import { workflows } from './workflows.js';

export const strategies = pgTable(
  'strategies',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    type: strategyTypeEnum('type').notNull(),
    userDraft: text('user_draft'),
    aiRefined: text('ai_refined'),
    status: strategyStatusEnum('status').notNull().default('planned'),
    startDate: timestamp('start_date', { withTimezone: true }),
    endDate: timestamp('end_date', { withTimezone: true }),
    version: integer('version').notNull().default(1),
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [index('strategy_project_id_idx').on(table.projectId)],
);

export const strategyKpis = pgTable(
  'strategy_kpis',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    strategyId: uuid('strategy_id')
      .notNull()
      .references(() => strategies.id, { onDelete: 'cascade' }),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    currentValue: numeric('current_value', { precision: 12, scale: 2 }),
    targetValue: numeric('target_value', { precision: 12, scale: 2 }),
    unit: text('unit'),
    direction: kpiDirectionEnum('direction').notNull().default('higher_is_better'),
    /** KPI trigger: agent to fire when threshold is crossed */
    triggerAgentId: uuid('trigger_agent_id').references(() => agents.id, { onDelete: 'set null' }),
    /** KPI trigger: workflow to fire when threshold is crossed */
    triggerWorkflowId: uuid('trigger_workflow_id').references(() => workflows.id, { onDelete: 'set null' }),
    /** KPI trigger: direction of threshold crossing */
    triggerDirection: kpiTriggerDirectionEnum('trigger_direction'),
    /** KPI trigger: threshold value */
    triggerThreshold: numeric('trigger_threshold', { precision: 12, scale: 2 }),
    /** KPI trigger: minimum minutes between fires (default 60, min 15) */
    triggerCooldownMin: integer('trigger_cooldown_min').notNull().default(60),
    /** KPI trigger: last time this KPI triggered an agent/workflow */
    lastTriggeredAt: timestamp('last_triggered_at', { withTimezone: true }),
    /** Whether this KPI is actively monitored for threshold triggers */
    isMonitored: boolean('is_monitored').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [index('strategy_kpi_strategy_id_idx').on(table.strategyId)],
);

export const strategyGoals = pgTable(
  'strategy_goals',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    strategyId: uuid('strategy_id')
      .notNull()
      .references(() => strategies.id, { onDelete: 'cascade' }),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    horizon: goalHorizonEnum('horizon').notNull(),
    title: text('title').notNull(),
    description: text('description'),
    deadline: timestamp('deadline', { withTimezone: true }),
    status: goalStatusEnum('status').notNull().default('planned'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('strategy_goal_strategy_id_idx').on(table.strategyId),
    index('strategy_goal_project_id_idx').on(table.projectId),
  ],
);

export const strategyGoalKpis = pgTable(
  'strategy_goal_kpis',
  {
    goalId: uuid('goal_id')
      .notNull()
      .references(() => strategyGoals.id, { onDelete: 'cascade' }),
    kpiId: uuid('kpi_id')
      .notNull()
      .references(() => strategyKpis.id, { onDelete: 'cascade' }),
  },
  (table) => [index('strategy_goal_kpi_idx').on(table.goalId, table.kpiId)],
);

export const strategyLearnings = pgTable(
  'strategy_learnings',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    strategyId: uuid('strategy_id')
      .notNull()
      .references(() => strategies.id, { onDelete: 'cascade' }),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    agentId: uuid('agent_id')
      .notNull()
      .references(() => agents.id, { onDelete: 'cascade' }),
    insight: text('insight').notNull(),
    recommendation: text('recommendation'),
    confidence: numeric('confidence', { precision: 5, scale: 4 }),
    isApplied: boolean('is_applied').notNull().default(false),
    appliedAt: timestamp('applied_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('strategy_learning_strategy_id_idx').on(table.strategyId)],
);
