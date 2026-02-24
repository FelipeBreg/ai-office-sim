import type Anthropic from '@anthropic-ai/sdk';
import type { z } from 'zod';

/** Active execution session for an agent */
export interface AgentSession {
  sessionId: string;
  agentId: string;
  projectId: string;
  startedAt: Date;
  actionCount: number;
  totalTokens: number;
  totalCostUsd: number;
  status: 'running' | 'completed' | 'error' | 'aborted';
  abortReason?: string;
}

/** Full context assembled before calling Claude */
export interface AgentContext {
  agent: {
    id: string;
    name: string;
    archetype: string;
    model: string;
    temperature: number;
    maxTokens: number;
  };
  systemPrompt: string;
  tools: ToolDefinition[];
  memory: Array<{ key: string; value: unknown }>;
  conversationHistory: Anthropic.MessageParam[];
  triggerPayload?: unknown;
}

/** Registered tool that an agent can invoke */
export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: z.ZodType;
  requiresApproval: boolean;
  execute: (input: unknown, context: ToolExecutionContext) => Promise<unknown>;
}

/** Context passed to tool execute functions */
export interface ToolExecutionContext {
  agentId: string;
  projectId: string;
  sessionId: string;
}

/** Result of a complete agent execution session */
export interface ExecutionResult {
  sessionId: string;
  status: 'completed' | 'error' | 'aborted';
  actions: ActionRecord[];
  finalResponse: string | null;
  totalTokens: number;
  totalCostUsd: number;
  durationMs: number;
  abortReason?: string;
}

/** Individual action recorded during execution */
export interface ActionRecord {
  type: 'llm_call' | 'tool_call';
  toolName?: string;
  input?: unknown;
  output?: unknown;
  tokensUsed?: number;
  costUsd?: number;
  durationMs: number;
  error?: string;
}

/** Safety limits for agent execution */
export interface SafetyLimits {
  maxActionsPerSession: number;
  maxTokensPerSession: number;
  maxDurationMs: number;
  maxConsecutiveErrors: number;
  toolCallMinIntervalMs: number;
}

export const DEFAULT_SAFETY_LIMITS: SafetyLimits = {
  maxActionsPerSession: 20,
  maxTokensPerSession: 100_000,
  maxDurationMs: 5 * 60 * 1000, // 5 minutes
  maxConsecutiveErrors: 3,
  toolCallMinIntervalMs: 2_000, // 1 call per 2 seconds
};
