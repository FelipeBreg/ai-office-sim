import type { WorkflowNodeConfig, NodeInput, NodeOutput, TriggerNodeConfig } from '@ai-office/shared';
import type { NodeHandler, WorkflowRunContext } from '../types.js';

export const triggerHandler: NodeHandler = {
  nodeType: 'trigger',
  async execute(
    config: WorkflowNodeConfig,
    input: NodeInput,
    ctx: WorkflowRunContext,
  ): Promise<NodeOutput> {
    const cfg = config as TriggerNodeConfig;
    return {
      nodeId: '', // set by executor
      nodeType: 'trigger',
      status: 'completed',
      data: {
        triggerType: cfg.triggerType,
        variables: ctx.variables,
      },
      completedAt: new Date().toISOString(),
    };
  },
};
