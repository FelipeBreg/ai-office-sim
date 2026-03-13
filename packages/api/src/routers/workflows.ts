import { z } from 'zod';
import { randomUUID } from 'crypto';
import { createTRPCRouter, projectProcedure, adminProcedure, enforceResourceLimit } from '../trpc.js';
import { db, workflows, workflowRuns, workflowNodeRuns, eq, and, desc, sql, gte, count } from '@ai-office/db';
import { getWorkflowExecutionQueue } from '@ai-office/queue';
import { TRPCError } from '@trpc/server';
import type { WorkflowDefinition, WorkflowVariable, TriggerNodeConfig } from '@ai-office/shared';

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

      // Auto-generate webhook token if trigger node is webhook type
      let webhookToken: string | undefined;
      const definition = input.definition as WorkflowDefinition | null | undefined;
      if (definition?.nodes) {
        const triggerNode = definition.nodes.find(
          (n: { data?: { nodeType?: string } }) => n.data?.nodeType === 'trigger',
        );
        const triggerConfig = triggerNode?.data as TriggerNodeConfig | undefined;
        if (triggerConfig?.triggerType === 'webhook') {
          webhookToken = randomUUID();
        }
      }

      const [workflow] = await db
        .insert(workflows)
        .values({
          projectId: ctx.project!.id,
          createdBy: ctx.user!.id,
          ...(webhookToken ? { webhookToken } : {}),
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

      // Auto-generate webhook token if trigger node becomes webhook type and no token exists
      const definition = data.definition as WorkflowDefinition | null | undefined;
      if (definition?.nodes) {
        const triggerNode = definition.nodes.find(
          (n: { data?: { nodeType?: string } }) => n.data?.nodeType === 'trigger',
        );
        const triggerConfig = triggerNode?.data as TriggerNodeConfig | undefined;
        if (triggerConfig?.triggerType === 'webhook') {
          // Check if token already exists
          const [existing] = await db
            .select({ webhookToken: workflows.webhookToken })
            .from(workflows)
            .where(eq(workflows.id, id))
            .limit(1);
          if (!existing?.webhookToken) {
            (data as Record<string, unknown>).webhookToken = randomUUID();
          }
        }
      }

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

  regenerateWebhookToken: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const newToken = randomUUID();
      const [updated] = await db
        .update(workflows)
        .set({ webhookToken: newToken })
        .where(and(eq(workflows.id, input.id), eq(workflows.projectId, ctx.project!.id)))
        .returning({ id: workflows.id, webhookToken: workflows.webhookToken });

      if (!updated) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Workflow not found' });
      }
      return updated;
    }),

  /** List all workflow runs across all workflows in the project */
  listAllRuns: projectProcedure
    .input(z.object({
      limit: z.number().int().min(1).max(100).default(50),
      status: z.enum(['running', 'completed', 'failed', 'cancelled', 'waiting_approval']).optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 50;
      const conditions = [eq(workflowRuns.projectId, ctx.project!.id)];

      if (input?.status) {
        conditions.push(eq(workflowRuns.status, input.status));
      }

      const runs = await db
        .select({
          id: workflowRuns.id,
          workflowId: workflowRuns.workflowId,
          status: workflowRuns.status,
          startedAt: workflowRuns.startedAt,
          completedAt: workflowRuns.completedAt,
          error: workflowRuns.error,
          pausedAtNodeId: workflowRuns.pausedAtNodeId,
        })
        .from(workflowRuns)
        .where(and(...conditions))
        .orderBy(desc(workflowRuns.startedAt))
        .limit(limit);

      // Attach workflow names
      const workflowIds = [...new Set(runs.map((r) => r.workflowId))];
      const workflowList = workflowIds.length > 0
        ? await db
            .select({ id: workflows.id, name: workflows.name })
            .from(workflows)
            .where(sql`${workflows.id} = ANY(ARRAY[${sql.join(workflowIds.map((id) => sql`${id}::uuid`), sql`, `)}])`)
        : [];

      const nameMap = new Map(workflowList.map((w) => [w.id, w.name]));

      return runs.map((run) => ({
        ...run,
        workflowName: nameMap.get(run.workflowId) ?? 'Unknown',
      }));
    }),

  /** Re-run a failed workflow from the point of failure */
  retryRun: adminProcedure
    .input(z.object({ runId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [run] = await db
        .select()
        .from(workflowRuns)
        .where(
          and(
            eq(workflowRuns.id, input.runId),
            eq(workflowRuns.projectId, ctx.project!.id),
            eq(workflowRuns.status, 'failed'),
          ),
        )
        .limit(1);

      if (!run) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'No failed workflow run found',
        });
      }

      // Find the last failed node to retry from
      const failedNodes = await db
        .select()
        .from(workflowNodeRuns)
        .where(
          and(
            eq(workflowNodeRuns.workflowRunId, run.id),
            eq(workflowNodeRuns.status, 'failed'),
          ),
        )
        .orderBy(workflowNodeRuns.startedAt)
        .limit(1);

      const retryFromNodeId = failedNodes[0]?.nodeId ?? undefined;
      const completedOutputs = (run.completedOutputs as Record<string, unknown>) ?? {};
      const variables = (run.variables as Record<string, string>) ?? {};

      // Reset run status
      await db
        .update(workflowRuns)
        .set({ status: 'running', error: null, completedAt: null })
        .where(eq(workflowRuns.id, run.id));

      // Re-enqueue
      await getWorkflowExecutionQueue().add(
        `workflow-retry-${run.id}`,
        {
          workflowId: run.workflowId,
          workflowRunId: run.id,
          projectId: ctx.project!.id,
          variables,
          resumeFromNodeId: retryFromNodeId,
          completedOutputs,
        },
      );

      return { status: 'retrying' as const, runId: run.id, retryFromNodeId };
    }),

  /** Aggregate stats for workflow runs dashboard */
  getRunStats: projectProcedure.query(async ({ ctx }) => {
    const since = new Date();
    since.setDate(since.getDate() - 7);

    const [stats] = await db
      .select({
        total: count(),
        running: sql<number>`count(*) filter (where ${workflowRuns.status} = 'running')`,
        completed: sql<number>`count(*) filter (where ${workflowRuns.status} = 'completed')`,
        failed: sql<number>`count(*) filter (where ${workflowRuns.status} = 'failed')`,
        waitingApproval: sql<number>`count(*) filter (where ${workflowRuns.status} = 'waiting_approval')`,
      })
      .from(workflowRuns)
      .where(
        and(
          eq(workflowRuns.projectId, ctx.project!.id),
          gte(workflowRuns.startedAt, since),
        ),
      );

    return {
      total: Number(stats?.total ?? 0),
      running: Number(stats?.running ?? 0),
      completed: Number(stats?.completed ?? 0),
      failed: Number(stats?.failed ?? 0),
      waitingApproval: Number(stats?.waitingApproval ?? 0),
    };
  }),

  /** Get run counts grouped by workflow ID */
  getRunCountsByWorkflow: projectProcedure.query(async ({ ctx }) => {
    const rows = await db
      .select({
        workflowId: workflowRuns.workflowId,
        runCount: count(),
      })
      .from(workflowRuns)
      .where(eq(workflowRuns.projectId, ctx.project!.id))
      .groupBy(workflowRuns.workflowId);

    const map: Record<string, number> = {};
    for (const row of rows) {
      map[row.workflowId] = Number(row.runCount);
    }
    return map;
  }),
});
