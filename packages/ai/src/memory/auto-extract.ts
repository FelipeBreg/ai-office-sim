/**
 * Post-session automatic memory extraction.
 * Analyzes agent conversation transcripts and extracts key information
 * worth remembering for future sessions.
 */
import { saveMemory } from './individual.js';

const OPENAI_CHAT_URL = 'https://api.openai.com/v1/chat/completions';
const EXTRACTION_MODEL = 'gpt-4o-mini';
const FETCH_TIMEOUT_MS = 30_000;

const EXTRACTION_PROMPT = `You are a memory extraction assistant. Analyze the following agent conversation transcript and extract key information that would be useful for the agent to remember in future sessions.

Return a JSON array of objects with "key" and "value" fields. Keys should be descriptive and snake_case (e.g., "client_preference_language", "last_order_issue"). Values should be concise but complete.

Only extract genuinely useful, factual information. Skip greetings, pleasantries, and redundant data. Return an empty array if nothing is worth remembering.

Example output:
[
  {"key": "client_maria_preferred_language", "value": "Portuguese, informal tone"},
  {"key": "recent_complaint_topic", "value": "Delivery delay on order #1234, resolved with 10% discount"}
]`;

export interface MemoryEntry {
  key: string;
  value: string;
}

/**
 * Extract memories from a conversation transcript.
 * Returns the extracted key-value pairs.
 */
export async function extractMemories(transcript: string): Promise<MemoryEntry[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY required for memory extraction');
  }

  const res = await fetch(OPENAI_CHAT_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: EXTRACTION_MODEL,
      messages: [
        { role: 'system', content: EXTRACTION_PROMPT },
        { role: 'user', content: transcript },
      ],
      temperature: 0.1,
      max_tokens: 1024,
      response_format: { type: 'json_object' },
    }),
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Memory extraction failed (${res.status}): ${text}`);
  }

  const data = (await res.json()) as {
    choices: Array<{ message: { content: string } }>;
  };

  const content = data.choices[0]?.message?.content;
  if (!content) return [];

  try {
    const parsed = JSON.parse(content);
    // Handle both { memories: [...] } and direct array
    const entries: unknown[] = Array.isArray(parsed) ? parsed : (parsed.memories ?? parsed.entries ?? []);

    return entries
      .filter((e): e is { key: string; value: string } =>
        typeof e === 'object' && e !== null && 'key' in e && 'value' in e,
      )
      .map((e) => ({
        key: String(e.key).slice(0, 200),
        value: String(e.value).slice(0, 2000),
      }));
  } catch {
    return [];
  }
}

/**
 * Run automatic memory extraction for an agent session.
 * Extracts memories from transcript and saves them to the agent's individual memory.
 */
export async function autoExtractAndSave(
  agentId: string,
  projectId: string,
  transcript: string,
): Promise<{ savedCount: number; error?: string }> {
  try {
    const memories = await extractMemories(transcript);

    for (const { key, value } of memories) {
      await saveMemory(agentId, projectId, key, value);
    }

    return { savedCount: memories.length };
  } catch (err) {
    return {
      savedCount: 0,
      error: err instanceof Error ? err.message : 'Auto-extraction failed',
    };
  }
}
