import { QUEUE_NAMES, embeddingGenerationJobSchema } from '@ai-office/queue';
import type { EmbeddingGenerationJob } from '@ai-office/queue';
import { createTypedWorker } from './create-worker.js';

export function createEmbeddingGenerationWorker() {
  return createTypedWorker<EmbeddingGenerationJob>({
    queueName: QUEUE_NAMES.EMBEDDING_GENERATION,
    concurrency: 3,
    schema: embeddingGenerationJobSchema,
    processor: async (job) => {
      const { documentId, projectId } = job.data;
      console.log(`[embedding] Processing: document=${documentId} project=${projectId}`);

      // TODO: Load document chunks, generate embeddings, store in DB
      await job.updateProgress(100);
      return { status: 'completed', documentId };
    },
  });
}
