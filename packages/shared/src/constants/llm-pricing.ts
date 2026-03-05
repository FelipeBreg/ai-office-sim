/**
 * LLM pricing per million tokens (USD).
 * Updated when Anthropic changes pricing.
 */
export const LLM_PRICING: Record<string, { inputPer1M: number; outputPer1M: number; label: string }> = {
  'claude-sonnet-4-20250514': { inputPer1M: 3.0, outputPer1M: 15.0, label: 'Claude Sonnet 4' },
  'claude-sonnet-4-6': { inputPer1M: 3.0, outputPer1M: 15.0, label: 'Claude Sonnet 4.6' },
  'claude-haiku-4-5-20251001': { inputPer1M: 0.8, outputPer1M: 4.0, label: 'Claude Haiku 4.5' },
  'claude-opus-4-20250514': { inputPer1M: 15.0, outputPer1M: 75.0, label: 'Claude Opus 4' },
  'claude-opus-4-6': { inputPer1M: 15.0, outputPer1M: 75.0, label: 'Claude Opus 4.6' },
} as const;

/**
 * Estimate average tokens per agent session based on archetype complexity.
 */
const BASE_CONTEXT_TOKENS = 2000; // system prompt + context overhead
const TOKENS_PER_TOOL_SCHEMA = 80; // approximate per tool

export interface CostEstimate {
  estimatedTokensPerSession: number;
  estimatedOutputTokensPerSession: number;
  sessionsPerDay: number;
  dailyCostUsd: number;
  monthlyCostUsd: number;
}

export function estimateAgentCost(params: {
  model: string;
  toolCount: number;
  triggerType: 'always_on' | 'scheduled' | 'event' | 'manual' | 'agent';
  heartbeatIntervalMin?: number | null;
  cronFrequencyPerDay?: number;
}): CostEstimate {
  const pricing = LLM_PRICING[params.model] ?? LLM_PRICING['claude-sonnet-4-6']!;

  // Estimate input tokens per session
  const inputTokens = BASE_CONTEXT_TOKENS + (params.toolCount * TOKENS_PER_TOOL_SCHEMA) + 500; // 500 for trigger payload
  // Estimate output tokens (agent response + tool calls)
  const outputTokens = Math.round(inputTokens * 0.6); // rough 60% ratio

  // Sessions per day based on trigger type
  let sessionsPerDay: number;
  switch (params.triggerType) {
    case 'always_on':
      sessionsPerDay = params.heartbeatIntervalMin
        ? 1440 / params.heartbeatIntervalMin
        : 96; // default 15min = 96/day
      break;
    case 'scheduled':
      sessionsPerDay = params.cronFrequencyPerDay ?? 4;
      break;
    case 'event':
      sessionsPerDay = 5; // conservative estimate
      break;
    case 'agent':
      sessionsPerDay = 3; // triggered by other agents
      break;
    case 'manual':
    default:
      sessionsPerDay = 2; // user-triggered
      break;
  }

  const dailyInputCost = (inputTokens * sessionsPerDay / 1_000_000) * pricing.inputPer1M;
  const dailyOutputCost = (outputTokens * sessionsPerDay / 1_000_000) * pricing.outputPer1M;
  const dailyCostUsd = dailyInputCost + dailyOutputCost;

  return {
    estimatedTokensPerSession: inputTokens + outputTokens,
    estimatedOutputTokensPerSession: outputTokens,
    sessionsPerDay: Math.round(sessionsPerDay * 10) / 10,
    dailyCostUsd: Math.round(dailyCostUsd * 10000) / 10000,
    monthlyCostUsd: Math.round(dailyCostUsd * 30 * 100) / 100,
  };
}
