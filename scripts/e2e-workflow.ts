// End-to-end check of whole-workflow execution against a live SDK backend.
// Builds: [static text] -> [echo backend node] -> [echo backend node]
// and verifies the text flows through both backend runs in topological order.
//
// Usage: npx tsx scripts/e2e-workflow.ts [backend-url]

import { NodeFlowClient } from '../src/services/nodeflow/client';
import { runWorkflow } from '../src/services/nodeflow/workflow';
import { createBackendNode, createNode } from '../src/utils/projectUtils';
import { NodeData, NodeType } from '../src/types';

const baseUrl = process.argv[2] ?? 'http://127.0.0.1:8765';

async function main() {
  const client = new NodeFlowClient(baseUrl);
  console.log(`1. Handshake with ${baseUrl}...`);
  await client.handshake();
  const manifests = await client.listNodes();
  const echo = manifests.find((m) => m.inputs.length > 0 && m.outputs.length > 0);
  if (!echo) throw new Error('No suitable node found');
  console.log(`   OK - using node "${echo.id}"`);

  console.log('2. Building canvas: static text -> echo -> echo...');
  const textNode: NodeData = {
    ...createNode(NodeType.TEXT_STATIC, { x: 0, y: 0 }),
    content: 'Salut le workflow!',
  };
  const echo1 = createBackendNode('b1', baseUrl, echo, { x: 0, y: 100 });
  const echo2 = createBackendNode('b1', baseUrl, echo, { x: 0, y: 200 });

  const edges = [
    {
      source: textNode.id,
      sourceHandle: textNode.output.id,
      target: echo1.id,
      targetHandle: echo1.inputs[0].id,
    },
    {
      source: echo1.id,
      sourceHandle: echo1.outputs![0].id,
      target: echo2.id,
      targetHandle: echo2.inputs[0].id,
    },
  ];

  console.log('3. Running workflow...');
  const updates = new Map<string, Record<string, unknown>>();
  const result = await runWorkflow([textNode, echo1, echo2], edges, {
    getClient: () => client,
    updateNodeData: (nodeId, nodeUpdates) => {
      updates.set(nodeId, { ...(updates.get(nodeId) ?? {}), ...nodeUpdates });
    },
    onProgress: (nodeId, message) => console.log(`   [${nodeId.slice(0, 6)}] ${message}`),
  });

  if (result.error) {
    throw new Error(`Workflow failed on ${result.failedNodeId}: ${result.error}`);
  }
  console.log(`4. Workflow finished: ${result.executed} backend nodes executed`);

  const finalContent = updates.get(echo2.id)?.content;
  if (finalContent !== 'Salut le workflow!') {
    throw new Error(`Unexpected final content: ${JSON.stringify(finalContent)}`);
  }
  console.log(`   OK - text flowed through both nodes: ${JSON.stringify(finalContent)}`);

  await client.destroySession();
  console.log('\nWORKFLOW E2E PASSED');
}

main().catch((error) => {
  console.error('\nWORKFLOW E2E FAILED:', error);
  process.exit(1);
});
