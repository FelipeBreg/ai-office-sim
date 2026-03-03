import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter, createTRPCContext } from '@ai-office/api';
import { auth } from '@clerk/nextjs/server';

// ---------------------------------------------------------------------------
// In-memory sliding window rate limiter (per-user, 1-minute window)
// Replace with Upstash Ratelimit in production for multi-instance support.
// ---------------------------------------------------------------------------
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 120; // 120 requests per minute per user

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

// Periodically clean stale entries (every 5 minutes)
if (typeof globalThis !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitMap) {
      if (entry.resetAt < now) rateLimitMap.delete(key);
    }
  }, 300_000);
}

function checkRateLimit(userId: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);

  if (!entry || entry.resetAt < now) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1 };
  }

  entry.count++;
  if (entry.count > RATE_LIMIT_MAX) {
    return { allowed: false, remaining: 0 };
  }
  return { allowed: true, remaining: RATE_LIMIT_MAX - entry.count };
}

// ---------------------------------------------------------------------------
// Request handler
// ---------------------------------------------------------------------------
const MAX_BODY_SIZE = 1_000_000; // 1MB

const handler = async (req: Request) => {
  // Enforce request body size limit
  const contentLength = parseInt(req.headers.get('content-length') || '0', 10);
  if (contentLength > MAX_BODY_SIZE) {
    return new Response(JSON.stringify({ error: 'Payload too large' }), {
      status: 413,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Authenticate
  const { userId } = await auth();

  // Rate limit authenticated users
  if (userId) {
    const { allowed, remaining } = checkRateLimit(userId);
    if (!allowed) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Try again in 1 minute.' }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': '60',
            'X-RateLimit-Limit': String(RATE_LIMIT_MAX),
            'X-RateLimit-Remaining': '0',
          },
        },
      );
    }

    // Add rate limit headers to response
    const response = await fetchRequestHandler({
      endpoint: '/api/trpc',
      req,
      router: appRouter,
      createContext: async () => {
        const projectId = req.headers.get('x-project-id') ?? undefined;
        return createTRPCContext({ clerkUserId: userId, projectId });
      },
    });

    response.headers.set('X-RateLimit-Limit', String(RATE_LIMIT_MAX));
    response.headers.set('X-RateLimit-Remaining', String(remaining));
    return response;
  }

  // Unauthenticated requests (no rate limit applied)
  return fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: async () => {
      const projectId = req.headers.get('x-project-id') ?? undefined;
      return createTRPCContext({ clerkUserId: null, projectId });
    },
  });
};

export { handler as GET, handler as POST };
