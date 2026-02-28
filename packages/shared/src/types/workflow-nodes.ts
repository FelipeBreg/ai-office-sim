// ── Node Config Types (discriminated union on nodeType) ──

export interface TriggerNodeConfig {
  nodeType: 'trigger';
  triggerType: 'manual' | 'scheduled' | 'event' | 'webhook';
  cronExpression?: string;
  eventName?: string;
}

export interface AgentNodeConfig {
  nodeType: 'agent';
  agentId: string;
  agentName: string;
  promptTemplate?: string; // supports {{variable}} refs
}

export interface ConditionNodeConfig {
  nodeType: 'condition';
  conditionType: 'llm_eval' | 'contains' | 'json_path';
  condition: string;
  jsonPath?: string;
  expectedValue?: string;
}

export interface ApprovalNodeConfig {
  nodeType: 'approval';
  approverRole: string;
  timeoutMinutes?: number;
  autoAction?: 'approve' | 'reject';
}

export interface DelayNodeConfig {
  nodeType: 'delay';
  duration: number;
  unit: 'minutes' | 'hours' | 'days';
}

export interface OutputNodeConfig {
  nodeType: 'output';
  outputType: 'email' | 'webhook' | 'log';
  destination?: string;
  templateContent?: string; // supports {{variable}} refs
}

export type WorkflowNodeConfig =
  | TriggerNodeConfig
  | AgentNodeConfig
  | ConditionNodeConfig
  | ApprovalNodeConfig
  | DelayNodeConfig
  | OutputNodeConfig;

// ── Runtime I/O Types ──

export interface NodeInput {
  upstreamOutputs: Record<string, NodeOutput>;
  variables: Record<string, string>;
}

export interface NodeOutput {
  nodeId: string;
  nodeType: string;
  status: 'completed' | 'failed' | 'skipped';
  data: unknown;
  response?: string;
  completedAt: string; // ISO timestamp
}

// ── Workflow Variables ──

export interface WorkflowVariable {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select';
  defaultValue?: string;
  required: boolean;
  options?: string[]; // for select type
}

// ── Workflow Definition (replaces untyped JSONB) ──

export interface WorkflowDefinitionNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: WorkflowNodeConfig;
}

export interface WorkflowDefinitionEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
}

export interface WorkflowDefinition {
  nodes: WorkflowDefinitionNode[];
  edges: WorkflowDefinitionEdge[];
  variables: WorkflowVariable[];
}
