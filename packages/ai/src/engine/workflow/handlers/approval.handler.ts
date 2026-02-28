import type { WorkflowNodeConfig, NodeInput, NodeOutput, ApprovalNodeConfig } from '@ai-office/shared';
import type { NodeHandler, WorkflowRunContext } from '../types.js';
import { PausedException } from '../types.js';

export const approvalHandler: NodeHandler = {
  nodeType: 'approval',
  async execute(
    config: WorkflowNodeConfig,
    _input: NodeInput,
    _ctx: WorkflowRunContext,
  ): Promise<NodeOutput> {
    const cfg = config as ApprovalNodeConfig;

    // Approval always pauses execution — the executor catches PausedException
    throw new PausedException(
      '', // nodeId set by executor
      `Waiting for ${cfg.approverRole} approval${cfg.timeoutMinutes ? ` (timeout: ${cfg.timeoutMinutes}m)` : ''}`,
    );
  },
};
