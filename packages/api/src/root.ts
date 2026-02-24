import { createTRPCRouter } from './trpc.js';

// Routers will be added in P0-9.2
export const appRouter = createTRPCRouter({});

export type AppRouter = typeof appRouter;
