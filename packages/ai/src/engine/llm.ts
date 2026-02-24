import Anthropic from '@anthropic-ai/sdk';
import { APIConnectionError, APIError } from '@anthropic-ai/sdk';
import type { MessageCreateParamsNonStreaming } from '@anthropic-ai/sdk/resources/messages';
import { createAnthropicClient, createDirectClient } from '../client.js';
import { db, actionLogs } from '@ai-office/db';

// Model pricing per million tokens (as of Feb 2026)
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  'claude-sonnet-4-6': { input: 3.0, output: 15.0 },
  'claude-haiku-4-5-20251001': { input: 0.8, output: 4.0 },
  'claude-opus-4-6': { input: 15.0, output: 75.0 },
};

const DEFAULT_PRICING = { input: 3.0, output: 15.0 };

function calculateCost(
  model: string,
  inputTokens: number,
  outputTokens: number,
): number {
  const pricing = MODEL_PRICING[model];
  if (!pricing) {
    console.warn(`[callLLM] Unknown model "${model}", using default pricing`);
  }
  const { input, output } = pricing ?? DEFAULT_PRICING;
  return (inputTokens * input + outputTokens * output) / 1_000_000;
}

export interface LLMCallContext {
  projectId: string;
  agentId: string;
  sessionId: string;
  agentName?: string;
}

export interface LLMCallResult {
  response: Anthropic.Message;
  metadata: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    costUsd: number;
    durationMs: number;
    model: string;
    actionLogId: string | null;
  };
}

// Timeout for Helicone-proxied calls before falling back to direct API
const HELICONE_TIMEOUT_MS = 5_000;

/**
 * Wrapper around Anthropic messages.create() with:
 * - Helicone proxy routing (with fallback to direct API on connection/5xx errors)
 * - Token tracking and cost calculation
 * - Latency measurement
 * - action_logs database persistence (non-blocking on failure)
 */
export async function callLLM(
  params: Omit<MessageCreateParamsNonStreaming, 'stream'>,
  context: LLMCallContext,
): Promise<LLMCallResult> {
  const startTime = performance.now();
  let usedFallback = false;

  // Create client routed through Helicone
  let client = createAnthropicClient({
    projectId: context.projectId,
    agentId: context.agentId,
    sessionId: context.sessionId,
    agentName: context.agentName,
  });

  let response: Anthropic.Message;

  try {
    response = await client.messages.create(
      { ...params, stream: false },
      { timeout: process.env.HELICONE_API_KEY ? HELICONE_TIMEOUT_MS : undefined },
    );
  } catch (err) {
    // Only fall back on network errors (proxy down) or proxy 5xx responses
    const isHeliconeError =
      (err instanceof APIConnectionError) ||
      (err instanceof APIError && err.status >= 500);

    if (isHeliconeError && process.env.HELICONE_API_KEY) {
      console.warn('[callLLM] Helicone proxy error, falling back to direct Anthropic API:', err);
      usedFallback = true;
      client = createDirectClient();
      response = await client.messages.create({ ...params, stream: false });
    } else {
      const durationMs = Math.round(performance.now() - startTime);

      // Log the failed call (non-blocking — don't mask the original error)
      try {
        await db.insert(actionLogs).values({
          projectId: context.projectId,
          agentId: context.agentId,
          sessionId: context.sessionId,
          actionType: 'llm_response',
          input: {
            model: params.model,
            messageCount: params.messages.length,
            maxTokens: params.max_tokens,
          } as Record<string, unknown>,
          status: 'failed',
          error: err instanceof Error ? err.message : String(err),
          durationMs,
        });
      } catch (logErr) {
        console.error('[callLLM] Failed to log error to action_logs:', logErr);
      }

      throw err;
    }
  }

  const durationMs = Math.round(performance.now() - startTime);
  const inputTokens = response.usage.input_tokens;
  const outputTokens = response.usage.output_tokens;
  const totalTokens = inputTokens + outputTokens;
  const costUsd = calculateCost(params.model, inputTokens, outputTokens);

  // Persist to action_logs (non-blocking — don't discard a valid LLM response on DB failure)
  let actionLogId: string | null = null;
  try {
    const [actionLog] = await db
      .insert(actionLogs)
      .values({
        projectId: context.projectId,
        agentId: context.agentId,
        sessionId: context.sessionId,
        actionType: 'llm_response',
        input: {
          model: params.model,
          messageCount: params.messages.length,
          maxTokens: params.max_tokens,
          temperature: params.temperature,
        } as Record<string, unknown>,
        output: {
          stopReason: response.stop_reason,
          contentBlocks: response.content.length,
          usedFallback,
        } as Record<string, unknown>,
        status: 'completed',
        tokensUsed: totalTokens,
        costUsd: String(costUsd),
        durationMs,
      })
      .returning();

    actionLogId = actionLog?.id ?? null;
  } catch (logErr) {
    console.error('[callLLM] Failed to log success to action_logs:', logErr);
  }

  return {
    response,
    metadata: {
      inputTokens,
      outputTokens,
      totalTokens,
      costUsd,
      durationMs,
      model: params.model,
      actionLogId,
    },
  };
}
