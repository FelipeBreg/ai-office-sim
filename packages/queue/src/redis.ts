import { Redis } from 'ioredis';

const redisUrl = process.env.REDIS_URL ?? 'redis://localhost:6379';

let client: Redis | null = null;

/**
 * Returns a shared ioredis client singleton.
 * Parses the same REDIS_URL used by BullMQ queues.
 */
export function getRedisClient(): Redis {
  if (!client) {
    const parsed = new URL(redisUrl);
    client = new Redis({
      host: parsed.hostname || 'localhost',
      port: Number(parsed.port) || 6379,
      password: parsed.password || undefined,
      username: parsed.username || undefined,
      db: parsed.pathname ? Number(parsed.pathname.slice(1)) || 0 : 0,
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      lazyConnect: true,
    });
    client.on('error', (err) => {
      console.error('[redis] Connection error:', err.message);
    });
  }
  return client;
}
