/**
 * Post-session automatic memory extraction.
 * Analyzes agent conversation transcripts and extracts key information
 * worth remembering for future sessions.
 *
 * Uses Claude Haiku for extraction (no OpenAI dependency).
 */
import { saveMemory } from './individual.js';
import { createDirectClient } from '../client.js';

const EXTRACTION_MODEL = 'claude-haiku-4-5-20251001';

const EXTRACTION_PROMPT = `You are a memory extraction assistant. Analyze the following agent conversation transcript and extract key information that would be useful for the agent to remember in future sessions.

Return a JSON array of objects with "key" and "value" fields. Keys should be descriptive and snake_case (e.g., "client_preference_language", "last_order_issue"). Values should be concise but complete.

Only extract genuinely useful, factual information. Skip greetings, pleasantries, and redundant data. Return an empty array if nothing is worth remembering.

IMPORTANT: Return ONLY a valid JSON array, nothing else.

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
  const client = createDirectClient();

  const response = await client.messages.create({
    model: EXTRACTION_MODEL,
    system: EXTRACTION_PROMPT,
    messages: [{ role: 'user', content: transcript.slice(0, 8000) }],
    max_tokens: 1024,
    temperature: 0.1,
  });

  const content = response.content
    .filter((b) => b.type === 'text')
    .map((b) => (b as unknown as { text: string }).text)
    .join('');

  if (!content) return [];

  try {
    // Try to extract JSON from the response (handle markdown code blocks)
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];

    const parsed = JSON.parse(jsonMatch[0]);
    const entries: unknown[] = Array.isArray(parsed) ? parsed : [];

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
