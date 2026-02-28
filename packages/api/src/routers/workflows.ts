import { z } from 'zod';
import { createTRPCRouter, projectProcedure, adminProcedure, enforceResourceLimit } from '../trpc.js';
import { db, workflows, workflowRuns, workflowNodeRuns, eq, and, desc } from '@ai-office/db';
import { getWorkflowExecutionQueue } from '@ai-office/queue';
import { TRPCError } from '@trpc/server';
import type { WorkflowDefinition, WorkflowVariable } from '@ai-office/shared';

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
      await enforceResourceLimit(ctx.org!.id, ctx.org!.plan, 'maxWorkflows');

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
    .input(
      z.object({
        id: z.string().uuid(),
        variables: z.record(z.string()).optional(),
      }),
    )
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

      // Validate required variables
      const definition = workflow.definition as WorkflowDefinition | null;
      const definedVars: WorkflowVariable[] = definition?.variables ?? [];
      const providedVars = input.variables ?? {};

      for (const v of definedVars) {
        if (v.required && !providedVars[v.key] && !v.defaultValue) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Required variable "${v.key}" is missing`,
          });
        }
      }

      // Merge defaults with provided values
      const variables: Record<string, string> = {};
      for (const v of definedVars) {
        variables[v.key] = providedVars[v.key] ?? v.defaultValue ?? '';
      }

      const [run] = await db
        .insert(workflowRuns)
        .values({
          workflowId: workflow.id,
          projectId: ctx.project!.id,
          variables,
        })
        .returning();

      // Enqueue workflow execution via BullMQ
      await getWorkflowExecutionQueue().add(
        `workflow-${workflow.id}-${run!.id}`,
        {
          workflowId: workflow.id,
          workflowRunId: run!.id,
          projectId: ctx.project!.id,
          variables,
        },
      );

      return run!;
    }),

  listRuns: projectProcedure
    .input(z.object({ workflowId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return db
        .select()
        .from(workflowRuns)
        .where(
          and(
            eq(workflowRuns.workflowId, input.workflowId),
            eq(workflowRuns.projectId, ctx.project!.id),
          ),
        )
        .orderBy(desc(workflowRuns.startedAt));
    }),

  getRunDetail: projectProcedure
    .input(z.object({ runId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [run] = await db
        .select()
        .from(workflowRuns)
        .where(
          and(
            eq(workflowRuns.id, input.runId),
            eq(workflowRuns.projectId, ctx.project!.id),
          ),
        )
        .limit(1);

      if (!run) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Workflow run not found' });
      }

      const nodeRuns = await db
        .select()
        .from(workflowNodeRuns)
        .where(eq(workflowNodeRuns.workflowRunId, run.id))
        .orderBy(workflowNodeRuns.startedAt);

      return { run, nodeRuns };
    }),

  resumeRun: adminProcedure
    .input(
      z.object({
        runId: z.string().uuid(),
        approved: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [run] = await db
        .select()
        .from(workflowRuns)
        .where(
          and(
            eq(workflowRuns.id, input.runId),
            eq(workflowRuns.projectId, ctx.project!.id),
            eq(workflowRuns.status, 'waiting_approval'),
          ),
        )
        .limit(1);

      if (!run) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'No paused workflow run found',
        });
      }

      if (!input.approved) {
        // Reject: mark as cancelled
        await db
          .update(workflowRuns)
          .set({ status: 'cancelled', completedAt: new Date() })
          .where(eq(workflowRuns.id, run.id));
        return { status: 'cancelled' as const };
      }

      // Approve: re-enqueue from the paused node
      await db
        .update(workflowRuns)
        .set({ status: 'running', pausedAtNodeId: null })
        .where(eq(workflowRuns.id, run.id));

      const variables = (run.variables as Record<string, string>) ?? {};
      const completedOutputs = (run.completedOutputs as Record<string, unknown>) ?? {};

      await getWorkflowExecutionQueue().add(
        `workflow-resume-${run.id}`,
        {
          workflowId: run.workflowId,
          workflowRunId: run.id,
          projectId: ctx.project!.id,
          variables,
          resumeFromNodeId: run.pausedAtNodeId ?? undefined,
          completedOutputs,
        },
      );

      return { status: 'resumed' as const };
    }),
});
