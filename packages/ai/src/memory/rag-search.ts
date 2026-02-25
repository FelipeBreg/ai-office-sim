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

/**
 * Perform semantic search over document chunks using pgvector cosine similarity.
 * Returns top-K results ranked by relevance.
 */
export async function ragSearch(params: RagSearchParams): Promise<RagSearchResult[]> {
  const { projectId, query, topK = 5, filters } = params;

  // 1. Generate embedding for the query
  const queryEmbedding = await generateQueryEmbedding(query);
  const embeddingStr = `[${queryEmbedding.join(',')}]`;

  // 2. Build the SQL query with cosine similarity
  // cosine_distance returns distance (0 = identical), we want similarity (1 - distance)
  const results = await db
    .select({
      content: documentChunks.content,
      chunkIndex: documentChunks.chunkIndex,
      documentId: documentChunks.documentId,
      documentTitle: documents.title,
      sourceType: documents.sourceType,
      score: sql<number>`1 - (${documentChunks.embedding} <=> ${embeddingStr}::vector)`.as('score'),
    })
    .from(documentChunks)
    .innerJoin(documents, eq(documentChunks.documentId, documents.id))
    .where(
      and(
        eq(documentChunks.projectId, projectId),
        // Filter by source type if specified
        filters?.sourceType
          ? eq(documents.sourceType, filters.sourceType as 'upload' | 'web' | 'api' | 'agent')
          : undefined,
        // Filter by date range if specified
        filters?.dateRange?.from
          ? sql`${documents.createdAt} >= ${filters.dateRange.from}::timestamptz`
          : undefined,
        filters?.dateRange?.to
          ? sql`${documents.createdAt} <= ${filters.dateRange.to}::timestamptz`
          : undefined,
      ),
    )
    .orderBy(sql`${documentChunks.embedding} <=> ${embeddingStr}::vector`)
    .limit(topK);

  return results.map((r) => ({
    content: r.content,
    documentTitle: r.documentTitle,
    documentId: r.documentId,
    chunkIndex: r.chunkIndex,
    score: r.score,
    sourceType: r.sourceType,
  }));
}
