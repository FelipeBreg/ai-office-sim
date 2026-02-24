import { db, agentMemory, eq, and } from '@ai-office/db';

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

/** Upsert a memory entry for an agent (insert or update by agent+project+key) */
export async function saveMemory(
  agentId: string,
  projectId: string,
  key: string,
  value: unknown,
): Promise<void> {
  // Use INSERT ... ON CONFLICT to avoid TOCTOU race conditions.
  // Note: requires a unique index on (agentId, projectId, key) in the schema.
  // Fallback to select-then-update/insert until the index is added.
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
      .set({ value })
      .where(eq(agentMemory.id, existing.id));
  } else {
    try {
      await db.insert(agentMemory).values({
        agentId,
        projectId,
        key,
        value,
      });
    } catch {
      // If concurrent insert created a duplicate, update instead
      await db
        .update(agentMemory)
        .set({ value })
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
 * Semantic search over agent memory.
 * Stub: returns all entries matching the agent/project.
 * Real implementation will use pgvector cosine similarity on embeddings.
 */
export async function searchMemory(
  agentId: string,
  projectId: string,
  _query: string,
  topK: number = 5,
): Promise<Array<{ key: string; value: unknown }>> {
  // TODO P1: implement vector similarity search with embeddings
  const entries = await db
    .select({ key: agentMemory.key, value: agentMemory.value })
    .from(agentMemory)
    .where(and(eq(agentMemory.agentId, agentId), eq(agentMemory.projectId, projectId)))
    .limit(topK);

  return entries;
}
