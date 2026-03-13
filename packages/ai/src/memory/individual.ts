import { db, agentMemory, eq, and, sql } from '@ai-office/db';
import { generateEmbeddings } from './ingest.js';

/** Load all memory entries for an agent in a project */
export async function loadMemory(
  agentId: string,
  projectId: string,
): Promise<Array<{ key: string; value: unknown }>> {
  const entries = await db
    .select({ key: agentMemory.key, value: agentMemory.value })
    .from(agentMemory)
    .where(and(eq(agentMemory.agentId, agentId), eq(agentMemory.projectId, projectId)));

  return entries;
}

/**
 * Upsert a memory entry for an agent (insert or update by agent+project+key).
 * Generates an embedding for the key+value so it can be searched semantically.
 */
export async function saveMemory(
  agentId: string,
  projectId: string,
  key: string,
  value: unknown,
): Promise<void> {
  // Generate embedding for semantic search
  const textToEmbed = `${key}: ${typeof value === 'string' ? value : JSON.stringify(value)}`;
  let embedding: number[] | undefined;
  try {
    const [emb] = await generateEmbeddings([textToEmbed.slice(0, 8000)]);
    embedding = emb;
  } catch {
    // Non-blocking — save without embedding if OpenAI is unavailable
  }

  const [existing] = await db
    .select({ id: agentMemory.id })
    .from(agentMemory)
    .where(
      and(
        eq(agentMemory.agentId, agentId),
        eq(agentMemory.projectId, projectId),
        eq(agentMemory.key, key),
      ),
    )
    .limit(1);

  if (existing) {
    await db
      .update(agentMemory)
      .set({ value, ...(embedding ? { embedding } : {}) })
      .where(eq(agentMemory.id, existing.id));
  } else {
    try {
      await db.insert(agentMemory).values({
        agentId,
        projectId,
        key,
        value,
        ...(embedding ? { embedding } : {}),
      });
    } catch {
      // If concurrent insert created a duplicate, update instead
      await db
        .update(agentMemory)
        .set({ value, ...(embedding ? { embedding } : {}) })
        .where(
          and(
            eq(agentMemory.agentId, agentId),
            eq(agentMemory.projectId, projectId),
            eq(agentMemory.key, key),
          ),
        );
    }
  }
}

/**
 * Semantic search over agent memory using pgvector cosine similarity.
 * Falls back to returning all entries if embeddings are unavailable.
 */
export async function searchMemory(
  agentId: string,
  projectId: string,
  query: string,
  topK: number = 5,
): Promise<Array<{ key: string; value: unknown; score?: number }>> {
  // Try semantic search first
  try {
    const [queryEmbedding] = await generateEmbeddings([query]);
    if (queryEmbedding) {
      const embeddingStr = `[${queryEmbedding.join(',')}]`;

      const results = await db
        .select({
          key: agentMemory.key,
          value: agentMemory.value,
          score: sql<number>`1 - (${agentMemory.embedding} <=> ${embeddingStr}::vector)`.as('score'),
        })
        .from(agentMemory)
        .where(
          and(
            eq(agentMemory.agentId, agentId),
            eq(agentMemory.projectId, projectId),
            sql`${agentMemory.embedding} IS NOT NULL`,
          ),
        )
        .orderBy(sql`${agentMemory.embedding} <=> ${embeddingStr}::vector`)
        .limit(topK);

      // If we got vector results, return them
      if (results.length > 0) {
        return results;
      }
    }
  } catch {
    // Fall through to non-vector search
  }

  // Fallback: return all entries (for memories without embeddings)
  const entries = await db
    .select({ key: agentMemory.key, value: agentMemory.value })
    .from(agentMemory)
    .where(and(eq(agentMemory.agentId, agentId), eq(agentMemory.projectId, projectId)))
    .limit(topK);

  return entries;
}
