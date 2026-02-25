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

// WhatsApp
export const whatsappProviderEnum = pgEnum('whatsapp_provider', [
  'zapi',
  'twilio',
  'meta_cloud',
]);
export const whatsappConnectionStatusEnum = pgEnum('whatsapp_connection_status', [
  'connected',
  'disconnected',
  'pending',
]);
export const whatsappMessageDirectionEnum = pgEnum('whatsapp_message_direction', [
  'inbound',
  'outbound',
]);
export const whatsappMessageStatusEnum = pgEnum('whatsapp_message_status', [
  'pending',
  'sent',
  'delivered',
  'read',
  'failed',
]);
export const whatsappTemplateStatusEnum = pgEnum('whatsapp_template_status', [
  'pending',
  'approved',
  'rejected',
]);

// Email
export const emailProviderEnum = pgEnum('email_provider', [
  'smtp',
  'sendgrid',
  'aws_ses',
]);
export const emailConnectionStatusEnum = pgEnum('email_connection_status', [
  'connected',
  'disconnected',
  'pending',
]);
export const emailMessageStatusEnum = pgEnum('email_message_status', [
  'pending',
  'sent',
  'delivered',
  'bounced',
  'failed',
]);
export const emailMessageTypeEnum = pgEnum('email_message_type', [
  'transactional',
  'marketing',
]);

// Tool Credentials (OAuth2)
export const toolTypeEnum = pgEnum('tool_type', [
  'google_gmail',
  'google_sheets',
  'rdstation_crm',
  'rdstation_marketing',
]);
