import { z } from 'zod';
import { createTRPCRouter, projectProcedure, adminProcedure } from '../trpc.js';
import { db, agentMemory, eq, and, desc } from '@ai-office/db';
import { TRPCError } from '@trpc/server';

export const agentMemoryRouter = createTRPCRouter({
  list: projectProcedure
    .input(z.object({ agentId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return db
        .select()
        .from(agentMemory)
        .where(
          and(
            eq(agentMemory.agentId, input.agentId),
            eq(agentMemory.projectId, ctx.project!.id),
          ),
        )
        .orderBy(desc(agentMemory.updatedAt));
    }),

  update: adminProcedure
    .input(
      z.object({
        agentId: z.string().uuid(),
        key: z.string().min(1),
        value: z.unknown(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Upsert: update if key exists, insert otherwise
      const [existing] = await db
        .select({ id: agentMemory.id })
        .from(agentMemory)
        .where(
          and(
            eq(agentMemory.agentId, input.agentId),
            eq(agentMemory.projectId, ctx.project!.id),
            eq(agentMemory.key, input.key),
          ),
        )
        .limit(1);

      if (existing) {
        const [updated] = await db
          .update(agentMemory)
          .set({ value: input.value })
          .where(eq(agentMemory.id, existing.id))
          .returning();
        return updated!;
      }

      const [created] = await db
        .insert(agentMemory)
        .values({
          agentId: input.agentId,
          projectId: ctx.project!.id,
          key: input.key,
          value: input.value,
        })
        .returning();
      return created!;
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [deleted] = await db
        .delete(agentMemory)
        .where(
          and(
            eq(agentMemory.id, input.id),
            eq(agentMemory.projectId, ctx.project!.id),
          ),
        )
        .returning({ id: agentMemory.id });

      if (!deleted) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Memory entry not found' });
      }
      return { deleted: true };
    }),
});
