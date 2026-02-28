import { db, workflows, workflowRuns, eq, and } from '@ai-office/db';
import { executeWorkflow } from '@ai-office/ai';
import type { WorkflowRunContext } from '@ai-office/ai';
import type { WorkflowDefinition, NodeOutput } from '@ai-office/shared';
import { getWorkflowExecutionQueue } from '@ai-office/queue';
import * as Sentry from '@sentry/node';

interface WorkflowExecutionJobData {
  workflowId: string;
  workflowRunId: string;
  projectId: string;
  variables?: Record<string, string>;
  resumeFromNodeId?: string;
  completedOutputs?: Record<string, unknown>;
}

/**
 * Process a workflow execution job:
 * 1. Load workflow + run from DB
 * 2. Call executeWorkflow()
 * 3. Update run status based on result
 * 4. If paused (delay), re-enqueue with BullMQ delay
 */
export async function processWorkflowExecution(
  data: WorkflowExecutionJobData,
): Promise<void> {
  const { workflowId, workflowRunId, projectId, variables = {}, resumeFromNodeId, completedOutputs } = data;

  // 1. Load workflow
  const [workflow] = await db
    .select()
    .from(workflows)
    .where(eq(workflows.id, workflowId))
    .limit(1);

  if (!workflow) {
    throw new Error(`Workflow not found: ${workflowId}`);
  }

  const definition = workflow.definition as WorkflowDefinition | null;
  if (!definition || !definition.nodes || definition.nodes.length === 0) {
    await db
      .update(workflowRuns)
      .set({ status: 'failed', error: 'Workflow has no nodes', completedAt: new Date() })
      .where(eq(workflowRuns.id, workflowRunId));
    return;
  }

  // Ensure variables array exists in definition
  if (!definition.variables) {
    definition.variables = [];
  }

  // 2. Build run context
  const runContext: WorkflowRunContext = {
    workflowId,
    workflowRunId,
    projectId,
    variables,
  };

  try {
    // 3. Execute
    const result = await executeWorkflow(
      definition,
      runContext,
      resumeFromNodeId,
      completedOutputs as Record<string, NodeOutput> | undefined,
    );

    console.log(
      `[workflow-execution] Run ${workflowRunId} result: status=${result.status}`,
    );

    // 4. Update run based on result
    switch (result.status) {
      case 'completed': {
        await db
          .update(workflowRuns)
          .set({
            status: 'completed',
            completedOutputs: result.outputs as unknown as Record<string, unknown>,
            completedAt: new Date(),
          })
          .where(eq(workflowRuns.id, workflowRunId));
        break;
      }

      case 'failed': {
        await db
          .update(workflowRuns)
          .set({
            status: 'failed',
            error: result.error ?? 'Unknown error',
            completedOutputs: result.outputs as unknown as Record<string, unknown>,
            completedAt: new Date(),
          })
          .where(eq(workflowRuns.id, workflowRunId));
        break;
      }

      case 'paused': {
        // Check if this is a delay (re-enqueue) or approval (wait)
        const pausedNodeId = result.pausedAtNodeId!;
        const pausedNode = definition.nodes.find((n) => n.id === pausedNodeId);
        const isDelay = pausedNode?.data?.nodeType === 'delay';

        await db
          .update(workflowRuns)
          .set({
            status: isDelay ? 'running' : 'waiting_approval',
            pausedAtNodeId: pausedNodeId,
            completedOutputs: result.outputs as unknown as Record<string, unknown>,
          })
          .where(eq(workflowRuns.id, workflowRunId));

        if (isDelay) {
          // Parse delay duration from the node config
          const delayCfg = pausedNode!.data as { duration: number; unit: string; nodeType: string };
          const unitMs: Record<string, number> = {
            minutes: 60_000,
            hours: 3_600_000,
            days: 86_400_000,
          };
          const delayMs = delayCfg.duration * (unitMs[delayCfg.unit] ?? 60_000);

          // Re-enqueue with BullMQ delay — execution resumes after the delay
          await getWorkflowExecutionQueue().add(
            `workflow-resume-${workflowRunId}`,
            {
              workflowId,
              workflowRunId,
              projectId,
              variables,
              resumeFromNodeId: pausedNodeId,
              completedOutputs: result.outputs as Record<string, unknown>,
            },
            { delay: delayMs },
          );

          console.log(
            `[workflow-execution] Run ${workflowRunId} delayed for ${delayMs}ms at node ${pausedNodeId}`,
          );
        }
        break;
      }
    }
  } catch (err) {
    console.error(`[workflow-execution] Run ${workflowRunId} failed:`, err);
    Sentry.captureException(err, {
      tags: { workflowId, workflowRunId, projectId },
    });

    await db
      .update(workflowRuns)
      .set({
        status: 'failed',
        error: err instanceof Error ? err.message : String(err),
        completedAt: new Date(),
      })
      .where(eq(workflowRuns.id, workflowRunId));

    throw err;
  }
}
