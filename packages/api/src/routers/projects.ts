import { z } from 'zod';
import { createTRPCRouter, protectedProcedure, projectProcedure, adminProcedure } from '../trpc.js';
import { db, projects, eq, and, desc } from '@ai-office/db';
import { TRPCError } from '@trpc/server';

export const projectsRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    return db
      .select()
      .from(projects)
      .where(eq(projects.orgId, ctx.org!.id))
      .orderBy(desc(projects.createdAt));
  }),

  getById: projectProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [project] = await db
        .select()
        .from(projects)
        .where(and(eq(projects.id, input.id), eq(projects.orgId, ctx.org!.id)))
        .limit(1);

      if (!project) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Project not found' });
      }
      return project;
    }),

  create: adminProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        slug: z.string().min(1).max(50),
        color: z.string().optional(),
        sector: z.string().optional(),
        primaryGoal: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [project] = await db
        .insert(projects)
        .values({
          orgId: ctx.org!.id,
          ...input,
        })
        .returning();
      return project!;
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).max(100).optional(),
        color: z.string().optional(),
        sector: z.string().optional(),
        primaryGoal: z.string().optional(),
        isActive: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const [updated] = await db
        .update(projects)
        .set(data)
        .where(and(eq(projects.id, id), eq(projects.orgId, ctx.org!.id)))
        .returning();

      if (!updated) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Project not found' });
      }
      return updated;
    }),
});
