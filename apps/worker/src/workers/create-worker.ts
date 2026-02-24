import { Worker } from 'bullmq';
import type { Processor } from 'bullmq';
import { getConnectionOptions } from '@ai-office/queue';
import type { ZodType, ZodTypeDef } from 'zod';

interface WorkerConfig<T> {
  queueName: string;
  concurrency: number;
  schema: ZodType<T, ZodTypeDef, unknown>;
  processor: Processor<T>;
}

/**
 * Generic typed worker factory.
 * - Validates job payloads with Zod before processing
 * - Registers error/completed/failed event handlers
 * - Stalled interval set to 30s
 */
export function createTypedWorker<T>(config: WorkerConfig<T>): Worker<T> {
  const { queueName, concurrency, schema, processor } = config;

  const worker = new Worker<T>(
    queueName,
    async (job, token) => {
      // Validate payload at runtime
      schema.parse(job.data);
      return processor(job, token);
    },
    {
      connection: getConnectionOptions(),
      concurrency,
      stalledInterval: 30_000,
    },
  );

  worker.on('completed', (job) => {
    console.log(`[${queueName}] Job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    console.error(`[${queueName}] Job ${job?.id} failed:`, err.message);
  });

  worker.on('error', (err) => {
    console.error(`[${queueName}] Worker error:`, err.message);
  });

  return worker;
}
