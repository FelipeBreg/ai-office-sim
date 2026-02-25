import { z } from 'zod';
import { createTRPCRouter, projectProcedure, adminProcedure } from '../trpc.js';
import { db, approvals, approvalRules, eq, and, desc } from '@ai-office/db';
import { TRPCError } from '@trpc/server';

export const approvalsRouter = createTRPCRouter({
  listPending: projectProcedure.query(async ({ ctx }) => {
    return db
      .select()
      .from(approvals)
      .where(and(eq(approvals.projectId, ctx.project!.id), eq(approvals.status, 'pending')))
      .orderBy(desc(approvals.createdAt));
  }),

  listAll: projectProcedure
    .input(z.object({
      status: z.enum(['pending', 'approved', 'rejected']).optional(),
      limit: z.number().int().min(1).max(100).default(50),
    }))
    .query(async ({ ctx, input }) => {
      const conditions = [eq(approvals.projectId, ctx.project!.id)];
      if (input.status) {
        conditions.push(eq(approvals.status, input.status));
      }

      return db
        .select()
        .from(approvals)
        .where(and(...conditions))
        .orderBy(desc(approvals.createdAt))
        .limit(input.limit);
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

  // ── Approval Rules (P1-6.4) ──

  listRules: projectProcedure
    .input(z.object({
      agentId: z.string().uuid().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const conditions = [eq(approvalRules.projectId, ctx.project!.id)];
      if (input.agentId) {
        conditions.push(eq(approvalRules.agentId, input.agentId));
      }

      return db
        .select()
        .from(approvalRules)
        .where(and(...conditions))
        .orderBy(approvalRules.toolName);
    }),

  setRule: adminProcedure
    .input(z.object({
      agentId: z.string().uuid(),
      toolName: z.string().min(1),
      action: z.enum(['always_allow', 'always_block', 'require_approval']),
    }))
    .mutation(async ({ ctx, input }) => {
      // Upsert: one rule per project+agent+tool
      const [existing] = await db
        .select({ id: approvalRules.id })
        .from(approvalRules)
        .where(
          and(
            eq(approvalRules.projectId, ctx.project!.id),
            eq(approvalRules.agentId, input.agentId),
            eq(approvalRules.toolName, input.toolName),
          ),
        )
        .limit(1);

      if (existing) {
        const [updated] = await db
          .update(approvalRules)
          .set({ action: input.action, createdBy: ctx.user!.id })
          .where(eq(approvalRules.id, existing.id))
          .returning();
        return updated!;
      }

      const [created] = await db
        .insert(approvalRules)
        .values({
          projectId: ctx.project!.id,
          agentId: input.agentId,
          toolName: input.toolName,
          action: input.action,
          createdBy: ctx.user!.id,
        })
        .returning();
      return created!;
    }),

  deleteRule: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [deleted] = await db
        .delete(approvalRules)
        .where(
          and(
            eq(approvalRules.id, input.id),
            eq(approvalRules.projectId, ctx.project!.id),
          ),
        )
        .returning();

      if (!deleted) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Approval rule not found' });
      }
      return { deleted: true };
    }),
});
