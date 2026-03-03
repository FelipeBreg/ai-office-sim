import { pgTable, uuid, integer, numeric, jsonb, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { projects } from './projects.js';

export const orchestratorConfig = pgTable(
  'orchestrator_config',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    /** Max agents executing concurrently */
    maxConcurrency: integer('max_concurrency').notNull().default(5),
    /** Daily token budget across all agents (0 = unlimited) */
    dailyTokenBudget: integer('daily_token_budget').notNull().default(0),
    /** Monthly token budget across all agents (0 = unlimited) */
    monthlyTokenBudget: integer('monthly_token_budget').notNull().default(0),
    /** Daily USD spend limit (0 = unlimited) */
    dailySpendLimitUsd: numeric('daily_spend_limit_usd', { precision: 10, scale: 2 }).notNull().default('0'),
    /** Monthly USD spend limit (0 = unlimited) */
    monthlySpendLimitUsd: numeric('monthly_spend_limit_usd', { precision: 10, scale: 2 }).notNull().default('0'),
    /** Hours before pending approvals auto-expire (default 48) */
    approvalTimeoutHours: integer('approval_timeout_hours').notNull().default(48),
    /** Max cascade depth before rejecting (default 5) */
    maxCascadeDepth: integer('max_cascade_depth').notNull().default(5),
    /** Priority rules: JSON array of { team, priority, maxConcurrency } */
    priorityRules: jsonb('priority_rules').$type<{
      team: string;
      priority: 'critical' | 'high' | 'normal' | 'low';
      maxConcurrency?: number;
    }[]>(),
    /** Whether the orchestrator is enabled for this project */
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [uniqueIndex('orchestrator_config_project_id_idx').on(table.projectId)],
);
