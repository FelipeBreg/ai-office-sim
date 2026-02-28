import type { WorkflowNodeConfig, NodeInput, NodeOutput, DelayNodeConfig } from '@ai-office/shared';
import type { NodeHandler, WorkflowRunContext } from '../types.js';
import { PausedException } from '../types.js';

const UNIT_TO_MS: Record<string, number> = {
  minutes: 60_000,
  hours: 3_600_000,
  days: 86_400_000,
};

export const delayHandler: NodeHandler = {
  nodeType: 'delay',
  async execute(
    config: WorkflowNodeConfig,
    _input: NodeInput,
    _ctx: WorkflowRunContext,
  ): Promise<NodeOutput> {
    const cfg = config as DelayNodeConfig;
    const delayMs = cfg.duration * (UNIT_TO_MS[cfg.unit] ?? 60_000);

    // Delay pauses execution — the executor re-enqueues with BullMQ delay
    throw new PausedException(
      '', // nodeId set by executor
      `delay:${delayMs}`,
    );
  },
};
