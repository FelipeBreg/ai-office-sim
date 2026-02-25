import { z } from 'zod';
import { createTRPCRouter, projectProcedure, adminProcedure } from '../trpc.js';
import { db, workflows, workflowRuns, eq, and, desc } from '@ai-office/db';
import { TRPCError } from '@trpc/server';

export const workflowsRouter = createTRPCRouter({
  list: projectProcedure.query(async ({ ctx }) => {
    return db
      .select()
      .from(workflows)
      .where(eq(workflows.projectId, ctx.project!.id))
      .orderBy(desc(workflows.createdAt));
  }),

  getById: projectProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [workflow] = await db
        .select()
        .from(workflows)
        .where(and(eq(workflows.id, input.id), eq(workflows.projectId, ctx.project!.id)))
        .limit(1);

      if (!workflow) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Workflow not found' });
      }
      return workflow;
    }),

  create: adminProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        description: z.string().optional(),
        definition: z.unknown().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [workflow] = await db
        .insert(workflows)
        .values({
          projectId: ctx.project!.id,
          createdBy: ctx.user!.id,
          ...input,
        })
        .returning();
      return workflow!;
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).max(100).optional(),
        description: z.string().optional(),
        definition: z.unknown().optional(),
        isActive: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const [updated] = await db
        .update(workflows)
        .set(data)
        .where(and(eq(workflows.id, id), eq(workflows.projectId, ctx.project!.id)))
        .returning();

      if (!updated) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Workflow not found' });
      }
      return updated;
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [deleted] = await db
        .delete(workflows)
        .where(and(eq(workflows.id, input.id), eq(workflows.projectId, ctx.project!.id)))
        .returning({ id: workflows.id });

      if (!deleted) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Workflow not found' });
      }
      return { deleted: true };
    }),

  trigger: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [workflow] = await db
        .select()
        .from(workflows)
        .where(and(eq(workflows.id, input.id), eq(workflows.projectId, ctx.project!.id)))
        .limit(1);

      if (!workflow) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Workflow not found' });
      }
      if (!workflow.isActive) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Workflow is inactive' });
      }

      const [run] = await db
        .insert(workflowRuns)
        .values({
          workflowId: workflow.id,
          projectId: ctx.project!.id,
        })
        .returning();

      // TODO: Enqueue workflow execution via BullMQ
      return run!;
    }),
});
