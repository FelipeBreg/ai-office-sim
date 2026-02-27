import { z } from 'zod';
import { createTRPCRouter, projectProcedure } from '../trpc.js';
import { callLLM } from '@ai-office/ai';
import { db, agents, workflows, strategies, eq, desc } from '@ai-office/db';

const ATLAS_SYSTEM_PROMPT = `You are ATLAS, a superintelligent AI assistant that oversees the entire organization. You have deep knowledge of the company's agents, workflows, strategies, and operations.

Your capabilities:
- Analyze business metrics, KPIs, and operational data
- Provide strategic recommendations based on current company state
- Suggest new agents, workflow modifications, or strategy adjustments
- Answer questions about the company's performance and operations

When you want to suggest an action, format it as:
[ACTION: type] Title — Description

Action types: create_agent, modify_workflow, update_strategy, create_task, general_recommendation

Always be concise, data-driven, and actionable. Speak in the user's language.`;

async function buildContextSummary(projectId: string): Promise<string> {
  const [agentList, workflowList, strategyList] = await Promise.all([
    db.select({ id: agents.id, name: agents.name, archetype: agents.archetype, status: agents.status })
      .from(agents)
      .where(eq(agents.projectId, projectId))
      .limit(20),
    db.select({ id: workflows.id, name: workflows.name, isActive: workflows.isActive })
      .from(workflows)
      .where(eq(workflows.projectId, projectId))
      .limit(20),
    db.select({ id: strategies.id, type: strategies.type, status: strategies.status })
      .from(strategies)
      .where(eq(strategies.projectId, projectId))
      .orderBy(desc(strategies.createdAt))
      .limit(10),
  ]);

  const parts: string[] = [];

  if (agentList.length > 0) {
    parts.push(`Active Agents (${agentList.length}):\n${agentList.map((a) => `- ${a.name} (${a.archetype}, ${a.status})`).join('\n')}`);
  }

  if (workflowList.length > 0) {
    parts.push(`Workflows (${workflowList.length}):\n${workflowList.map((w) => `- ${w.name} (${w.isActive ? 'active' : 'inactive'})`).join('\n')}`);
  }

  if (strategyList.length > 0) {
    parts.push(`Strategies (${strategyList.length}):\n${strategyList.map((s) => `- ${s.type} (${s.status})`).join('\n')}`);
  }

  return parts.length > 0
    ? `\n\nCurrent Company Context:\n${parts.join('\n\n')}`
    : '\n\nNo agents, workflows, or strategies configured yet.';
}

const messageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string(),
});

export const atlasRouter = createTRPCRouter({
  chat: projectProcedure
    .input(
      z.object({
        message: z.string().min(1),
        history: z.array(messageSchema).default([]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const projectId = ctx.project!.id;
      const contextSummary = await buildContextSummary(projectId);

      const messages = [
        ...input.history.map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
        { role: 'user' as const, content: input.message },
      ];

      const result = await callLLM(
        {
          model: 'claude-sonnet-4-6',
          max_tokens: 1024,
          system: ATLAS_SYSTEM_PROMPT + contextSummary,
          messages,
        },
        {
          projectId,
          agentId: 'atlas-system',
          sessionId: `atlas-${ctx.user!.id}-${Date.now()}`,
          agentName: 'ATLAS',
        },
      );

      // Extract text from response content blocks
      const text = result.response.content
        .filter((block) => block.type === 'text')
        .map((block) => ('text' in block ? block.text : ''))
        .join('\n');

      // Detect action suggestions in the response
      const actionRegex = /\[ACTION:\s*(\w+)\]\s*(.+?)\s*[—–-]\s*(.+)/g;
      const actions: { type: string; title: string; description: string }[] = [];
      let match: RegExpExecArray | null;
      while ((match = actionRegex.exec(text)) !== null) {
        actions.push({
          type: match[1]!,
          title: match[2]!.trim(),
          description: match[3]!.trim(),
        });
      }

      return {
        text,
        actions,
        metadata: {
          tokens: result.metadata.totalTokens,
          cost: result.metadata.costUsd,
          model: result.metadata.model,
        },
      };
    }),
});
