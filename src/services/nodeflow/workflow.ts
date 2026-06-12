// Whole-workflow execution: runs every backend node of the canvas in
// topological order, feeding each node the freshest upstream results.

import { NodeData } from '../../types';
import { NodeFlowClient } from './client';
import { IncomingConnection, runBackendNode } from './executor';

export interface WorkflowEdge {
  source: string;
  sourceHandle: string;
  target: string;
  targetHandle: string;
}

export interface WorkflowCallbacks {
  getClient: (node: NodeData) => NodeFlowClient | undefined;
  // Push updates into the canvas as the run progresses.
  updateNodeData: (nodeId: string, updates: Record<string, unknown>) => void;
  onProgress?: (nodeId: string, message: string) => void;
}

export interface WorkflowResult {
  executed: number;
  skipped: number;
  failedNodeId?: string;
  error?: string;
}

// Kahn topological sort over all node ids; cycles throw.
export function topologicalOrder(nodeIds: string[], edges: WorkflowEdge[]): string[] {
  const indegree = new Map<string, number>(nodeIds.map((id) => [id, 0]));
  const adjacency = new Map<string, string[]>(nodeIds.map((id) => [id, []]));

  edges.forEach((edge) => {
    if (!indegree.has(edge.source) || !indegree.has(edge.target)) return;
    adjacency.get(edge.source)!.push(edge.target);
    indegree.set(edge.target, (indegree.get(edge.target) ?? 0) + 1);
  });

  const queue = nodeIds.filter((id) => (indegree.get(id) ?? 0) === 0);
  const order: string[] = [];
  while (queue.length > 0) {
    const id = queue.shift()!;
    order.push(id);
    adjacency.get(id)!.forEach((next) => {
      const remaining = (indegree.get(next) ?? 0) - 1;
      indegree.set(next, remaining);
      if (remaining === 0) queue.push(next);
    });
  }

  if (order.length !== nodeIds.length) {
    throw new Error('The workflow contains a cycle; remove circular connections to run it.');
  }
  return order;
}

export async function runWorkflow(
  nodes: NodeData[],
  edges: WorkflowEdge[],
  callbacks: WorkflowCallbacks,
): Promise<WorkflowResult> {
  // Track the freshest node data locally: canvas state updates are async,
  // downstream nodes must see the results produced earlier in this run.
  const dataById = new Map<string, NodeData>(nodes.map((node) => [node.id, { ...node }]));
  const order = topologicalOrder(
    nodes.map((node) => node.id),
    edges,
  );

  let executed = 0;
  let skipped = 0;

  for (const nodeId of order) {
    const node = dataById.get(nodeId)!;
    if (!node.backend) {
      // Static nodes carry their content already.
      continue;
    }

    const client = callbacks.getClient(node);
    if (!client) {
      skipped += 1;
      callbacks.updateNodeData(nodeId, {
        generationStatus: 'error',
        generationError: 'Backend offline: connect it in Settings > Backends',
      });
      continue;
    }

    const incoming: IncomingConnection[] = edges
      .filter((edge) => edge.target === nodeId)
      .flatMap((edge) => {
        const source = dataById.get(edge.source);
        if (!source) return [];
        return [{
          targetHandle: edge.targetHandle,
          sourceHandle: edge.sourceHandle,
          source,
        }];
      });

    callbacks.updateNodeData(nodeId, { generationStatus: 'generating', generationError: undefined });
    try {
      const { results, primaryContent } = await runBackendNode(
        client,
        node,
        incoming,
        (message) => callbacks.onProgress?.(nodeId, message),
      );
      const updates = { results, content: primaryContent, generationStatus: 'success' as const };
      dataById.set(nodeId, { ...node, ...updates });
      callbacks.updateNodeData(nodeId, updates);
      executed += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Run failed';
      callbacks.updateNodeData(nodeId, { generationStatus: 'error', generationError: message });
      return { executed, skipped, failedNodeId: nodeId, error: message };
    }
  }

  return { executed, skipped };
}
