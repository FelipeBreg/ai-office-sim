import { pgEnum } from 'drizzle-orm/pg-core';

// Organization
export const planEnum = pgEnum('plan', ['starter', 'growth', 'pro', 'enterprise']);

// User
export const userRoleEnum = pgEnum('user_role', ['owner', 'admin', 'manager', 'viewer']);
export const localeEnum = pgEnum('locale', ['pt-BR', 'en-US']);

// Agent
export const agentArchetypeEnum = pgEnum('agent_archetype', [
  'support',
  'sales',
  'marketing',
  'data_analyst',
  'content_writer',
  'developer',
  'project_manager',
  'hr',
  'finance',
  'custom',
]);
export const agentStatusEnum = pgEnum('agent_status', [
  'idle',
  'working',
  'awaiting_approval',
  'error',
  'offline',
]);
export const triggerTypeEnum = pgEnum('trigger_type', [
  'always_on',
  'scheduled',
  'event',
  'manual',
  'agent',
]);
export const memoryScopeEnum = pgEnum('memory_scope', ['read_only', 'read_write']);

// Action logs
export const actionStatusEnum = pgEnum('action_status', [
  'pending',
  'completed',
  'failed',
  'cancelled',
]);

// Approvals
export const riskLevelEnum = pgEnum('risk_level', ['low', 'medium', 'high', 'critical']);
export const approvalStatusEnum = pgEnum('approval_status', ['pending', 'approved', 'rejected']);

// Workflows
export const workflowRunStatusEnum = pgEnum('workflow_run_status', [
  'running',
  'completed',
  'failed',
  'cancelled',
]);

// Documents
export const documentSourceTypeEnum = pgEnum('document_source_type', [
  'upload',
  'web',
  'api',
  'agent',
]);

// Strategies
export const strategyTypeEnum = pgEnum('strategy_type', [
  'growth',
  'retention',
  'brand',
  'product',
]);
export const strategyStatusEnum = pgEnum('strategy_status', [
  'planned',
  'active',
  'at_risk',
  'completed',
]);
export const kpiDirectionEnum = pgEnum('kpi_direction', [
  'higher_is_better',
  'lower_is_better',
]);
