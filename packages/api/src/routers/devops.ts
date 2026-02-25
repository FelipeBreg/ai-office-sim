import { z } from 'zod';
import { createTRPCRouter, projectProcedure, adminProcedure } from '../trpc.js';
import { db, devopsRequests, humanTasks, agents, users, eq, and, desc, inArray } from '@ai-office/db';
import { TRPCError } from '@trpc/server';

export const devopsRouter = createTRPCRouter({
  // ── DevOps Requests ──

  listRequests: projectProcedure
    .input(
      z.object({
        status: z
          .enum(['pending', 'in_review', 'approved', 'rejected', 'deployed', 'failed'])
          .optional(),
        type: z.enum(['deploy', 'pr_review', 'rollback', 'infra_change']).optional(),
        limit: z.number().int().min(1).max(100).default(50),
      }),
    )
    .query(async ({ ctx, input }) => {
      const conditions = [eq(devopsRequests.projectId, ctx.project!.id)];
      if (input.status) {
        conditions.push(eq(devopsRequests.status, input.status));
      }
      if (input.type) {
        conditions.push(eq(devopsRequests.type, input.type));
      }

      return db
        .select()
        .from(devopsRequests)
        .where(and(...conditions))
        .orderBy(desc(devopsRequests.createdAt))
        .limit(input.limit);
    }),

  getRequest: projectProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [req] = await db
        .select()
        .from(devopsRequests)
        .where(
          and(eq(devopsRequests.id, input.id), eq(devopsRequests.projectId, ctx.project!.id)),
        )
        .limit(1);

      if (!req) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'DevOps request not found' });
      }
      return req;
    }),

  createRequest: projectProcedure
    .input(
      z.object({
        agentId: z.string().uuid(),
        type: z.enum(['deploy', 'pr_review', 'rollback', 'infra_change']),
        priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
        title: z.string().min(1).max(200),
        description: z.string().max(2000).optional(),
        metadata: z
          .object({
            branch: z.string().optional(),
            commitSha: z.string().optional(),
            prUrl: z.string().url().optional(),
            prNumber: z.number().int().optional(),
            environment: z.string().optional(),
            repoUrl: z.string().url().optional(),
            rollbackTarget: z.string().optional(),
          })
          .optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Verify agent belongs to this project
      const [agent] = await db
        .select({ id: agents.id })
        .from(agents)
        .where(and(eq(agents.id, input.agentId), eq(agents.projectId, ctx.project!.id)))
        .limit(1);

      if (!agent) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Agent not found in this project' });
      }

      const [created] = await db
        .insert(devopsRequests)
        .values({
          projectId: ctx.project!.id,
          agentId: input.agentId,
          type: input.type,
          priority: input.priority,
          title: input.title,
          description: input.description,
          metadata: input.metadata,
        })
        .returning();

      return created!;
    }),

  reviewRequest: adminProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        action: z.enum(['approve', 'reject']),
        comment: z.string().max(1000).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const newStatus = input.action === 'approve' ? 'approved' : 'rejected';

      const [updated] = await db
        .update(devopsRequests)
        .set({
          status: newStatus as typeof devopsRequests.$inferInsert.status,
          reviewedBy: ctx.user!.id,
          reviewComment: input.comment,
          reviewedAt: new Date(),
        })
        .where(
          and(
            eq(devopsRequests.id, input.id),
            eq(devopsRequests.projectId, ctx.project!.id),
            inArray(devopsRequests.status, ['pending', 'in_review']),
          ),
        )
        .returning();

      if (!updated) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Reviewable DevOps request not found' });
      }
      return updated;
    }),

  markDeployed: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [updated] = await db
        .update(devopsRequests)
        .set({
          status: 'deployed',
          deployedAt: new Date(),
        })
        .where(
          and(
            eq(devopsRequests.id, input.id),
            eq(devopsRequests.projectId, ctx.project!.id),
            eq(devopsRequests.status, 'approved'),
          ),
        )
        .returning();

      if (!updated) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Approved DevOps request not found',
        });
      }
      return updated;
    }),

  markFailed: adminProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        comment: z.string().max(1000).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [updated] = await db
        .update(devopsRequests)
        .set({
          status: 'failed',
          reviewComment: input.comment,
        })
        .where(
          and(
            eq(devopsRequests.id, input.id),
            eq(devopsRequests.projectId, ctx.project!.id),
            inArray(devopsRequests.status, ['approved', 'deployed']),
          ),
        )
        .returning();

      if (!updated) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'DevOps request not found or not in a valid state' });
      }
      return updated;
    }),

  // ── Human Tasks ──

  listTasks: projectProcedure
    .input(
      z.object({
        status: z.enum(['todo', 'in_progress', 'done']).optional(),
        assignedTo: z.string().uuid().optional(),
        limit: z.number().int().min(1).max(100).default(50),
      }),
    )
    .query(async ({ ctx, input }) => {
      const conditions = [eq(humanTasks.projectId, ctx.project!.id)];
      if (input.status) {
        conditions.push(eq(humanTasks.status, input.status));
      }
      if (input.assignedTo) {
        conditions.push(eq(humanTasks.assignedTo, input.assignedTo));
      }

      return db
        .select()
        .from(humanTasks)
        .where(and(...conditions))
        .orderBy(desc(humanTasks.createdAt))
        .limit(input.limit);
    }),

  createTask: projectProcedure
    .input(
      z.object({
        agentId: z.string().uuid().optional(),
        title: z.string().min(1).max(200),
        description: z.string().max(2000).optional(),
        context: z.string().max(2000).optional(),
        priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
        assignedTo: z.string().uuid().optional(),
        devopsRequestId: z.string().uuid().optional(),
        dueAt: z.date().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Validate agentId belongs to this project
      if (input.agentId) {
        const [agent] = await db
          .select({ id: agents.id })
          .from(agents)
          .where(and(eq(agents.id, input.agentId), eq(agents.projectId, ctx.project!.id)))
          .limit(1);
        if (!agent) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Agent not found in this project' });
        }
      }

      // Validate assignedTo belongs to the same org
      if (input.assignedTo) {
        const [user] = await db
          .select({ id: users.id })
          .from(users)
          .where(and(eq(users.id, input.assignedTo), eq(users.orgId, ctx.org!.id)))
          .limit(1);
        if (!user) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Assigned user not found in organization' });
        }
      }

      const [created] = await db
        .insert(humanTasks)
        .values({
          projectId: ctx.project!.id,
          agentId: input.agentId,
          title: input.title,
          description: input.description,
          context: input.context,
          priority: input.priority,
          assignedTo: input.assignedTo,
          devopsRequestId: input.devopsRequestId,
          dueAt: input.dueAt,
        })
        .returning();

      return created!;
    }),

  updateTaskStatus: projectProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        status: z.enum(['todo', 'in_progress', 'done']),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [updated] = await db
        .update(humanTasks)
        .set({
          status: input.status,
          completedAt: input.status === 'done' ? new Date() : null,
        })
        .where(
          and(eq(humanTasks.id, input.id), eq(humanTasks.projectId, ctx.project!.id)),
        )
        .returning();

      if (!updated) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Human task not found' });
      }
      return updated;
    }),

  assignTask: projectProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        assignedTo: z.string().uuid().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Validate assignedTo belongs to the same org
      if (input.assignedTo) {
        const [user] = await db
          .select({ id: users.id })
          .from(users)
          .where(and(eq(users.id, input.assignedTo), eq(users.orgId, ctx.org!.id)))
          .limit(1);
        if (!user) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Assigned user not found in organization' });
        }
      }

      const [updated] = await db
        .update(humanTasks)
        .set({ assignedTo: input.assignedTo })
        .where(
          and(eq(humanTasks.id, input.id), eq(humanTasks.projectId, ctx.project!.id)),
        )
        .returning();

      if (!updated) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Human task not found' });
      }
      return updated;
    }),

  deleteTask: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [deleted] = await db
        .delete(humanTasks)
        .where(
          and(eq(humanTasks.id, input.id), eq(humanTasks.projectId, ctx.project!.id)),
        )
        .returning();

      if (!deleted) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Human task not found' });
      }
      return { deleted: true };
    }),
});
