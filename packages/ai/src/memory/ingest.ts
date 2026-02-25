/**
 * Document ingestion pipeline for RAG.
 * Accepts text content, splits into chunks, generates embeddings,
 * and stores in document_chunks table.
 */
import { db, documents, documentChunks, eq } from '@ai-office/db';

const CHUNK_SIZE = 512; // tokens (approximate via chars / 4)
const CHUNK_OVERLAP = 64;
const CHARS_PER_TOKEN = 4; // rough approximation
const MAX_CHUNK_CHARS = CHUNK_SIZE * CHARS_PER_TOKEN;
const OVERLAP_CHARS = CHUNK_OVERLAP * CHARS_PER_TOKEN;
const EMBEDDING_MODEL = 'text-embedding-3-small';
const EMBEDDING_DIMENSIONS = 1536;
const OPENAI_EMBEDDING_URL = 'https://api.openai.com/v1/embeddings';
const FETCH_TIMEOUT_MS = 30_000;
const BATCH_SIZE = 20; // Max texts per embedding API call

export type DocumentSourceType = 'upload' | 'web' | 'api' | 'agent';

export interface IngestDocumentParams {
  projectId: string;
  title: string;
  content: string;
  sourceType: DocumentSourceType;
  sourceUrl?: string;
  metadata?: Record<string, unknown>;
}

export interface IngestResult {
  documentId: string;
  chunkCount: number;
  error?: string;
}

/**
 * Split text into overlapping chunks.
 * Tries to split at paragraph/sentence boundaries when possible.
 */
export function splitIntoChunks(text: string): string[] {
  const chunks: string[] = [];
  let offset = 0;

  while (offset < text.length) {
    let end = Math.min(offset + MAX_CHUNK_CHARS, text.length);

    // Try to break at a paragraph or sentence boundary
    if (end < text.length) {
      const slice = text.slice(offset, end);
      // Look for the last paragraph break
      const lastParagraph = slice.lastIndexOf('\n\n');
      if (lastParagraph > MAX_CHUNK_CHARS * 0.5) {
        end = offset + lastParagraph + 2;
      } else {
        // Look for the last sentence break
        const lastSentence = Math.max(
          slice.lastIndexOf('. '),
          slice.lastIndexOf('? '),
          slice.lastIndexOf('! '),
        );
        if (lastSentence > MAX_CHUNK_CHARS * 0.3) {
          end = offset + lastSentence + 2;
        }
      }
    }

    const chunk = text.slice(offset, end).trim();
    if (chunk.length > 0) {
      chunks.push(chunk);
    }

    // Move forward with overlap
    const nextOffset = end - OVERLAP_CHARS;
    offset = nextOffset > offset ? nextOffset : end; // Prevent infinite loops
  }

  return chunks;
}

/**
 * Generate embeddings for an array of texts using OpenAI API.
 * Returns array of float arrays (one per input text).
 */
async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY env var is required for embedding generation');
  }

  const results: number[][] = [];

  // Process in batches
  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);

    const res = await fetch(OPENAI_EMBEDDING_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: EMBEDDING_MODEL,
        input: batch,
        dimensions: EMBEDDING_DIMENSIONS,
      }),
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`OpenAI embedding API error (${res.status}): ${text}`);
    }

    const data = (await res.json()) as {
      data: Array<{ embedding: number[]; index: number }>;
    };

    // Sort by index to maintain order
    const sorted = data.data.sort((a, b) => a.index - b.index);
    for (const item of sorted) {
      results.push(item.embedding);
    }
  }

  return results;
}

/**
 * Ingest a document: store document record, split into chunks,
 * generate embeddings, and store chunks with embeddings.
 */
export async function ingestDocument(params: IngestDocumentParams): Promise<IngestResult> {
  const { projectId, title, content, sourceType, sourceUrl, metadata } = params;

  // 1. Store the document record
  const [doc] = await db
    .insert(documents)
    .values({
      projectId,
      title,
      sourceType,
      sourceUrl,
      content,
      metadata,
    })
    .returning();

  if (!doc) {
    return { documentId: '', chunkCount: 0, error: 'Failed to create document record' };
  }

  try {
    // 2. Split content into chunks
    const chunks = splitIntoChunks(content);

    if (chunks.length === 0) {
      return { documentId: doc.id, chunkCount: 0, error: 'Document has no content to chunk' };
    }

    // 3. Generate embeddings for all chunks
    const embeddings = await generateEmbeddings(chunks);

    // 4. Store chunks with embeddings
    const chunkValues = chunks.map((chunkContent, index) => ({
      documentId: doc.id,
      projectId,
      content: chunkContent,
      embedding: embeddings[index]!,
      chunkIndex: index,
      metadata: { charCount: chunkContent.length },
    }));

    await db.insert(documentChunks).values(chunkValues);

    return { documentId: doc.id, chunkCount: chunks.length };
  } catch (err) {
    // Clean up document on failure
    await db.delete(documents).where(eq(documents.id, doc.id));
    return {
      documentId: doc.id,
      chunkCount: 0,
      error: err instanceof Error ? err.message : 'Ingestion failed',
    };
  }
}

/**
 * Delete a document and all its chunks.
 */
export async function deleteDocument(documentId: string, projectId: string): Promise<boolean> {
  const [deleted] = await db
    .delete(documents)
    .where(eq(documents.id, documentId))
    .returning();

  return !!deleted;
}
