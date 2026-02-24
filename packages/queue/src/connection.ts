import type { ConnectionOptions } from 'bullmq';

const redisUrl = process.env.REDIS_URL ?? 'redis://localhost:6379';

/**
 * BullMQ-compatible connection options parsed from REDIS_URL.
 * BullMQ creates and manages its own ioredis connections internally.
 */
export function getConnectionOptions(): ConnectionOptions {
  const parsed = new URL(redisUrl);
  return {
    host: parsed.hostname || 'localhost',
    port: Number(parsed.port) || 6379,
    password: parsed.password || undefined,
    username: parsed.username || undefined,
    db: parsed.pathname ? Number(parsed.pathname.slice(1)) || 0 : 0,
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  };
}
