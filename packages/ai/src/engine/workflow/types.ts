import type { WorkflowNodeConfig, NodeInput, NodeOutput } from '@ai-office/shared';

/** Runtime context for the entire workflow run */
export interface WorkflowRunContext {
  workflowId: string;
  workflowRunId: string;
  projectId: string;
  variables: Record<string, string>;
}

/** Thrown by approval/delay handlers to pause execution */
export class PausedException extends Error {
  constructor(
    public readonly resumeNodeId: string,
    public readonly reason: string,
  ) {
    super(`Workflow paused at node ${resumeNodeId}: ${reason}`);
    this.name = 'PausedException';
  }
}

/** Interface every node handler must implement */
export interface NodeHandler {
  nodeType: string;
  execute(
    config: WorkflowNodeConfig,
    input: NodeInput,
    ctx: WorkflowRunContext,
  ): Promise<NodeOutput>;
}

/** Result of a full workflow execution */
export interface WorkflowExecutionResult {
  status: 'completed' | 'failed' | 'paused';
  outputs: Record<string, NodeOutput>;
  pausedAtNodeId?: string;
  error?: string;
}
