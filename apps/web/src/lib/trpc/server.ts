import 'server-only';
import { createTRPCContext, appRouter } from '@ai-office/api';
import { auth } from '@clerk/nextjs/server';
import { headers } from 'next/headers';
import { cache } from 'react';

export const serverTRPC = cache(async () => {
  const { userId } = await auth();
  const hdrs = await headers();
  const projectId = hdrs.get('x-project-id') ?? undefined;

  const ctx = await createTRPCContext({ clerkUserId: userId, projectId });
  return appRouter.createCaller(ctx);
});

/** Public server-side caller — no auth required (for public community pages) */
export const publicServerTRPC = cache(async () => {
  const ctx = await createTRPCContext({ clerkUserId: null });
  return appRouter.createCaller(ctx);
});
