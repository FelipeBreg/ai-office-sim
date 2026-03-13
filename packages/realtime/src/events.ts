// ── Server → Client Events ──

export interface AgentStatusChangedEvent {
  agentId: string;
  status: 'idle' | 'working' | 'awaiting_approval' | 'error' | 'offline';
  timestamp: string;
}

export interface AgentActionEvent {
  agentId: string;
  sessionId: string;
  actionType: 'tool_call' | 'llm_response' | 'approval_request';
  toolName?: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  timestamp: string;
}

export interface AgentSessionStartedEvent {
  agentId: string;
  sessionId: string;
  triggerType: 'always_on' | 'scheduled' | 'event' | 'manual' | 'agent' | 'agent_message' | 'heartbeat' | 'kpi' | 'webhook' | 'briefing';
}

export interface AgentSessionCompleteEvent {
  agentId: string;
  sessionId: string;
  actionCount: number;
  tokensUsed: number;
}

export interface AgentErrorEvent {
  agentId: string;
  sessionId: string;
  error: string;
  timestamp: string;
}

export interface AgentAutoDisabledEvent {
  agentId: string;
  reason: string;
  timestamp: string;
}

export interface ApprovalRequestedEvent {
  approvalId: string;
  agentId: string;
  actionType: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface ApprovalResolvedEvent {
  approvalId: string;
  status: 'approved' | 'rejected';
  reviewedBy: string;
}

export interface WorkflowStartedEvent {
  workflowId: string;
  runId: string;
}

export interface WorkflowNodeCompleteEvent {
  workflowId: string;
  runId: string;
  nodeId: string;
  status: 'completed' | 'failed';
}

export interface WorkflowCompleteEvent {
  workflowId: string;
  runId: string;
  status: 'completed' | 'failed' | 'cancelled';
}

export interface KpiUpdatedEvent {
  strategyId: string;
  kpiId: string;
  newValue: number;
}

export interface LearningNewEvent {
  strategyId: string;
  learningId: string;
  insight: string;
}

// ── Cascade Events ──

export interface CascadeStartedEvent {
  cascadeId: string;
  rootAgentId: string;
  rootTriggerType: string;
}

export interface CascadeBranchFailedEvent {
  cascadeId: string;
  agentId: string;
  depth: number;
  error: string;
}

export interface CascadeDepthExceededEvent {
  cascadeId: string;
  agentId: string;
  depth: number;
  maxDepth: number;
}

export interface CascadeCompletedEvent {
  cascadeId: string;
  status: 'completed' | 'partial_failure';
  totalAgents: number;
  totalCostUsd: number;
  durationMs: number;
}

// ── Conversation Events ──

export interface ConversationNewMessageEvent {
  conversationId: string;
  messageId: string;
  direction: 'inbound' | 'outbound' | 'internal_note';
  senderType: 'agent' | 'user' | 'contact' | 'system';
  content: string;
  contentType: 'text' | 'html' | 'image' | 'file' | 'template';
  timestamp: string;
}

export interface ConversationStatusChangedEvent {
  conversationId: string;
  status: 'open' | 'snoozed' | 'resolved' | 'closed';
  timestamp: string;
}

export interface ConversationAssignedEvent {
  conversationId: string;
  assignedAgentId?: string;
  assignedUserId?: string;
  timestamp: string;
}

export interface BudgetProjectionWarningEvent {
  projectedMonthlyUsd: number;
  monthlyLimitUsd: number;
  utilizationPct: number;
  timestamp: string;
}

export interface CalendarReminderNotificationEvent {
  eventId: string;
  eventTitle: string;
  eventType: string;
  startAt: string | null;
  reminderId: string;
  timestamp: string;
}

// ── Server → Client Event Map ──

export interface ServerToClientEvents {
  'agent:status_changed': (data: AgentStatusChangedEvent) => void;
  'agent:action': (data: AgentActionEvent) => void;
  'agent:session_started': (data: AgentSessionStartedEvent) => void;
  'agent:session_complete': (data: AgentSessionCompleteEvent) => void;
  'agent:error': (data: AgentErrorEvent) => void;
  'agent:auto_disabled': (data: AgentAutoDisabledEvent) => void;
  'approval:requested': (data: ApprovalRequestedEvent) => void;
  'approval:resolved': (data: ApprovalResolvedEvent) => void;
  'workflow:started': (data: WorkflowStartedEvent) => void;
  'workflow:node_complete': (data: WorkflowNodeCompleteEvent) => void;
  'workflow:complete': (data: WorkflowCompleteEvent) => void;
  'kpi:updated': (data: KpiUpdatedEvent) => void;
  'learning:new': (data: LearningNewEvent) => void;
  'cascade:started': (data: CascadeStartedEvent) => void;
  'cascade:branch_failed': (data: CascadeBranchFailedEvent) => void;
  'cascade:depth_exceeded': (data: CascadeDepthExceededEvent) => void;
  'cascade:completed': (data: CascadeCompletedEvent) => void;
  'conversation:new_message': (data: ConversationNewMessageEvent) => void;
  'conversation:status_changed': (data: ConversationStatusChangedEvent) => void;
  'conversation:assigned': (data: ConversationAssignedEvent) => void;
  'budget:projection_warning': (data: BudgetProjectionWarningEvent) => void;
  'notification:calendar_reminder': (data: CalendarReminderNotificationEvent) => void;
}

// ── Client → Server Events ──

export interface ClientToServerEvents {
  'subscribe:project': (data: { projectId: string }) => void;
  'trigger:agent': (data: { agentId: string; payload?: unknown }) => void;
}

// ── Event name constants ──

export const SERVER_EVENTS = {
  AGENT_STATUS_CHANGED: 'agent:status_changed',
  AGENT_ACTION: 'agent:action',
  AGENT_SESSION_STARTED: 'agent:session_started',
  AGENT_SESSION_COMPLETE: 'agent:session_complete',
  AGENT_ERROR: 'agent:error',
  AGENT_AUTO_DISABLED: 'agent:auto_disabled',
  APPROVAL_REQUESTED: 'approval:requested',
  APPROVAL_RESOLVED: 'approval:resolved',
  WORKFLOW_STARTED: 'workflow:started',
  WORKFLOW_NODE_COMPLETE: 'workflow:node_complete',
  WORKFLOW_COMPLETE: 'workflow:complete',
  KPI_UPDATED: 'kpi:updated',
  LEARNING_NEW: 'learning:new',
  CONVERSATION_NEW_MESSAGE: 'conversation:new_message',
  CONVERSATION_STATUS_CHANGED: 'conversation:status_changed',
  CONVERSATION_ASSIGNED: 'conversation:assigned',
} as const;

export const CLIENT_EVENTS = {
  SUBSCRIBE_PROJECT: 'subscribe:project',
  TRIGGER_AGENT: 'trigger:agent',
} as const;
