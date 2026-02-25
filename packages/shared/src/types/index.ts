// Organization & User types
export type Plan = 'starter' | 'growth' | 'pro' | 'enterprise';
export type UserRole = 'owner' | 'admin' | 'manager' | 'viewer';
export type Locale = 'pt-BR' | 'en-US';

// Agent types
export type AgentArchetype =
  | 'support'
  | 'sales'
  | 'marketing'
  | 'data_analyst'
  | 'content_writer'
  | 'developer'
  | 'project_manager'
  | 'hr'
  | 'finance'
  | 'email_campaign_manager'
  | 'research'
  | 'recruiter'
  | 'social_media'
  | 'mercado_livre'
  | 'inventory_monitor'
  | 'legal_research'
  | 'ad_analyst'
  | 'account_manager'
  | 'deployment_monitor'
  | 'custom';

export type AgentStatus = 'idle' | 'working' | 'awaiting_approval' | 'error' | 'offline';

export type TriggerType = 'always_on' | 'scheduled' | 'event' | 'manual' | 'agent';

export type MemoryScope = 'read_only' | 'read_write';

// Action log types
export type ActionType = 'tool_call' | 'llm_response' | 'approval_request';
export type ActionStatus = 'pending' | 'completed' | 'failed' | 'cancelled';

// Approval types
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

// Strategy types
export type StrategyType = 'growth' | 'retention' | 'brand' | 'product';
export type StrategyStatus = 'planned' | 'active' | 'at_risk' | 'completed';
export type KpiDirection = 'higher_is_better' | 'lower_is_better';

// Workflow types
export type WorkflowRunStatus = 'running' | 'completed' | 'failed' | 'cancelled';

// Document types
export type DocumentSourceType = 'upload' | 'web' | 'api' | 'agent';

// Company Templates
export type MarketFocus = 'br' | 'global' | 'both';

// Billing
export type SubscriptionStatus = 'active' | 'past_due' | 'canceled' | 'trialing' | 'unpaid';
export type PaymentMethodType = 'credit_card' | 'pix' | 'boleto';
export type InvoiceStatus = 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';

// DevOps types
export type DevopsRequestType = 'deploy' | 'pr_review' | 'rollback' | 'infra_change';
export type DevopsRequestStatus = 'pending' | 'in_review' | 'approved' | 'rejected' | 'deployed' | 'failed';
export type DevopsPriority = 'low' | 'medium' | 'high' | 'critical';

// Human Task types
export type HumanTaskStatus = 'todo' | 'in_progress' | 'done';
export type HumanTaskPriority = 'low' | 'medium' | 'high' | 'urgent';
