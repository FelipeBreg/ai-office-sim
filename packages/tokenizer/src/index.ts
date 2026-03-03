import Anthropic from '@anthropic-ai/sdk';

/**
 * Fast token estimate using chars/4 heuristic.
 * Good enough for budget checks during context assembly.
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Exact token count via Anthropic's count_tokens API.
 * Use before the first LLM call to validate total context fits.
 */
export async function countTokensExact(
  model: string,
  messages: Anthropic.MessageParam[],
  systemPrompt?: string,
  tools?: Anthropic.Tool[],
): Promise<number> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.warn('[tokenizer] ANTHROPIC_API_KEY not set, falling back to estimate');
    const totalText = messages
      .map((m) => (typeof m.content === 'string' ? m.content : JSON.stringify(m.content)))
      .join('');
    return estimateTokens(totalText + (systemPrompt ?? '') + JSON.stringify(tools ?? []));
  }

  const client = new Anthropic({ apiKey });

  const params: Anthropic.Messages.MessageCountTokensParams = {
    model,
    messages,
  };

  if (systemPrompt) {
    params.system = systemPrompt;
  }

  if (tools && tools.length > 0) {
    params.tools = tools;
  }

  const result = await client.messages.countTokens(params);
  return result.input_tokens;
}

/**
 * Truncate text to fit within a token budget (using fast estimate).
 * Cuts at word boundary when possible.
 */
export function truncateToTokenBudget(text: string, maxTokens: number): string {
  if (estimateTokens(text) <= maxTokens) return text;

  const maxChars = maxTokens * 4;
  const truncated = text.slice(0, maxChars);
  const lastSpace = truncated.lastIndexOf(' ');

  if (lastSpace > maxChars * 0.8) {
    return truncated.slice(0, lastSpace) + '...';
  }
  return truncated + '...';
}
