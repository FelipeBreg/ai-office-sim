import type { WorkflowNodeConfig, NodeInput, NodeOutput, OutputNodeConfig } from '@ai-office/shared';
import type { NodeHandler, WorkflowRunContext } from '../types.js';

/** Resolve {{variable}} placeholders in a string */
function resolveVariables(template: string, variables: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => variables[key] ?? '');
}

export const outputHandler: NodeHandler = {
  nodeType: 'output',
  async execute(
    config: WorkflowNodeConfig,
    input: NodeInput,
    ctx: WorkflowRunContext,
  ): Promise<NodeOutput> {
    const cfg = config as OutputNodeConfig;

    const resolvedContent = cfg.templateContent
      ? resolveVariables(cfg.templateContent, input.variables)
      : JSON.stringify(input.upstreamOutputs);

    switch (cfg.outputType) {
      case 'log': {
        console.log(
          `[workflow-output] Run=${ctx.workflowRunId} | ${resolvedContent}`,
        );
        return {
          nodeId: '',
          nodeType: 'output',
          status: 'completed',
          data: { outputType: 'log', content: resolvedContent },
          completedAt: new Date().toISOString(),
        };
      }

      case 'webhook': {
        if (!cfg.destination) {
          return {
            nodeId: '',
            nodeType: 'output',
            status: 'failed',
            data: { error: 'Webhook destination URL is required' },
            completedAt: new Date().toISOString(),
          };
        }

        try {
          const res = await fetch(cfg.destination, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              workflowRunId: ctx.workflowRunId,
              content: resolvedContent,
              upstreamOutputs: input.upstreamOutputs,
            }),
          });

          return {
            nodeId: '',
            nodeType: 'output',
            status: res.ok ? 'completed' : 'failed',
            data: {
              outputType: 'webhook',
              statusCode: res.status,
              destination: cfg.destination,
            },
            completedAt: new Date().toISOString(),
          };
        } catch (err) {
          return {
            nodeId: '',
            nodeType: 'output',
            status: 'failed',
            data: {
              outputType: 'webhook',
              error: err instanceof Error ? err.message : String(err),
            },
            completedAt: new Date().toISOString(),
          };
        }
      }

      case 'email': {
        // Email output logs for now — integration via email tool can be added later
        console.log(
          `[workflow-output] Email to=${cfg.destination} | ${resolvedContent}`,
        );
        return {
          nodeId: '',
          nodeType: 'output',
          status: 'completed',
          data: {
            outputType: 'email',
            destination: cfg.destination,
            content: resolvedContent,
          },
          completedAt: new Date().toISOString(),
        };
      }

      default: {
        return {
          nodeId: '',
          nodeType: 'output',
          status: 'completed',
          data: { outputType: cfg.outputType, content: resolvedContent },
          completedAt: new Date().toISOString(),
        };
      }
    }
  },
};
