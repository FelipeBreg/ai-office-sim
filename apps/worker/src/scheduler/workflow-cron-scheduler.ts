/**
 * Workflow Cron Scheduler — registers BullMQ repeatable jobs for scheduled workflows.
 *
 * On worker startup:
 *   1. Query all workflows where the trigger node has triggerType='scheduled' AND isActive=true
 *   2. Parse the trigger node's cronExpression
 *   3. Register BullMQ repeatable jobs on the workflow-execution queue
 *
 * syncWorkflowSchedule(workflowId) is called by tRPC mutations when a workflow
 * is created, updated, or deleted to keep repeatable jobs in sync.
 */
import { db, workflows, workflowRuns, eq } from '@ai-office/db';
import { getWorkflowExecutionQueue } from '@ai-office/queue';
import type { WorkflowDefinition, TriggerNodeConfig, WorkflowVariable } from '@ai-office/shared';

const REPEATABLE_KEY_PREFIX = 'cron:workflow:';

function repeatableKey(workflowId: string): string {
  return `${REPEATABLE_KEY_PREFIX}${workflowId}`;
}

/** Extract the trigger node config from a workflow definition */
function getTriggerConfig(definition: WorkflowDefinition | null): TriggerNodeConfig | null {
  if (!definition?.nodes) return null;
  const triggerNode = definition.nodes.find((n) => n.data?.nodeType === 'trigger');
  return (triggerNode?.data as TriggerNodeConfig) ?? null;
}

/**
 * Bootstrap: scan DB for all scheduled workflows and register repeatable jobs.
 * Call once on worker startup.
 */
export async function registerAllScheduledWorkflows(): Promise<void> {
  const queue = getWorkflowExecutionQueue();

  // Remove all existing workflow cron repeatables to avoid stale entries
  const existing = await queue.getRepeatableJobs();
  for (const job of existing) {
    if (job.key.includes(REPEATABLE_KEY_PREFIX) || job.name.startsWith(REPEATABLE_KEY_PREFIX)) {
      await queue.removeRepeatableByKey(job.key);
    }
  }

  // Query all active workflows
  const allWorkflows = await db
    .select({
      id: workflows.id,
      projectId: workflows.projectId,
      definition: workflows.definition,
    })
    .from(workflows)
    .where(eq(workflows.isActive, true));

  let registered = 0;
  for (const wf of allWorkflows) {
    const trigger = getTriggerConfig(wf.definition as WorkflowDefinition | null);
    if (!trigger || trigger.triggerType !== 'scheduled' || !trigger.cronExpression) continue;

    // Build default variables
    const definition = wf.definition as WorkflowDefinition;
    const variables: Record<string, string> = {};
    for (const v of (definition.variables ?? []) as WorkflowVariable[]) {
      variables[v.key] = v.defaultValue ?? '';
    }

    // Create a workflow run for each scheduled execution
    await queue.add(
      repeatableKey(wf.id),
      {
        workflowId: wf.id,
        workflowRunId: '', // placeholder — created at execution time
        projectId: wf.projectId,
        variables,
        _scheduledTrigger: true,
      },
      {
        repeat: { pattern: trigger.cronExpression },
        jobId: repeatableKey(wf.id),
      },
    );
    registered++;
  }

  console.log(`[workflow-cron] Registered ${registered} scheduled workflow(s)`);
}

/**
 * Sync a single workflow's repeatable job.
 * Call when a workflow is created, updated, or deleted.
 */
export async function syncWorkflowSchedule(workflowId: string): Promise<void> {
  const queue = getWorkflowExecutionQueue();
  const key = repeatableKey(workflowId);

  // Remove existing repeatable for this workflow
  const existing = await queue.getRepeatableJobs();
  for (const job of existing) {
    if (job.name === key || job.key.includes(workflowId)) {
      await queue.removeRepeatableByKey(job.key);
    }
  }

  // Check current workflow state
  const [wf] = await db
    .select({
      id: workflows.id,
      projectId: workflows.projectId,
      definition: workflows.definition,
      isActive: workflows.isActive,
    })
    .from(workflows)
    .where(eq(workflows.id, workflowId))
    .limit(1);

  if (!wf || !wf.isActive) return;

  const trigger = getTriggerConfig(wf.definition as WorkflowDefinition | null);
  if (!trigger || trigger.triggerType !== 'scheduled' || !trigger.cronExpression) return;

  const definition = wf.definition as WorkflowDefinition;
  const variables: Record<string, string> = {};
  for (const v of (definition.variables ?? []) as WorkflowVariable[]) {
    variables[v.key] = v.defaultValue ?? '';
  }

  await queue.add(
    key,
    {
      workflowId: wf.id,
      workflowRunId: '',
      projectId: wf.projectId,
      variables,
      _scheduledTrigger: true,
    },
    {
      repeat: { pattern: trigger.cronExpression },
      jobId: key,
    },
  );

  console.log(`[workflow-cron] Synced schedule for workflow ${workflowId}: ${trigger.cronExpression}`);
}

/**
 * Remove a single workflow's repeatable job.
 */
export async function removeWorkflowSchedule(workflowId: string): Promise<void> {
  const queue = getWorkflowExecutionQueue();
  const existing = await queue.getRepeatableJobs();
  for (const job of existing) {
    if (job.name === repeatableKey(workflowId) || job.key.includes(workflowId)) {
      await queue.removeRepeatableByKey(job.key);
    }
  }
}
