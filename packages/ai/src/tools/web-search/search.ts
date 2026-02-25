import { z } from 'zod';
import { createHash } from 'node:crypto';
import { getRedisClient } from '@ai-office/queue';
import type { ToolDefinition, ToolExecutionContext } from '../../engine/types.js';

interface SerperOrganicResult {
  title: string;
  link: string;
  snippet: string;
  position: number;
}

interface SerperResponse {
  organic?: SerperOrganicResult[];
}

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  position: number;
}

const CACHE_TTL = 3600; // 1 hour

function buildCacheKey(query: string, numResults: number, locale: string): string {
  const hash = createHash('sha256')
    .update(`${query}|${numResults}|${locale}`)
    .digest('hex')
    .slice(0, 16);
  return `web_search:${hash}`;
}

export const searchWebTool: ToolDefinition = {
  name: 'search_web',
  description:
    'Search the internet using Google Search. Returns a list of results with title, URL, and snippet. ' +
    'Useful for finding current information, researching topics, or verifying facts.',
  inputSchema: z.object({
    query: z.string().min(1).max(400).describe('The search query'),
    numResults: z
      .number()
      .int()
      .min(1)
      .max(20)
      .optional()
      .describe('Number of results to return (default: 5)'),
    locale: z
      .string()
      .optional()
      .describe('Locale code for search results (default: pt-BR)'),
  }),
  requiresApproval: false,

  execute: async (input: unknown, _context: ToolExecutionContext) => {
    const { query, numResults = 5, locale = 'pt-BR' } = input as {
      query: string;
      numResults?: number;
      locale?: string;
    };

    const apiKey = process.env.SERPER_API_KEY;
    if (!apiKey) {
      return {
        success: false,
        error:
          'Web search is not configured. The SERPER_API_KEY environment variable is not set. ' +
          'Ask a project admin to configure it in Settings > Tools.',
      };
    }

    const cacheKey = buildCacheKey(query, numResults, locale);
    const redis = getRedisClient();

    // Check Redis cache
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return { success: true, results: JSON.parse(cached) as SearchResult[], cached: true };
      }
    } catch {
      // Cache miss or Redis error — proceed to API call
    }

    // Parse locale into hl (language) and gl (country)
    const [hl, gl] = locale.includes('-')
      ? [locale.split('-')[0], locale.split('-')[1]!.toLowerCase()]
      : [locale, locale];

    // Call Serper API
    try {
      const response = await fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: {
          'X-API-KEY': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ q: query, num: numResults, hl, gl }),
        signal: AbortSignal.timeout(10_000),
      });

      if (!response.ok) {
        const text = await response.text().catch(() => '');
        return {
          success: false,
          error: `Serper API returned ${response.status}: ${text.slice(0, 200)}`,
        };
      }

      const data = (await response.json()) as SerperResponse;
      const results: SearchResult[] = (data.organic ?? []).map((r) => ({
        title: r.title,
        url: r.link,
        snippet: r.snippet,
        position: r.position,
      }));

      // Store in Redis cache (skip empty results to avoid caching transient failures)
      if (results.length > 0) {
        try {
          await redis.set(cacheKey, JSON.stringify(results), 'EX', CACHE_TTL);
        } catch {
          // Cache write failure is non-fatal
        }
      }

      return { success: true, results, cached: false };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return {
        success: false,
        error: `Web search failed: ${message}`,
      };
    }
  },
};
