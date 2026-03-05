/**
 * Standardized protocol for agent-to-agent communication.
 * Used when agents trigger other agents via `trigger_agent`.
 */
export interface AgentMessage {
  from: string;
  to: string;
  type: 'task' | 'report' | 'escalation' | 'query';
  priority: 'low' | 'normal' | 'high' | 'critical';
  subject: string;
  body: string;
  context?: Record<string, unknown>;
  expectsReply: boolean;
  replyToMessageId?: string;
}

export type AgentMessageType = AgentMessage['type'];
export type AgentMessagePriority = AgentMessage['priority'];
