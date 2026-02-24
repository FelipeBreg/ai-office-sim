import { initTRPC } from '@trpc/server';
import superjson from 'superjson';

// Context will be expanded in P0-5.4 with auth + project context
export const createTRPCContext = async () => {
  return {};
};

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;
