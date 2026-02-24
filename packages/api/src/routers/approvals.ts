import { z } from 'zod';
import { createTRPCRouter, projectProcedure, adminProcedure } from '../trpc.js';
import { db, approvals, eq, and, desc } from '@ai-office/db';
import { TRPCError } from '@trpc/server';

export const approvalsRouter = createTRPCRouter({
  listPending: projectProcedure.query(async ({ ctx }) => {
    return db
      .select()
      .from(approvals)
      .where(and(eq(approvals.projectId, ctx.project!.id), eq(approvals.status, 'pending')))
      .orderBy(desc(approvals.createdAt));
  }),

  approve: adminProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        comment: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [updated] = await db
        .update(approvals)
        .set({
          status: 'approved',
          reviewedBy: ctx.user!.id,
          reviewComment: input.comment,
          reviewedAt: new Date(),
        })
        .where(
          and(
            eq(approvals.id, input.id),
            eq(approvals.projectId, ctx.project!.id),
            eq(approvals.status, 'pending'),
          ),
        )
        .returning();

      if (!updated) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Pending approval not found' });
      }
      return updated;
    }),

  reject: adminProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        comment: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [updated] = await db
        .update(approvals)
        .set({
          status: 'rejected',
          reviewedBy: ctx.user!.id,
          reviewComment: input.comment,
          reviewedAt: new Date(),
        })
        .where(
          and(
            eq(approvals.id, input.id),
            eq(approvals.projectId, ctx.project!.id),
            eq(approvals.status, 'pending'),
          ),
        )
        .returning();

      if (!updated) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Pending approval not found' });
      }
      return updated;
    }),
});
