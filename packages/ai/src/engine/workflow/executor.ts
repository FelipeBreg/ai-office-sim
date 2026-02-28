import type {
  WorkflowDefinition,
  WorkflowNodeConfig,
  NodeOutput,
} from '@ai-office/shared';
import { db, workflowNodeRuns } from '@ai-office/db';
import { topologicalSort, getUpstreamOutputs, getDownstreamNodes } from './graph.js';
import { nodeHandlerRegistry } from './node-handler-registry.js';
import { PausedException } from './types.js';
import type { WorkflowRunContext, WorkflowExecutionResult } from './types.js';

// Register all handlers on import
import { triggerHandler } from './handlers/trigger.handler.js';
import { agentHandler } from './handlers/agent.handler.js';
import { conditionHandler } from './handlers/condition.handler.js';
import { approvalHandler } from './handlers/approval.handler.js';
import { delayHandler } from './handlers/delay.handler.js';
import { outputHandler } from './handlers/output.handler.js';

nodeHandlerRegistry.register(triggerHandler);
nodeHandlerRegistry.register(agentHandler);
nodeHandlerRegistry.register(conditionHandler);
nodeHandlerRegistry.register(approvalHandler);
nodeHandlerRegistry.register(delayHandler);
nodeHandlerRegistry.register(outputHandler);

/** Resolve {{variable}} placeholders in config string values */
function resolveConfigVariables(
  config: WorkflowNodeConfig,
  variables: Record<string, string>,
): WorkflowNodeConfig {
  const resolved = { ...config };
  for (const [key, value] of Object.entries(resolved)) {
    if (typeof value === 'string' && value.includes('{{')) {
      (resolved as Record<string, unknown>)[key] = value.replace(
        /\{\{(\w+)\}\}/g,
        (_, k: string) => variables[k] ?? '',
      );
    }
  }
  return resolved as WorkflowNodeConfig;
}

/**
 * Execute a workflow DAG.
 *
 * 1. Topological sort the nodes
 * 2. If resuming: load existing outputs, skip completed nodes
 * 3. For each node: gather upstream outputs, execute handler, persist result
 * 4. On PausedException: save state and return 'paused'
 * 5. On completion: return 'completed' with all outputs
 */
export async function executeWorkflow(
  definition: WorkflowDefinition,
  runContext: WorkflowRunContext,
  resumeFromNodeId?: string,
  existingOutputs?: Record<string, NodeOutput>,
): Promise<WorkflowExecutionResult> {
  const outputMap: Record<string, NodeOutput> = { ...(existingOutputs ?? {}) };
  const skipSet = new Set<string>();

  // Build node lookup
  const nodeMap = new Map(definition.nodes.map((n) => [n.id, n]));

  // Topological sort
  const nodeIds = definition.nodes.map((n) => n.id);
  const sorted = topologicalSort(nodeIds, definition.edges);

  // If resuming, mark all already-completed nodes as skip
  let resumeReached = !resumeFromNodeId;
  if (resumeFromNodeId && existingOutputs) {
    for (const id of sorted) {
      if (id === resumeFromNodeId) {
        resumeReached = true;
        break;
      }
      if (existingOutputs[id]) {
        skipSet.add(id);
      }
    }
  }

  for (const nodeId of sorted) {
    // Skip already-completed nodes
    if (skipSet.has(nodeId)) continue;

    // If we haven't reached the resume point yet, skip
    if (!resumeReached) continue;

    const nodeDef = nodeMap.get(nodeId);
    if (!nodeDef) continue;

    const nodeConfig = nodeDef.data;
    const nodeType = nodeConfig.nodeType ?? nodeDef.type;

    // Gather upstream outputs
    const upstreamOutputs = getUpstreamOutputs(nodeId, definition.edges, outputMap);

    // Resolve variables in config
    const resolvedConfig = resolveConfigVariables(nodeConfig, runContext.variables);

    try {
      const output = await nodeHandlerRegistry.execute(
        nodeType,
        resolvedConfig,
        { upstreamOutputs, variables: runContext.variables },
        runContext,
      );

      // Set the nodeId on the output
      output.nodeId = nodeId;

      // Store output
      outputMap[nodeId] = output;

      // Persist node run to DB (non-blocking on failure)
      try {
        await db.insert(workflowNodeRuns).values({
          workflowRunId: runContext.workflowRunId,
          projectId: runContext.projectId,
          nodeId,
          nodeType,
          status: output.status === 'completed' ? 'completed' : 'failed',
          input: { upstreamOutputs, variables: runContext.variables } as Record<string, unknown>,
          output: output as unknown as Record<string, unknown>,
          completedAt: new Date(),
        });
      } catch (dbErr) {
        console.error(`[workflow] Failed to persist node run for ${nodeId}:`, dbErr);
      }

      // Handle condition branching
      if (nodeType === 'condition') {
        const conditionResult = output.data as boolean;

        // Mark nodes on the untaken branch as skipped
        const takenHandle = conditionResult ? 'yes' : 'no';
        const untakenHandle = conditionResult ? 'no' : 'yes';

        const skippedNodes = getDownstreamNodes(nodeId, definition.edges, untakenHandle);
        const skipQueue = [...skippedNodes];

        // Recursively skip all descendants on the untaken branch
        while (skipQueue.length > 0) {
          const skipId = skipQueue.shift()!;
          if (skipSet.has(skipId)) continue;
          skipSet.add(skipId);

          // Record skipped node
          outputMap[skipId] = {
            nodeId: skipId,
            nodeType: nodeMap.get(skipId)?.data?.nodeType ?? 'unknown',
            status: 'skipped',
            data: { reason: `Condition ${nodeId} evaluated to ${takenHandle}` },
            completedAt: new Date().toISOString(),
          };

          try {
            await db.insert(workflowNodeRuns).values({
              workflowRunId: runContext.workflowRunId,
              projectId: runContext.projectId,
              nodeId: skipId,
              nodeType: nodeMap.get(skipId)?.data?.nodeType ?? 'unknown',
              status: 'cancelled',
              output: outputMap[skipId] as unknown as Record<string, unknown>,
              completedAt: new Date(),
            });
          } catch {
            // Non-blocking
          }

          // Find children of this skipped node and skip them too
          const children = getDownstreamNodes(skipId, definition.edges);
          skipQueue.push(...children);
        }
      }
    } catch (err) {
      // Handle PausedException (approval/delay)
      if (err instanceof PausedException) {
        return {
          status: 'paused',
          outputs: outputMap,
          pausedAtNodeId: nodeId,
        };
      }

      // Regular error — mark node as failed
      const errorOutput: NodeOutput = {
        nodeId,
        nodeType,
        status: 'failed',
        data: { error: err instanceof Error ? err.message : String(err) },
        completedAt: new Date().toISOString(),
      };

      outputMap[nodeId] = errorOutput;

      try {
        await db.insert(workflowNodeRuns).values({
          workflowRunId: runContext.workflowRunId,
          projectId: runContext.projectId,
          nodeId,
          nodeType,
          status: 'failed',
          output: errorOutput as unknown as Record<string, unknown>,
          completedAt: new Date(),
        });
      } catch {
        // Non-blocking
      }

      return {
        status: 'failed',
        outputs: outputMap,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  return {
    status: 'completed',
    outputs: outputMap,
  };
}
