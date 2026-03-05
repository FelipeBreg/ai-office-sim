import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { teamPriorityEnum, teamMemberRoleEnum } from './enums.js';
import { projects } from './projects.js';

export const teams = pgTable(
  'teams',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    slug: text('slug').notNull(),
    description: text('description'),
    parentTeamId: uuid('parent_team_id'),
    /** The agent that leads this team (set after agent creation) */
    leadAgentId: uuid('lead_agent_id'),
    priority: teamPriorityEnum('priority').notNull().default('normal'),
    maxConcurrency: integer('max_concurrency').notNull().default(3),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex('team_project_slug_idx').on(table.projectId, table.slug),
    index('team_project_id_idx').on(table.projectId),
  ],
);

export const agentTeamMemberships = pgTable(
  'agent_team_memberships',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    agentId: uuid('agent_id').notNull(),
    teamId: uuid('team_id')
      .notNull()
      .references(() => teams.id, { onDelete: 'cascade' }),
    role: teamMemberRoleEnum('role').notNull().default('member'),
    joinedAt: timestamp('joined_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('membership_agent_team_idx').on(table.agentId, table.teamId),
    index('membership_agent_id_idx').on(table.agentId),
    index('membership_team_id_idx').on(table.teamId),
  ],
);
