import { z } from 'zod';
import { createTRPCRouter, projectProcedure, adminProcedure } from '../trpc.js';
import { db, feedback, eq, and, desc, sql, count } from '@ai-office/db';

export const feedbackRouter = createTRPCRouter({
  submit: projectProcedure
    .input(
      z.object({
        rating: z.number().int().min(1).max(5),
        category: z.enum(['bug', 'feature', 'confusion', 'praise']),
        description: z.string().min(1).max(2000),
        screenshotUrl: z.string().url().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [entry] = await db
        .insert(feedback)
        .values({
          projectId: ctx.project!.id,
          userId: ctx.user!.id,
          rating: input.rating,
          category: input.category,
          description: input.description,
          screenshotUrl: input.screenshotUrl ?? null,
        })
        .returning();
      return entry!;
    }),

  list: adminProcedure
    .input(
      z.object({
        limit: z.number().int().min(1).max(100).optional().default(50),
        category: z.enum(['bug', 'feature', 'confusion', 'praise']).optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const where = input.category
        ? and(eq(feedback.projectId, ctx.project!.id), eq(feedback.category, input.category))
        : eq(feedback.projectId, ctx.project!.id);

      return db
        .select()
        .from(feedback)
        .where(where)
        .orderBy(desc(feedback.createdAt))
        .limit(input.limit);
    }),

  stats: adminProcedure.query(async ({ ctx }) => {
    const rows = await db
      .select({
        total: count(),
        avgRating: sql<string>`COALESCE(AVG(${feedback.rating}), 0)`,
      })
      .from(feedback)
      .where(eq(feedback.projectId, ctx.project!.id));

    const categoryRows = await db
      .select({
        category: feedback.category,
        cnt: count(),
      })
      .from(feedback)
      .where(eq(feedback.projectId, ctx.project!.id))
      .groupBy(feedback.category);

    const byCategory: Record<string, number> = {};
    for (const row of categoryRows) {
      byCategory[row.category] = row.cnt;
    }

    return {
      total: rows[0]?.total ?? 0,
      averageRating: Number(rows[0]?.avgRating ?? 0),
      byCategory,
    };
  }),
});
