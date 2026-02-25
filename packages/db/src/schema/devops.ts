import {
  pgTable,
  uuid,
  text,
  timestamp,
  index,
  jsonb,
} from 'drizzle-orm/pg-core';
import {
  devopsRequestTypeEnum,
  devopsRequestStatusEnum,
  devopsPriorityEnum,
  humanTaskStatusEnum,
  humanTaskPriorityEnum,
} from './enums.js';
import { projects } from './projects.js';
import { agents } from './agents.js';
import { users } from './users.js';

export const devopsRequests = pgTable(
  'devops_requests',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    agentId: uuid('agent_id')
      .notNull()
      .references(() => agents.id, { onDelete: 'cascade' }),
    type: devopsRequestTypeEnum('type').notNull(),
    priority: devopsPriorityEnum('priority').notNull().default('medium'),
    status: devopsRequestStatusEnum('status').notNull().default('pending'),
    title: text('title').notNull(),
    description: text('description'),
    // Metadata varies by type: branch, commit SHA, PR URL, environment, etc.
    metadata: jsonb('metadata').$type<{
      branch?: string;
      commitSha?: string;
      prUrl?: string;
      prNumber?: number;
      environment?: string;
      repoUrl?: string;
      rollbackTarget?: string;
    }>(),
    reviewedBy: uuid('reviewed_by').references(() => users.id, { onDelete: 'set null' }),
    reviewComment: text('review_comment'),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
    deployedAt: timestamp('deployed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('devops_request_project_id_idx').on(table.projectId),
    index('devops_request_agent_id_idx').on(table.agentId),
    index('devops_request_status_idx').on(table.status),
    index('devops_request_type_idx').on(table.type),
  ],
);

export const humanTasks = pgTable(
  'human_tasks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    agentId: uuid('agent_id')
      .references(() => agents.id, { onDelete: 'set null' }),
    assignedTo: uuid('assigned_to')
      .references(() => users.id, { onDelete: 'set null' }),
    status: humanTaskStatusEnum('status').notNull().default('todo'),
    priority: humanTaskPriorityEnum('priority').notNull().default('medium'),
    title: text('title').notNull(),
    description: text('description'),
    // Context: why the agent created this task
    context: text('context'),
    // Optional link to related devops request
    devopsRequestId: uuid('devops_request_id')
      .references(() => devopsRequests.id, { onDelete: 'set null' }),
    dueAt: timestamp('due_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('human_task_project_id_idx').on(table.projectId),
    index('human_task_agent_id_idx').on(table.agentId),
    index('human_task_assigned_to_idx').on(table.assignedTo),
    index('human_task_status_idx').on(table.status),
  ],
);
