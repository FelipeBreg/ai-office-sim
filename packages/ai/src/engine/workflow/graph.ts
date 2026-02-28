import type { WorkflowDefinitionEdge, NodeOutput } from '@ai-office/shared';

/**
 * Topological sort using Kahn's algorithm.
 * Returns ordered node IDs from sources to sinks.
 */
export function topologicalSort(
  nodeIds: string[],
  edges: WorkflowDefinitionEdge[],
): string[] {
  const inDegree = new Map<string, number>();
  const adjacency = new Map<string, string[]>();

  for (const id of nodeIds) {
    inDegree.set(id, 0);
    adjacency.set(id, []);
  }

  for (const edge of edges) {
    adjacency.get(edge.source)?.push(edge.target);
    inDegree.set(edge.target, (inDegree.get(edge.target) ?? 0) + 1);
  }

  const queue: string[] = [];
  for (const [id, deg] of inDegree) {
    if (deg === 0) queue.push(id);
  }

  const sorted: string[] = [];
  while (queue.length > 0) {
    const node = queue.shift()!;
    sorted.push(node);

    for (const neighbor of adjacency.get(node) ?? []) {
      const newDeg = (inDegree.get(neighbor) ?? 1) - 1;
      inDegree.set(neighbor, newDeg);
      if (newDeg === 0) queue.push(neighbor);
    }
  }

  if (sorted.length !== nodeIds.length) {
    throw new Error('Workflow graph contains a cycle');
  }

  return sorted;
}

/**
 * Gather outputs from all upstream (parent) nodes.
 */
export function getUpstreamOutputs(
  nodeId: string,
  edges: WorkflowDefinitionEdge[],
  outputMap: Record<string, NodeOutput>,
): Record<string, NodeOutput> {
  const upstream: Record<string, NodeOutput> = {};
  for (const edge of edges) {
    if (edge.target === nodeId && outputMap[edge.source]) {
      upstream[edge.source] = outputMap[edge.source]!;
    }
  }
  return upstream;
}

/**
 * Find downstream (child) node IDs.
 * Optional handle filter for condition yes/no branches.
 */
export function getDownstreamNodes(
  nodeId: string,
  edges: WorkflowDefinitionEdge[],
  handle?: string,
): string[] {
  return edges
    .filter(
      (e) =>
        e.source === nodeId &&
        (handle === undefined || e.sourceHandle === handle),
    )
    .map((e) => e.target);
}
