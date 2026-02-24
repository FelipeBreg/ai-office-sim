import type Anthropic from '@anthropic-ai/sdk';
import { callLLM } from './llm.js';
import type {
  AgentContext,
  AgentSession,
  ExecutionResult,
  ActionRecord,
  SafetyLimits,
  ToolExecutionContext,
} from './types.js';
import { DEFAULT_SAFETY_LIMITS } from './types.js';
import { db, actionLogs } from '@ai-office/db';

const TOOL_CALL_TIMEOUT_MS = 60_000; // 60s per tool call
const MAX_TOOL_RESULT_LENGTH = 10_000; // Truncate large tool outputs

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
  const triggerContent = context.triggerPayload
    ? String(typeof context.triggerPayload === 'string' ? context.triggerPayload : safeStringify(context.triggerPayload)).slice(0, 10_000)
    : 'Start your work.';

  let userMessage: string;
  if (context.memory.length > 0) {
    const memoryText = context.memory
      .map((m) => `[${m.key}]: ${safeStringify(m.value)}`)
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

      // Check approval requirement — abort session for human review
      if (toolDef.requiresApproval) {
        needsApproval = true;
        toolResults.push({
          type: 'tool_result',
          tool_use_id: toolBlock.id,
          content: 'This action requires human approval. Session paused for review.',
          is_error: false,
        });
        session.status = 'aborted';
        session.abortReason = `Awaiting approval for tool "${toolBlock.name}"`;
        break;
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

      // Rate limiting: enforce minimum interval between tool calls
      const now = performance.now();
      const timeSinceLastCall = now - lastToolCallTime;
      if (lastToolCallTime > 0 && timeSinceLastCall < limits.toolCallMinIntervalMs) {
        await new Promise((resolve) =>
          setTimeout(resolve, limits.toolCallMinIntervalMs - timeSinceLastCall),
        );
      }

      // Execute tool with timeout (timer is properly cleared)
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
            error: errorMsg,
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
    status: session.status as 'completed' | 'error' | 'aborted',
    actions,
    finalResponse,
    totalTokens: session.totalTokens,
    totalCostUsd: session.totalCostUsd,
    durationMs,
    abortReason: session.abortReason,
  };
}
