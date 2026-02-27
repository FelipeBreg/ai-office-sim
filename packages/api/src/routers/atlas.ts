import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { createTRPCRouter, projectProcedure } from '../trpc.js';
import { callLLM } from '@ai-office/ai';
import { db, agents, workflows, strategies, eq, desc } from '@ai-office/db';
import {
  getAtlasAnthropicTools,
  getAtlasToolByName,
  ATLAS_AUTO_EXECUTE_TOOLS,
} from '../lib/atlas-tools.js';

// ── Safety Limits ──

const MAX_TOOL_CALLS_PER_TURN = 10;
const MAX_TOKEN_BUDGET = 50_000;
const MAX_LOOP_ITERATIONS = 8;
const MAX_HISTORY_MESSAGES = 40;
const MAX_TOOL_RESULT_LENGTH = 10_000;

// ── System Prompt ──

const ATLAS_SYSTEM_PROMPT = `You are ATLAS, a superintelligent AI assistant that oversees the entire organization. You have deep knowledge of the company's agents, workflows, strategies, and operations.

You have access to real tools that interact with the platform. Use them to answer questions with actual data — never guess or make up numbers.

## Tool Behavior
- **Read-only tools** (list_agents, get_agent, list_workflows, get_workflow, list_strategies, get_strategy, get_analytics, list_pending_approvals, list_human_tasks, search_memory) execute automatically and return real data.
- **Mutation tools** (create_agent, update_agent, trigger_agent, create_workflow, update_strategy, create_human_task) require user approval before executing. When you call these, the user will see an approval popup.

## Guidelines
- Always use tools to fetch real data before answering questions about the company.
- When the user asks to create or modify something, use the appropriate mutation tool.
- Be concise, data-driven, and actionable. Speak in the user's language.
- If a tool returns an error, explain it clearly and suggest alternatives.
- You may call multiple tools in a single response if needed.`;

// ── Context Builder ──

async function buildContextSummary(projectId: string): Promise<string> {
  const [agentList, workflowList, strategyList] = await Promise.all([
    db
      .select({
        id: agents.id,
        name: agents.name,
        archetype: agents.archetype,
        status: agents.status,
      })
      .from(agents)
      .where(eq(agents.projectId, projectId))
      .limit(20),
    db
      .select({ id: workflows.id, name: workflows.name, isActive: workflows.isActive })
      .from(workflows)
      .where(eq(workflows.projectId, projectId))
      .limit(20),
    db
      .select({ id: strategies.id, type: strategies.type, status: strategies.status })
      .from(strategies)
      .where(eq(strategies.projectId, projectId))
      .orderBy(desc(strategies.createdAt))
      .limit(10),
  ]);

  const parts: string[] = [];

  if (agentList.length > 0) {
    parts.push(
      `Active Agents (${agentList.length}):\n${agentList.map((a) => `- ${a.name} [${a.id}] (${a.archetype}, ${a.status})`).join('\n')}`,
    );
  }

  if (workflowList.length > 0) {
    parts.push(
      `Workflows (${workflowList.length}):\n${workflowList.map((w) => `- ${w.name} [${w.id}] (${w.isActive ? 'active' : 'inactive'})`).join('\n')}`,
    );
  }

  if (strategyList.length > 0) {
    parts.push(
      `Strategies (${strategyList.length}):\n${strategyList.map((s) => `- ${s.type} [${s.id}] (${s.status})`).join('\n')}`,
    );
  }

  return parts.length > 0
    ? `\n\nCurrent Company Context:\n${parts.join('\n\n')}`
    : '\n\nNo agents, workflows, or strategies configured yet.';
}

// ── Zod Schemas for API ──

const textBlockSchema = z.object({
  type: z.literal('text'),
  text: z.string(),
});

const toolUseBlockSchema = z.object({
  type: z.literal('tool_use'),
  id: z.string(),
  name: z.string(),
  input: z.record(z.unknown()),
});

const toolResultBlockSchema = z.object({
  type: z.literal('tool_result'),
  tool_use_id: z.string(),
  content: z.string().optional(),
  is_error: z.boolean().optional(),
});

const contentBlockSchema = z.discriminatedUnion('type', [
  textBlockSchema,
  toolUseBlockSchema,
  toolResultBlockSchema,
]);

const messageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.union([z.string(), z.array(contentBlockSchema)]),
});

// ── Agentic Loop ──

export interface LoopResult {
  status: 'complete' | 'awaiting_approval';
  text: string;
  history: z.infer<typeof messageSchema>[];
  pendingToolCalls?: {
    id: string;
    name: string;
    input: Record<string, unknown>;
  }[];
  metadata: {
    tokens: number;
    cost: number;
    model: string;
    toolCallsExecuted: number;
  };
}

async function runAtlasLoop(
  messages: z.infer<typeof messageSchema>[],
  projectId: string,
  userId: string,
): Promise<LoopResult> {
  const contextSummary = await buildContextSummary(projectId);
  const tools = getAtlasAnthropicTools();

  let totalTokens = 0;
  let totalCost = 0;
  let toolCallsExecuted = 0;
  let model = 'claude-sonnet-4-6';

  // Working copy of messages for the loop
  const workingMessages = [...messages];

  for (let iteration = 0; iteration < MAX_LOOP_ITERATIONS; iteration++) {
    // Budget check
    if (totalTokens >= MAX_TOKEN_BUDGET) break;
    if (toolCallsExecuted >= MAX_TOOL_CALLS_PER_TURN) break;

    const result = await callLLM(
      {
        model: 'claude-sonnet-4-6',
        max_tokens: 4096,
        system: ATLAS_SYSTEM_PROMPT + contextSummary,
        messages: workingMessages as any,
        tools,
      },
      {
        projectId,
        agentId: 'atlas-system',
        sessionId: `atlas-${userId}-${Date.now()}`,
        agentName: 'ATLAS',
      },
    );

    totalTokens += result.metadata.totalTokens;
    totalCost += result.metadata.costUsd;
    model = result.metadata.model;

    const response = result.response;
    const contentBlocks = response.content;

    // Add assistant response to working messages
    workingMessages.push({
      role: 'assistant',
      content: contentBlocks.map((block) => {
        if (block.type === 'text') return { type: 'text' as const, text: block.text };
        if (block.type === 'tool_use')
          return {
            type: 'tool_use' as const,
            id: block.id,
            name: block.name,
            input: block.input as Record<string, unknown>,
          };
        return { type: 'text' as const, text: '' };
      }),
    });

    // If stop_reason is not tool_use, we're done
    if (response.stop_reason !== 'tool_use') {
      const text = contentBlocks
        .filter((b) => b.type === 'text')
        .map((b) => ('text' in b ? b.text : ''))
        .join('\n');

      return {
        status: 'complete',
        text,
        history: workingMessages,
        metadata: { tokens: totalTokens, cost: totalCost, model, toolCallsExecuted },
      };
    }

    // Extract tool_use blocks
    const toolUseBlocks = contentBlocks.filter((b) => b.type === 'tool_use') as Array<{
      type: 'tool_use';
      id: string;
      name: string;
      input: Record<string, unknown>;
    }>;

    // Check if any require approval
    const approvalNeeded = toolUseBlocks.filter((b) => !ATLAS_AUTO_EXECUTE_TOOLS.has(b.name));
    const autoExecute = toolUseBlocks.filter((b) => ATLAS_AUTO_EXECUTE_TOOLS.has(b.name));

    // Auto-execute read-only tools
    const toolResults: Array<{
      type: 'tool_result';
      tool_use_id: string;
      content?: string;
      is_error?: boolean;
    }> = [];

    for (const toolCall of autoExecute) {
      if (toolCallsExecuted >= MAX_TOOL_CALLS_PER_TURN) {
        toolResults.push({
          type: 'tool_result',
          tool_use_id: toolCall.id,
          content: 'Tool call limit reached for this turn.',
          is_error: true,
        });
        continue;
      }

      const tool = getAtlasToolByName(toolCall.name);
      if (!tool) {
        toolResults.push({
          type: 'tool_result',
          tool_use_id: toolCall.id,
          content: `Unknown tool: ${toolCall.name}`,
          is_error: true,
        });
        continue;
      }

      try {
        const output = await tool.execute(toolCall.input, projectId);
        const outputStr = JSON.stringify(output);
        toolResults.push({
          type: 'tool_result',
          tool_use_id: toolCall.id,
          content:
            outputStr.length > MAX_TOOL_RESULT_LENGTH
              ? outputStr.slice(0, MAX_TOOL_RESULT_LENGTH) + '... (truncated)'
              : outputStr,
        });
        toolCallsExecuted++;
      } catch (err) {
        toolResults.push({
          type: 'tool_result',
          tool_use_id: toolCall.id,
          content: `Error: ${err instanceof Error ? err.message : String(err)}`,
          is_error: true,
        });
        toolCallsExecuted++;
      }
    }

    // If there are approval-needed tools, pause the loop
    if (approvalNeeded.length > 0) {
      // Add results for auto-executed tools so far
      if (toolResults.length > 0) {
        workingMessages.push({ role: 'user', content: toolResults });
      }

      // Extract partial text from this response
      const partialText = contentBlocks
        .filter((b) => b.type === 'text')
        .map((b) => ('text' in b ? b.text : ''))
        .join('\n');

      return {
        status: 'awaiting_approval',
        text: partialText,
        history: workingMessages,
        pendingToolCalls: approvalNeeded.map((tc) => ({
          id: tc.id,
          name: tc.name,
          input: tc.input,
        })),
        metadata: { tokens: totalTokens, cost: totalCost, model, toolCallsExecuted },
      };
    }

    // All tools were auto-executed — feed results back and continue loop
    workingMessages.push({ role: 'user', content: toolResults });
  }

  // If we exhausted iterations, return whatever text we have
  const lastAssistant = workingMessages
    .filter((m) => m.role === 'assistant')
    .pop();
  let finalText = '';
  if (lastAssistant && Array.isArray(lastAssistant.content)) {
    finalText = lastAssistant.content
      .filter((b) => b.type === 'text')
      .map((b) => ('text' in b ? b.text : ''))
      .join('\n');
  }

  return {
    status: 'complete',
    text: finalText || 'I reached my processing limit for this turn. Please ask again if you need more.',
    history: workingMessages,
    metadata: { tokens: totalTokens, cost: totalCost, model, toolCallsExecuted },
  };
}

// ── Router ──

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
      const userId = ctx.user!.id;

      // Build messages: existing history + new user message
      const messages: z.infer<typeof messageSchema>[] = [
        ...input.history.slice(-MAX_HISTORY_MESSAGES),
        { role: 'user', content: input.message },
      ];

      try {
        return await runAtlasLoop(messages, projectId, userId);
      } catch (err) {
        console.error('[atlas.chat] Error:', err);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: err instanceof Error ? err.message : 'Atlas encountered an error',
        });
      }
    }),

  resolveToolCalls: projectProcedure
    .input(
      z.object({
        decisions: z.array(
          z.object({
            toolCallId: z.string(),
            toolName: z.string(),
            toolInput: z.record(z.unknown()),
            approved: z.boolean(),
          }),
        ),
        partialHistory: z.array(messageSchema),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const projectId = ctx.project!.id;
      const userId = ctx.user!.id;

      // Build tool_result blocks for each decision
      const toolResults: Array<{
        type: 'tool_result';
        tool_use_id: string;
        content?: string;
        is_error?: boolean;
      }> = [];

      for (const decision of input.decisions) {
        if (decision.approved) {
          const tool = getAtlasToolByName(decision.toolName);
          if (!tool) {
            toolResults.push({
              type: 'tool_result',
              tool_use_id: decision.toolCallId,
              content: `Unknown tool: ${decision.toolName}`,
              is_error: true,
            });
            continue;
          }

          try {
            const output = await tool.execute(decision.toolInput, projectId);
            const outputStr = JSON.stringify(output);
            toolResults.push({
              type: 'tool_result',
              tool_use_id: decision.toolCallId,
              content:
                outputStr.length > MAX_TOOL_RESULT_LENGTH
                  ? outputStr.slice(0, MAX_TOOL_RESULT_LENGTH) + '... (truncated)'
                  : outputStr,
            });
          } catch (err) {
            toolResults.push({
              type: 'tool_result',
              tool_use_id: decision.toolCallId,
              content: `Error: ${err instanceof Error ? err.message : String(err)}`,
              is_error: true,
            });
          }
        } else {
          toolResults.push({
            type: 'tool_result',
            tool_use_id: decision.toolCallId,
            content: 'Action rejected by user.',
            is_error: true,
          });
        }
      }

      // Append tool results to history and resume loop
      const messages: z.infer<typeof messageSchema>[] = [
        ...input.partialHistory,
        { role: 'user', content: toolResults },
      ];

      try {
        return await runAtlasLoop(messages, projectId, userId);
      } catch (err) {
        console.error('[atlas.resolveToolCalls] Error:', err);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: err instanceof Error ? err.message : 'Atlas encountered an error',
        });
      }
    }),
});
