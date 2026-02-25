// Supported locales
export const LOCALES = ['pt-BR', 'en-US'] as const;
export const DEFAULT_LOCALE = 'pt-BR' as const;

// Agent defaults
export const AGENT_DEFAULTS = {
  maxActionsPerSession: 20,
  maxTokensPerSession: 100_000,
  maxDurationMs: 5 * 60 * 1000, // 5 minutes
  maxConsecutiveErrors: 3,
  toolCallRateLimitMs: 2_000, // 1 per 2 seconds for external APIs
  defaultModel: 'claude-sonnet-4-6',
} as const;

// Embedding dimensions
export const EMBEDDING_DIMENSIONS = 1536;

// Pagination
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export * from './plan-limits.js';
