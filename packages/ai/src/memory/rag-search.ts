/**
 * RAG (Retrieval-Augmented Generation) search using pgvector cosine similarity.
 */
import { db, documentChunks, documents, eq, and, sql } from '@ai-office/db';

const OPENAI_EMBEDDING_URL = 'https://api.openai.com/v1/embeddings';
const EMBEDDING_MODEL = 'text-embedding-3-small';
const EMBEDDING_DIMENSIONS = 1536;
const FETCH_TIMEOUT_MS = 15_000;

export interface RagSearchParams {
  projectId: string;
  query: string;
  topK?: number;
  agentId?: string;
  archetypeSlug?: string;
  filters?: {
    sourceType?: string;
    dateRange?: { from?: string; to?: string };
  };
}

export interface RagSearchResult {
  content: string;
  documentTitle: string;
  documentId: string;
  chunkIndex: number;
  score: number;
  sourceType: string;
  isStatic: boolean;
}

/**
 * Generate embedding for a single query string.
 */
async function generateQueryEmbedding(query: string): Promise<number[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY env var is required for embedding generation');
  }

  const res = await fetch(OPENAI_EMBEDDING_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input: query,
      dimensions: EMBEDDING_DIMENSIONS,
    }),
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenAI embedding API error (${res.status}): ${text}`);
  }

  const data = (await res.json()) as {
    data: Array<{ embedding: number[] }>;
  };

  return data.data[0]!.embedding;
}

/** Relevance boost applied to curated static knowledge docs */
const STATIC_DOC_BOOST = 0.05;

/**
 * Perform semantic search over document chunks using pgvector cosine similarity.
 * Combines three document pools:
 *   1. Agent-scoped dynamic docs (if agentId provided)
 *   2. Project-wide dynamic docs
 *   3. Static archetype knowledge docs (if archetypeSlug provided, boosted)
 * Returns top-K results ranked by relevance.
 */
export async function ragSearch(params: RagSearchParams): Promise<RagSearchResult[]> {
  const { projectId, query, topK = 5, agentId, archetypeSlug, filters } = params;

  // 1. Generate embedding for the query
  const queryEmbedding = await generateQueryEmbedding(query);
  const embeddingStr = `[${queryEmbedding.join(',')}]`;

  // 2. Build base conditions
  const baseConditions = [
    eq(documentChunks.projectId, projectId),
    filters?.sourceType
      ? eq(documents.sourceType, filters.sourceType as 'upload' | 'web' | 'api' | 'agent')
      : undefined,
    filters?.dateRange?.from
      ? sql`${documents.createdAt} >= ${filters.dateRange.from}::timestamptz`
      : undefined,
    filters?.dateRange?.to
      ? sql`${documents.createdAt} <= ${filters.dateRange.to}::timestamptz`
      : undefined,
  ];

  // 3. Build scoping condition: agent-scoped + project-wide + static archetype docs
  // Dynamic docs: (agentId = X OR agentId IS NULL) AND isStatic = false
  // Static docs: isStatic = true AND archetypeSlug = Y
  const scopeCondition = (() => {
    const dynamicScope = agentId
      ? sql`(${documents.agentId} = ${agentId} OR ${documents.agentId} IS NULL)`
      : undefined;

    if (archetypeSlug) {
      const staticScope = sql`(${documents.isStatic} = true AND ${documents.archetypeSlug} = ${archetypeSlug})`;
      if (dynamicScope) {
        return sql`((${documents.isStatic} = false AND ${dynamicScope}) OR ${staticScope})`;
      }
      return sql`(${documents.isStatic} = false OR ${staticScope})`;
    }

    // No archetype — exclude static docs
    if (dynamicScope) {
      return sql`${documents.isStatic} = false AND ${dynamicScope}`;
    }
    return sql`${documents.isStatic} = false`;
  })();

  // 4. Fetch extra results to allow re-ranking with static boost
  const fetchLimit = topK + 5;

  const results = await db
    .select({
      content: documentChunks.content,
      chunkIndex: documentChunks.chunkIndex,
      documentId: documentChunks.documentId,
      documentTitle: documents.title,
      sourceType: documents.sourceType,
      isStatic: documents.isStatic,
      score: sql<number>`1 - (${documentChunks.embedding} <=> ${embeddingStr}::vector)`.as('score'),
    })
    .from(documentChunks)
    .innerJoin(documents, eq(documentChunks.documentId, documents.id))
    .where(and(...baseConditions, scopeCondition))
    .orderBy(sql`${documentChunks.embedding} <=> ${embeddingStr}::vector`)
    .limit(fetchLimit);

  // 5. Apply static doc boost and re-rank
  const boosted = results.map((r) => ({
    content: r.content,
    documentTitle: r.documentTitle,
    documentId: r.documentId,
    chunkIndex: r.chunkIndex,
    score: r.isStatic ? Math.min(r.score + STATIC_DOC_BOOST, 1.0) : r.score,
    sourceType: r.sourceType,
    isStatic: r.isStatic,
  }));

  boosted.sort((a, b) => b.score - a.score);
  return boosted.slice(0, topK);
}
