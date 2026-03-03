import type Anthropic from '@anthropic-ai/sdk';
import { callLLM } from './llm.js';
import { toolRegistry } from '../tools/registry.js';
import type {
  AgentContext,
  AgentSession,
  ExecutionResult,
  ActionRecord,
  SafetyLimits,
  ToolExecutionContext,
  SerializedSessionState,
} from './types.js';
import { db, actionLogs } from '@ai-office/db';

const TOOL_CALL_TIMEOUT_MS = 60_000;
const MAX_TOOL_RESULT_LENGTH = 10_000;

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

/**
 * Resume an agent session from a serialized paused state.
 *
 * After the pending tool call is approved, this function:
 * 1. Restores messages, session, context from saved state
 * 2. Executes the previously-blocked tool call
 * 3. Feeds the result back to Claude
 * 4. Continues the normal agentic loop
 */
export async function resumeAgent(
  savedState: SerializedSessionState,
  approved: boolean,
): Promise<ExecutionResult> {
  const startTime = performance.now();
  const actions: ActionRecord[] = [];
  let consecutiveErrors = 0;
  let lastToolCallTime = 0;

  // Restore messages
  const messages = savedState.messages as Anthropic.MessageParam[];

  // Restore session
  const session: AgentSession = {
    ...savedState.session,
    startedAt: new Date(savedState.session.startedAt),
    status: 'running',
    abortReason: undefined,
  };

  // Restore context
  const agentTools = toolRegistry.getByNames(savedState.context.toolNames);
  const context: AgentContext = {
    agent: savedState.context.agent,
    systemPrompt: savedState.context.systemPrompt,
    tools: agentTools,
    memory: savedState.context.memory,
    conversationHistory: [],
  };

  const limits = savedState.limits;

  // Get tools in Anthropic format
  let anthropicTools: Anthropic.Tool[] = [];
  if (agentTools.length > 0) {
    anthropicTools = toolRegistry.toAnthropicTools(agentTools.map((t) => t.name));
  }

  let finalResponse: string | null = null;

  // ── Step 1: Handle the pending tool call ──
  const pending = savedState.pendingToolCall;

  if (!approved) {
    // Tool was rejected — tell Claude the tool was denied
    messages.push({
      role: 'user',
      content: [
        {
          type: 'tool_result',
          tool_use_id: pending.toolUseId,
          content: `Tool "${pending.toolName}" was REJECTED by a human reviewer. Do not attempt this action again. Continue with alternative approaches or report that you cannot proceed.`,
          is_error: true,
        },
      ],
    });
  } else {
    // Tool was approved — execute it
    const toolDef = agentTools.find((t) => t.name === pending.toolName);
    if (!toolDef) {
      messages.push({
        role: 'user',
        content: [
          {
            type: 'tool_result',
            tool_use_id: pending.toolUseId,
            content: `Error: Tool "${pending.toolName}" is no longer available.`,
            is_error: true,
          },
        ],
      });
    } else {
      const toolContext: ToolExecutionContext = {
        agentId: session.agentId,
        projectId: session.projectId,
        sessionId: session.sessionId,
      };

      const toolStart = performance.now();
      try {
        let timeoutId: ReturnType<typeof setTimeout>;
        const result = await Promise.race([
          toolDef.execute(pending.toolInput, toolContext),
          new Promise((_, reject) => {
            timeoutId = setTimeout(
              () => reject(new Error('Tool execution timeout')),
              TOOL_CALL_TIMEOUT_MS,
            );
          }),
        ]).finally(() => clearTimeout(timeoutId!));

        const toolDuration = Math.round(performance.now() - toolStart);
        lastToolCallTime = performance.now();

        const resultStr = safeStringify(result);
        const truncatedResult =
          resultStr.length > MAX_TOOL_RESULT_LENGTH
            ? resultStr.slice(0, MAX_TOOL_RESULT_LENGTH) + '... [truncated]'
            : resultStr;

        messages.push({
          role: 'user',
          content: [
            {
              type: 'tool_result',
              tool_use_id: pending.toolUseId,
              content: truncatedResult,
            },
          ],
        });

        session.actionCount++;
        actions.push({
          type: 'tool_call',
          toolName: pending.toolName,
          input: pending.toolInput,
          output: result,
          durationMs: toolDuration,
        });

        try {
          await db.insert(actionLogs).values({
            projectId: session.projectId,
            agentId: session.agentId,
            sessionId: session.sessionId,
            actionType: 'tool_call',
            toolName: pending.toolName,
            input: pending.toolInput as Record<string, unknown>,
            output: result as Record<string, unknown>,
            status: 'completed',
            durationMs: toolDuration,
          });
        } catch {
          // Non-blocking
        }
      } catch (err) {
        const toolDuration = Math.round(performance.now() - toolStart);
        const errorMsg = err instanceof Error ? err.message : String(err);

        messages.push({
          role: 'user',
          content: [
            {
              type: 'tool_result',
              tool_use_id: pending.toolUseId,
              content: `Error: ${errorMsg}`,
              is_error: true,
            },
          ],
        });

        actions.push({
          type: 'tool_call',
          toolName: pending.toolName,
          input: pending.toolInput,
          error: errorMsg,
          durationMs: toolDuration,
        });

        consecutiveErrors++;
      }
    }
  }

  // ── Step 2: Continue the normal agentic loop ──
  while (session.status === 'running') {
    if (session.actionCount >= limits.maxActionsPerSession) {
      session.status = 'aborted';
      session.abortReason = `Max actions reached (${limits.maxActionsPerSession})`;
      break;
    }

    if (session.totalTokens >= limits.maxTokensPerSession) {
      session.status = 'aborted';
      session.abortReason = `Token budget exceeded (${limits.maxTokensPerSession})`;
      break;
    }

    const elapsed = performance.now() - startTime;
    if (elapsed >= limits.maxDurationMs) {
      session.status = 'aborted';
      session.abortReason = `Max duration exceeded (${limits.maxDurationMs}ms)`;
      break;
    }

    if (consecutiveErrors >= limits.maxConsecutiveErrors) {
      session.status = 'aborted';
      session.abortReason = `Too many consecutive errors (${limits.maxConsecutiveErrors})`;
      break;
    }

    const llmCallStart = performance.now();
    let llmResult;
    try {
      llmResult = await callLLM(
        {
          model: context.agent.model,
          max_tokens: context.agent.maxTokens,
          temperature: context.agent.temperature,
          system: context.systemPrompt,
          messages,
          ...(anthropicTools.length > 0 ? { tools: anthropicTools } : {}),
        },
        {
          projectId: session.projectId,
          agentId: session.agentId,
          sessionId: session.sessionId,
          agentName: context.agent.name,
        },
      );
    } catch (err) {
      consecutiveErrors++;
      session.actionCount++;
      actions.push({
        type: 'llm_call',
        durationMs: Math.round(performance.now() - llmCallStart),
        error: err instanceof Error ? err.message : String(err),
      });
      continue;
    }

    consecutiveErrors = 0;
    session.actionCount++;
    session.totalTokens += llmResult.metadata.totalTokens;
    session.totalCostUsd += llmResult.metadata.costUsd;

    actions.push({
      type: 'llm_call',
      tokensUsed: llmResult.metadata.totalTokens,
      costUsd: llmResult.metadata.costUsd,
      durationMs: llmResult.metadata.durationMs,
    });

    const response = llmResult.response;

    if (response.stop_reason === 'max_tokens') {
      const textBlocks = response.content
        .filter((block): block is Anthropic.TextBlock => block.type === 'text')
        .map((block) => block.text);
      finalResponse = textBlocks.join('\n') + '\n[Response truncated: max_tokens reached]';
      session.status = 'aborted';
      session.abortReason = 'Response truncated (max_tokens reached)';
      break;
    }

    const toolUseBlocks = response.content.filter(
      (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use',
    );

    if (toolUseBlocks.length === 0) {
      const textBlocks = response.content
        .filter((block): block is Anthropic.TextBlock => block.type === 'text')
        .map((block) => block.text);
      finalResponse = textBlocks.join('\n');
      session.status = 'completed';
      break;
    }

    messages.push({ role: 'assistant', content: response.content });

    const toolResults: Anthropic.ToolResultBlockParam[] = [];
    let needsApproval = false;

    for (const toolBlock of toolUseBlocks) {
      const toolDef = agentTools.find((t) => t.name === toolBlock.name);

      if (!toolDef) {
        toolResults.push({
          type: 'tool_result',
          tool_use_id: toolBlock.id,
          content: `Error: Unknown tool "${toolBlock.name}"`,
          is_error: true,
        });
        continue;
      }

      // Check approval — pause again if needed
      if (toolDef.requiresApproval) {
        needsApproval = true;
        session.status = 'paused_for_approval';
        session.abortReason = `Awaiting approval for tool "${toolBlock.name}"`;

        const pausedState: SerializedSessionState = {
          messages: messages as unknown[],
          session: {
            ...session,
            startedAt: session.startedAt.toISOString(),
          },
          context: {
            agent: context.agent,
            systemPrompt: context.systemPrompt,
            toolNames: context.tools.map((t) => t.name),
            memory: context.memory,
          },
          pendingToolCall: {
            toolName: toolBlock.name,
            toolInput: toolBlock.input,
            toolUseId: toolBlock.id,
          },
          limits,
        };

        const durationMs = Math.round(performance.now() - startTime);
        return {
          sessionId: session.sessionId,
          status: 'paused_for_approval',
          actions,
          finalResponse: null,
          totalTokens: session.totalTokens,
          totalCostUsd: session.totalCostUsd,
          durationMs,
          abortReason: session.abortReason,
          pausedState,
        };
      }

      const parseResult = toolDef.inputSchema.safeParse(toolBlock.input);
      if (!parseResult.success) {
        toolResults.push({
          type: 'tool_result',
          tool_use_id: toolBlock.id,
          content: `Input validation error: ${parseResult.error.message}`,
          is_error: true,
        });
        consecutiveErrors++;
        continue;
      }

      const now = performance.now();
      const timeSinceLastCall = now - lastToolCallTime;
      if (lastToolCallTime > 0 && timeSinceLastCall < limits.toolCallMinIntervalMs) {
        await new Promise((resolve) =>
          setTimeout(resolve, limits.toolCallMinIntervalMs - timeSinceLastCall),
        );
      }

      const toolStart = performance.now();
      const toolContext: ToolExecutionContext = {
        agentId: session.agentId,
        projectId: session.projectId,
        sessionId: session.sessionId,
      };

      try {
        let timeoutId: ReturnType<typeof setTimeout>;
        const result = await Promise.race([
          toolDef.execute(parseResult.data, toolContext),
          new Promise((_, reject) => {
            timeoutId = setTimeout(
              () => reject(new Error('Tool execution timeout')),
              TOOL_CALL_TIMEOUT_MS,
            );
          }),
        ]).finally(() => clearTimeout(timeoutId!));

        const toolDuration = Math.round(performance.now() - toolStart);
        lastToolCallTime = performance.now();

        const resultStr = safeStringify(result);
        const truncatedResult =
          resultStr.length > MAX_TOOL_RESULT_LENGTH
            ? resultStr.slice(0, MAX_TOOL_RESULT_LENGTH) + '... [truncated]'
            : resultStr;

        toolResults.push({
          type: 'tool_result',
          tool_use_id: toolBlock.id,
          content: truncatedResult,
        });

        session.actionCount++;
        actions.push({
          type: 'tool_call',
          toolName: toolBlock.name,
          input: toolBlock.input,
          output: result,
          durationMs: toolDuration,
        });

        try {
          await db.insert(actionLogs).values({
            projectId: session.projectId,
            agentId: session.agentId,
            sessionId: session.sessionId,
            actionType: 'tool_call',
            toolName: toolBlock.name,
            input: toolBlock.input as Record<string, unknown>,
            output: result as Record<string, unknown>,
            status: 'completed',
            durationMs: toolDuration,
          });
        } catch {
          // Non-blocking
        }

        consecutiveErrors = 0;
      } catch (err) {
        const toolDuration = Math.round(performance.now() - toolStart);
        const errorMsg = err instanceof Error ? err.message : String(err);

        toolResults.push({
          type: 'tool_result',
          tool_use_id: toolBlock.id,
          content: `Error: ${errorMsg}`,
          is_error: true,
        });

        actions.push({
          type: 'tool_call',
          toolName: toolBlock.name,
          input: toolBlock.input,
          error: errorMsg,
          durationMs: toolDuration,
        });

        consecutiveErrors++;

        try {
          await db.insert(actionLogs).values({
            projectId: session.projectId,
            agentId: session.agentId,
            sessionId: session.sessionId,
            actionType: 'tool_call',
            toolName: toolBlock.name,
            input: toolBlock.input as Record<string, unknown>,
            status: 'failed',
            error: errorMsg,
            durationMs: toolDuration,
          });
        } catch {
          // Non-blocking
        }
      }
    }

    if (needsApproval) break;

    messages.push({ role: 'user', content: toolResults });
  }

  const durationMs = Math.round(performance.now() - startTime);

  if (session.status === 'running') {
    session.status = 'completed';
  }

  return {
    sessionId: session.sessionId,
    status: session.status as 'completed' | 'error' | 'aborted' | 'paused_for_approval',
    actions,
    finalResponse,
    totalTokens: session.totalTokens,
    totalCostUsd: session.totalCostUsd,
    durationMs,
    abortReason: session.abortReason,
  };
}
