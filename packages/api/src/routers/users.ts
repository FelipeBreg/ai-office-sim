import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc.js';
import { db, users, eq } from '@ai-office/db';

export const usersRouter = createTRPCRouter({
  getCurrent: protectedProcedure.query(async ({ ctx }) => {
    return ctx.user;
  }),

  updateLocale: protectedProcedure
    .input(z.object({ locale: z.enum(['pt-BR', 'en-US']) }))
    .mutation(async ({ ctx, input }) => {
      const [updated] = await db
        .update(users)
        .set({ locale: input.locale })
        .where(eq(users.id, ctx.user!.id))
        .returning();
      return updated;
    }),

  updateTimezone: protectedProcedure
    .input(z.object({ timezone: z.string().min(1).max(50) }))
    .mutation(async ({ ctx, input }) => {
      const [updated] = await db
        .update(users)
        .set({ timezone: input.timezone })
        .where(eq(users.id, ctx.user!.id))
        .returning();
      return updated;
    }),
});
