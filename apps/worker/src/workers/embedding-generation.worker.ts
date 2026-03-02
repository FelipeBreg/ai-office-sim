import { QUEUE_NAMES, embeddingGenerationJobSchema } from '@ai-office/queue';
import type { EmbeddingGenerationJob } from '@ai-office/queue';
import { createTypedWorker } from './create-worker.js';
import { db, documentChunks, eq, and, isNull, inArray } from '@ai-office/db';
import { generateEmbeddings } from '@ai-office/ai';

const BATCH_SIZE = 20;

export function createEmbeddingGenerationWorker() {
  return createTypedWorker<EmbeddingGenerationJob>({
    queueName: QUEUE_NAMES.EMBEDDING_GENERATION,
    concurrency: 3,
    schema: embeddingGenerationJobSchema,
    processor: async (job) => {
      const { documentId, projectId, chunkIds } = job.data;
      console.log(`[embedding] Processing: document=${documentId} project=${projectId}`);

      // Load chunks that need embeddings
      const conditions = [
        eq(documentChunks.documentId, documentId),
        eq(documentChunks.projectId, projectId),
      ];

      // If specific chunkIds provided, filter to those; otherwise get all without embeddings
      if (chunkIds && chunkIds.length > 0) {
        conditions.push(inArray(documentChunks.id, chunkIds));
      } else {
        conditions.push(isNull(documentChunks.embedding));
      }

      const chunks = await db
        .select({ id: documentChunks.id, content: documentChunks.content })
        .from(documentChunks)
        .where(and(...conditions));

      if (chunks.length === 0) {
        console.log(`[embedding] No chunks to embed for document=${documentId}`);
        await job.updateProgress(100);
        return { status: 'completed', documentId, chunksProcessed: 0 };
      }

      console.log(`[embedding] Generating embeddings for ${chunks.length} chunks`);

      // Process in batches
      let processed = 0;
      for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
        const batch = chunks.slice(i, i + BATCH_SIZE);
        const texts = batch.map((c) => c.content);

        const embeddings = await generateEmbeddings(texts);

        // Update each chunk with its embedding
        for (let j = 0; j < batch.length; j++) {
          await db
            .update(documentChunks)
            .set({ embedding: embeddings[j]! })
            .where(eq(documentChunks.id, batch[j]!.id));
        }

        processed += batch.length;
        await job.updateProgress(Math.round((processed / chunks.length) * 100));
      }

      console.log(`[embedding] Completed: document=${documentId} chunks=${processed}`);
      return { status: 'completed', documentId, chunksProcessed: processed };
    },
  });
}
