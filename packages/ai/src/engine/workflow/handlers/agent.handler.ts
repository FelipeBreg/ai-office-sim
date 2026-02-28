import type { WorkflowNodeConfig, NodeInput, NodeOutput, AgentNodeConfig } from '@ai-office/shared';
import type { NodeHandler, WorkflowRunContext } from '../types.js';
import { db, agents, eq } from '@ai-office/db';
import { executeAgent } from '../../executor.js';
import { loadMemory } from '../../../memory/individual.js';
import { toolRegistry } from '../../../tools/registry.js';
import { DEFAULT_SAFETY_LIMITS } from '../../types.js';
import type { AgentContext, AgentSession } from '../../types.js';
import { randomUUID } from 'crypto';

/** Resolve {{variable}} placeholders in a string */
function resolveVariables(template: string, variables: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => variables[key] ?? '');
}

export const agentHandler: NodeHandler = {
  nodeType: 'agent',
  async execute(
    config: WorkflowNodeConfig,
    input: NodeInput,
    ctx: WorkflowRunContext,
  ): Promise<NodeOutput> {
    const cfg = config as AgentNodeConfig;

    // Load agent from DB
    const [agent] = await db
      .select()
      .from(agents)
      .where(eq(agents.id, cfg.agentId))
      .limit(1);

    if (!agent) {
      return {
        nodeId: '',
        nodeType: 'agent',
        status: 'failed',
        data: { error: `Agent not found: ${cfg.agentId}` },
        completedAt: new Date().toISOString(),
      };
    }

    // Build trigger payload from upstream outputs + variables
    const triggerPayload: Record<string, unknown> = {
      workflowRunId: ctx.workflowRunId,
      variables: ctx.variables,
      upstreamOutputs: input.upstreamOutputs,
    };

    // Build prompt with variable resolution
    let promptContent = cfg.promptTemplate
      ? resolveVariables(cfg.promptTemplate, input.variables)
      : undefined;

    if (promptContent) {
      triggerPayload.prompt = promptContent;
    }

    // Load memory + tools
    const memory = await loadMemory(agent.id, ctx.projectId);
    const agentConfig = agent.config ?? {
      model: 'claude-sonnet-4-6',
      temperature: 0.7,
      maxTokens: 4096,
      budget: 1.0,
    };
    const agentTools = agent.tools
      ? toolRegistry.getByNames(agent.tools)
      : toolRegistry.getAll();

    const systemPrompt =
      agent.systemPromptEn ??
      agent.systemPromptPtBr ??
      `You are ${agent.name}, a ${agent.archetype} agent. Complete the assigned task using the available tools.`;

    const agentContext: AgentContext = {
      agent: {
        id: agent.id,
        name: agent.name,
        archetype: agent.archetype,
        model: agentConfig.model,
        temperature: agentConfig.temperature,
        maxTokens: agentConfig.maxTokens,
      },
      systemPrompt,
      tools: agentTools,
      memory,
      conversationHistory: [],
      triggerPayload,
    };

    const session: AgentSession = {
      sessionId: randomUUID(),
      agentId: agent.id,
      projectId: ctx.projectId,
      startedAt: new Date(),
      actionCount: 0,
      totalTokens: 0,
      totalCostUsd: 0,
      status: 'running',
    };

    const result = await executeAgent(agentContext, session, {
      ...DEFAULT_SAFETY_LIMITS,
      maxActionsPerSession: agent.maxActionsPerSession,
      maxTokensPerSession: agentConfig.budget ? agentConfig.budget * 100_000 : 100_000,
    });

    return {
      nodeId: '',
      nodeType: 'agent',
      status: result.status === 'completed' ? 'completed' : 'failed',
      data: {
        agentId: agent.id,
        agentName: agent.name,
        totalTokens: result.totalTokens,
        totalCostUsd: result.totalCostUsd,
        durationMs: result.durationMs,
        actionsCount: result.actions.length,
      },
      response: result.finalResponse ?? undefined,
      completedAt: new Date().toISOString(),
    };
  },
};
