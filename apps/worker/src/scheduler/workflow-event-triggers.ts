/**
 * Workflow Event Triggers — fires workflows whose trigger node has triggerType='event'
 * when a matching event occurs (agent completion, workflow completion, etc.).
 *
 * Event names follow the pattern: "agent.completed", "workflow.completed", "workflow.failed",
 * "approval.resolved", etc. Users can also define custom event names.
 */
import { db, workflows, workflowRuns, eq } from '@ai-office/db';
import { getWorkflowExecutionQueue } from '@ai-office/queue';
import type { WorkflowDefinition, TriggerNodeConfig, WorkflowVariable } from '@ai-office/shared';

/**
 * Fire all event-triggered workflows in a project that match the given event name.
 * Called from agent-execution.ts and workflow-execution.ts on completion.
 */
export async function fireEventTriggers(
  projectId: string,
  eventName: string,
  eventPayload?: Record<string, string>,
): Promise<number> {
  // Find all active workflows in this project
  const allWorkflows = await db
    .select({
      id: workflows.id,
      projectId: workflows.projectId,
      definition: workflows.definition,
    })
    .from(workflows)
    .where(eq(workflows.projectId, projectId));

  let triggered = 0;

  for (const wf of allWorkflows) {
    const definition = wf.definition as WorkflowDefinition | null;
    if (!definition?.nodes) continue;

    const triggerNode = definition.nodes.find((n) => n.data?.nodeType === 'trigger');
    const triggerConfig = triggerNode?.data as TriggerNodeConfig | undefined;
    if (!triggerConfig || triggerConfig.triggerType !== 'event') continue;

    // Match event name (case-insensitive)
    if (triggerConfig.eventName?.toLowerCase() !== eventName.toLowerCase()) continue;

    // Build variables with defaults + event payload overrides
    const variables: Record<string, string> = {};
    for (const v of (definition.variables ?? []) as WorkflowVariable[]) {
      variables[v.key] = v.defaultValue ?? '';
    }
    // Merge event payload into variables
    if (eventPayload) {
      Object.assign(variables, eventPayload);
    }

    // Create a workflow run
    const [run] = await db
      .insert(workflowRuns)
      .values({
        workflowId: wf.id,
        projectId: wf.projectId,
        variables,
      })
      .returning();

    if (!run) continue;

    // Enqueue execution
    await getWorkflowExecutionQueue().add(
      `workflow-event-${wf.id}-${run.id}`,
      {
        workflowId: wf.id,
        workflowRunId: run.id,
        projectId: wf.projectId,
        variables,
      },
    );

    triggered++;
    console.log(`[event-trigger] Fired workflow ${wf.id} for event "${eventName}"`);
  }

  return triggered;
}
