import type { WorkflowNodeConfig, NodeInput, NodeOutput } from '@ai-office/shared';
import type { NodeHandler, WorkflowRunContext } from './types.js';

export class NodeHandlerRegistry {
  private handlers = new Map<string, NodeHandler>();

  register(handler: NodeHandler): void {
    this.handlers.set(handler.nodeType, handler);
  }

  get(nodeType: string): NodeHandler {
    const handler = this.handlers.get(nodeType);
    if (!handler) {
      throw new Error(`No handler registered for node type: ${nodeType}`);
    }
    return handler;
  }

  async execute(
    nodeType: string,
    config: WorkflowNodeConfig,
    input: NodeInput,
    ctx: WorkflowRunContext,
  ): Promise<NodeOutput> {
    return this.get(nodeType).execute(config, input, ctx);
  }
}

export const nodeHandlerRegistry = new NodeHandlerRegistry();
