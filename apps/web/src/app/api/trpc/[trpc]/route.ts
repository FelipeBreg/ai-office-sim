import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter, createTRPCContext } from '@ai-office/api';
import { auth } from '@clerk/nextjs/server';

const handler = async (req: Request) => {
  return fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: async () => {
      const { userId } = await auth();
      const projectId = req.headers.get('x-project-id') ?? undefined;
      return createTRPCContext({ clerkUserId: userId, projectId });
    },
  });
};

export { handler as GET, handler as POST };
