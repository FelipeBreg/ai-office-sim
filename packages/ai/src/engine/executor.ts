import type Anthropic from '@anthropic-ai/sdk';
import { callLLM } from './llm.js';
import type {
  AgentContext,
  AgentSession,
  ExecutionResult,
  ActionRecord,
  SafetyLimits,
  ToolExecutionContext,
  SerializedSessionState,
} from './types.js';
import { DEFAULT_SAFETY_LIMITS } from './types.js';
import { db, actionLogs } from '@ai-office/db';
import { maskPII, MODEL_CONTEXT_WINDOWS, CONTEXT_COMPACTION_THRESHOLD } from '@ai-office/shared';
import { countTokensExact, estimateTokens } from '@ai-office/tokenizer';

const TOOL_CALL_TIMEOUT_MS = 60_000; // 60s per tool call
const MAX_TOOL_RESULT_LENGTH = 10_000; // Truncate large tool outputs
const TOOL_RETRY_MAX = 2; // Retry failed tool calls up to 2 times
const TOOL_RETRY_BASE_DELAY_MS = 1_000; // Base delay for exponential backoff

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

/**
 * Execute an agent session: the core agentic loop.
 *
 * Flow:
 * 1. Build messages from context (system prompt, memory, conversation)
 * 2. Call Claude with tools
 * 3. If response has tool_use blocks:
 *    a. Validate inputs with Zod schema
 *    b. Check if approval required → abort session for review
 *    c. Execute tool with timeout (clearTimeout on completion)
 *    d. Feed tool results back to Claude
 * 4. Repeat until Claude responds with text-only or limits reached
 * 5. Return ExecutionResult with all actions
 *
 * Action counting: both LLM calls and tool calls count toward the action limit.
 */
export async function executeAgent(
  context: AgentContext,
  session: AgentSession,
  limits: SafetyLimits = DEFAULT_SAFETY_LIMITS,
): Promise<ExecutionResult> {
  const startTime = performance.now();
  const actions: ActionRecord[] = [];
  let consecutiveErrors = 0;
  let lastToolCallTime = 0;

  // Build the messages array from context
  const messages: Anthropic.MessageParam[] = [...context.conversationHistory];

  // Ensure we don't append a user message after an existing user message
  const lastMsg = messages[messages.length - 1];
  const rawTrigger = context.triggerPayload
    ? String(typeof context.triggerPayload === 'string' ? context.triggerPayload : safeStringify(context.triggerPayload)).slice(0, 10_000)
    : 'Start your work.';

  // Mask PII in trigger payload and memory before sending to LLM
  const triggerContent = maskPII(rawTrigger);

  let userMessage: string;
  if (context.memory.length > 0) {
    const memoryText = context.memory
      .map((m) => `[${m.key}]: ${maskPII(safeStringify(m.value))}`)
      .join('\n');
    userMessage = `[System: Agent Memory]\n${memoryText}\n\n[User Trigger] ${triggerContent}`;
  } else {
    userMessage = triggerContent;
  }

  if (lastMsg && lastMsg.role === 'user') {
    // Merge with existing last user message to avoid consecutive user messages
    const existingContent = typeof lastMsg.content === 'string' ? lastMsg.content : safeStringify(lastMsg.content);
    messages[messages.length - 1] = {
      role: 'user',
      content: `${existingContent}\n\n${userMessage}`,
    };
  } else {
    messages.push({ role: 'user', content: userMessage });
  }

  // Get tools in Anthropic format via registry
  let anthropicTools: Anthropic.Tool[] = [];
  if (context.tools.length > 0) {
    const { toolRegistry } = await import('../tools/registry.js');
    anthropicTools = toolRegistry.toAnthropicTools(context.tools.map((t) => t.name));
  }

  let finalResponse: string | null = null;
  session.status = 'running';

  // ── Pre-loop: Validate total context with exact token count ──
  try {
    const contextWindow = MODEL_CONTEXT_WINDOWS[context.agent.model] ?? 200_000;
    const threshold = Math.floor(contextWindow * CONTEXT_COMPACTION_THRESHOLD);

    const exactTokens = await countTokensExact(
      context.agent.model,
      messages,
      context.systemPrompt,
      anthropicTools.length > 0 ? anthropicTools : undefined,
    );

    console.log(
      `[executor] Pre-loop token validation: exact=${exactTokens}, threshold=${threshold} (${Math.round((exactTokens / contextWindow) * 100)}% of context window)`,
    );

    if (exactTokens > threshold) {
      // Compact: summarize oldest messages to free space
      console.warn(`[executor] Context at ${Math.round((exactTokens / contextWindow) * 100)}% — compacting oldest messages`);
      while (messages.length > 2) {
        const oldestIdx = messages[0]?.role === 'user' ? 0 : 1;
        const removed = messages.splice(oldestIdx, 1)[0];
        if (!removed) break;
        const removedTokens = estimateTokens(
          typeof removed.content === 'string' ? removed.content : JSON.stringify(removed.content),
        );
        const newEstimate = exactTokens - removedTokens;
        if (newEstimate <= threshold) break;
      }
    }
  } catch (err) {
    // Non-blocking — if count_tokens fails, proceed with estimate
    console.warn('[executor] Token validation failed, proceeding with estimate:', err);
  }

  // ── Main Execution Loop ──
  while (session.status === 'running') {
    // ── Safety Check: Action Count ──
    if (session.actionCount >= limits.maxActionsPerSession) {
      session.status = 'aborted';
      session.abortReason = `Max actions reached (${limits.maxActionsPerSession})`;
      break;
    }

    // ── Safety Check: Token Budget ──
    if (session.totalTokens >= limits.maxTokensPerSession) {
      session.status = 'aborted';
      session.abortReason = `Token budget exceeded (${limits.maxTokensPerSession})`;
      break;
    }

    // ── Safety Check: Duration ──
    const elapsed = performance.now() - startTime;
    if (elapsed >= limits.maxDurationMs) {
      session.status = 'aborted';
      session.abortReason = `Max duration exceeded (${limits.maxDurationMs}ms)`;
      break;
    }

    // ── Safety Check: Consecutive Errors ──
    if (consecutiveErrors >= limits.maxConsecutiveErrors) {
      session.status = 'aborted';
      session.abortReason = `Too many consecutive errors (${limits.maxConsecutiveErrors})`;
      break;
    }

    // ── Step 1: Call Claude ──
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
      session.actionCount++; // Count failed LLM calls toward the action limit
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

    // ── Check for truncated response ──
    if (response.stop_reason === 'max_tokens') {
      const textBlocks = response.content
        .filter((block): block is Anthropic.TextBlock => block.type === 'text')
        .map((block) => block.text);
      finalResponse = textBlocks.join('\n') + '\n[Response truncated: max_tokens reached]';
      session.status = 'aborted';
      session.abortReason = 'Response truncated (max_tokens reached)';
      break;
    }

    // ── Step 2: Check if response contains tool use ──
    const toolUseBlocks = response.content.filter(
      (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use',
    );

    if (toolUseBlocks.length === 0) {
      // Text-only response — session complete
      const textBlocks = response.content
        .filter((block): block is Anthropic.TextBlock => block.type === 'text')
        .map((block) => block.text);

      finalResponse = textBlocks.join('\n');
      session.status = 'completed';
      break;
    }

    // Add assistant message to conversation
    messages.push({ role: 'assistant', content: response.content });

    // ── Step 3: Execute each tool call ──
    const toolResults: Anthropic.ToolResultBlockParam[] = [];
    let needsApproval = false;

    for (const toolBlock of toolUseBlocks) {
      const toolDef = context.tools.find((t) => t.name === toolBlock.name);

      if (!toolDef) {
        toolResults.push({
          type: 'tool_result',
          tool_use_id: toolBlock.id,
          content: `Error: Unknown tool "${toolBlock.name}"`,
          is_error: true,
        });
        continue;
      }

      // Check approval requirement — pause session for human review (not abort)
      if (toolDef.requiresApproval) {
        needsApproval = true;
        session.status = 'paused_for_approval';
        session.abortReason = `Awaiting approval for tool "${toolBlock.name}"`;

        // Serialize full session state so agent can resume from this exact point
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

      // Validate input with Zod
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

      // ── Sandbox mode: intercept mutation tools ──
      if (session.sandboxMode && toolDef.isMutation) {
        const sandboxResult = {
          _sandbox: true,
          tool: toolBlock.name,
          message: `[SANDBOX] Tool "${toolBlock.name}" was intercepted. In production, this would execute with the provided input.`,
          input: parseResult.data,
        };

        session.actionCount++;
        actions.push({
          type: 'tool_call',
          toolName: toolBlock.name,
          input: parseResult.data,
          output: sandboxResult,
          durationMs: 0,
        });

        toolResults.push({
          type: 'tool_result',
          tool_use_id: toolBlock.id,
          content: safeStringify(sandboxResult),
        });
        continue;
      }

      // Rate limiting: enforce minimum interval between tool calls
      const now = performance.now();
      const timeSinceLastCall = now - lastToolCallTime;
      if (lastToolCallTime > 0 && timeSinceLastCall < limits.toolCallMinIntervalMs) {
        await new Promise((resolve) =>
          setTimeout(resolve, limits.toolCallMinIntervalMs - timeSinceLastCall),
        );
      }

      // Execute tool with timeout and retry (exponential backoff)
      const toolStart = performance.now();
      const toolContext: ToolExecutionContext = {
        agentId: session.agentId,
        projectId: session.projectId,
        sessionId: session.sessionId,
        cascade: context.cascade,
      };

      let toolSucceeded = false;
      let lastError: string | undefined;

      for (let attempt = 0; attempt <= TOOL_RETRY_MAX; attempt++) {
        // Exponential backoff between retries (skip on first attempt)
        if (attempt > 0) {
          const delay = TOOL_RETRY_BASE_DELAY_MS * 2 ** (attempt - 1);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }

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

          // Truncate large tool results to prevent context window bloat
          const resultStr = safeStringify(result);
          const truncatedResult = resultStr.length > MAX_TOOL_RESULT_LENGTH
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
            ...(attempt > 0 ? { retries: attempt } : {}),
          });

          // Log tool execution to action_logs (non-blocking)
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
          toolSucceeded = true;
          break;
        } catch (err) {
          lastError = err instanceof Error ? err.message : String(err);
          // If not the last attempt, log retry and continue
          if (attempt < TOOL_RETRY_MAX) {
            continue;
          }
        }
      }

      if (!toolSucceeded && lastError) {
        const toolDuration = Math.round(performance.now() - toolStart);

        toolResults.push({
          type: 'tool_result',
          tool_use_id: toolBlock.id,
          content: `Error (after ${TOOL_RETRY_MAX + 1} attempts): ${lastError}`,
          is_error: true,
        });

        actions.push({
          type: 'tool_call',
          toolName: toolBlock.name,
          input: toolBlock.input,
          error: lastError,
          durationMs: toolDuration,
          retries: TOOL_RETRY_MAX,
        });

        consecutiveErrors++;

        // Log failed tool execution (non-blocking)
        try {
          await db.insert(actionLogs).values({
            projectId: session.projectId,
            agentId: session.agentId,
            sessionId: session.sessionId,
            actionType: 'tool_call',
            toolName: toolBlock.name,
            input: toolBlock.input as Record<string, unknown>,
            status: 'failed',
            error: lastError,
            durationMs: toolDuration,
          });
        } catch {
          // Non-blocking
        }
      }
    }

    // If approval is needed, break out of main loop
    if (needsApproval) break;

    // Feed tool results back to Claude
    messages.push({ role: 'user', content: toolResults });
  }

  const durationMs = Math.round(performance.now() - startTime);

  // Ensure terminal status
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
