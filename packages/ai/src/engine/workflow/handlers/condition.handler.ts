import type { WorkflowNodeConfig, NodeInput, NodeOutput, ConditionNodeConfig } from '@ai-office/shared';
import type { NodeHandler, WorkflowRunContext } from '../types.js';
import { callLLM } from '../../llm.js';

export const conditionHandler: NodeHandler = {
  nodeType: 'condition',
  async execute(
    config: WorkflowNodeConfig,
    input: NodeInput,
    ctx: WorkflowRunContext,
  ): Promise<NodeOutput> {
    const cfg = config as ConditionNodeConfig;
    let result = false;

    const upstreamData = JSON.stringify(input.upstreamOutputs);

    switch (cfg.conditionType) {
      case 'llm_eval': {
        const llmResult = await callLLM(
          {
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 10,
            temperature: 0,
            system:
              'You are a condition evaluator. Given data and a condition, respond with exactly YES or NO. No explanation.',
            messages: [
              {
                role: 'user',
                content: `Given this data:\n${upstreamData}\n\nEvaluate: ${cfg.condition}\n\nRespond YES or NO.`,
              },
            ],
          },
          {
            projectId: ctx.projectId,
            agentId: 'workflow-condition',
            sessionId: ctx.workflowRunId,
            agentName: 'Workflow Condition',
          },
        );

        const responseText = llmResult.response.content
          .filter((b) => b.type === 'text')
          .map((b) => (b as { type: 'text'; text: string }).text)
          .join('')
          .trim()
          .toUpperCase();

        result = responseText.startsWith('YES');
        break;
      }

      case 'contains': {
        result = upstreamData.includes(cfg.condition);
        break;
      }

      case 'json_path': {
        if (cfg.jsonPath && cfg.expectedValue) {
          try {
            // Simple dot-notation path resolution
            const keys = cfg.jsonPath.split('.');
            let value: unknown = input.upstreamOutputs;
            for (const key of keys) {
              if (value && typeof value === 'object') {
                value = (value as Record<string, unknown>)[key];
              } else {
                value = undefined;
                break;
              }
            }
            result = String(value) === cfg.expectedValue;
          } catch {
            result = false;
          }
        }
        break;
      }
    }

    return {
      nodeId: '',
      nodeType: 'condition',
      status: 'completed',
      data: result,
      completedAt: new Date().toISOString(),
    };
  },
};
