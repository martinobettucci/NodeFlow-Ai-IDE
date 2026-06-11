// End-to-end check of the IDE's NodeFlow client against a live SDK backend.
//
// Usage: npx tsx scripts/e2e-backend.ts [backend-url]
// Start a backend first, e.g. in the NodeFlow-SDK repo:
//   nodeflowsdk serve --port 8765 --nodes scripts/init_template/nodes.py

import { NodeFlowClient } from '../src/services/nodeflow/client';
import { BackendRunStatus } from '../src/services/nodeflow/types';

const baseUrl = process.argv[2] ?? 'http://127.0.0.1:8765';

async function main() {
  const client = new NodeFlowClient(baseUrl);

  console.log(`1. Handshake with ${baseUrl}...`);
  await client.handshake();
  console.log('   OK - session established');

  console.log('2. Listing nodes...');
  const manifests = await client.listNodes();
  console.log(`   OK - ${manifests.length} nodes: ${manifests.map((m) => m.id).join(', ')}`);

  const echo = manifests.find((m) => m.inputs.length > 0 && m.outputs.length > 0);
  if (!echo) {
    throw new Error('No node with inputs and outputs found to exercise the run flow');
  }
  console.log(`3. Using node "${echo.id}" (${echo.label})`);

  const instanceId = 'e2e-instance-1';
  const inputSpec = echo.inputs[0];
  const payload = 'Bonjour NodeFlow!';

  console.log(`4. Uploading input "${inputSpec.id}"...`);
  const inputId = await client.uploadInput(
    echo.id,
    instanceId,
    new Blob([payload], { type: 'text/plain' }),
    'text/plain',
  );
  console.log(`   OK - input_id=${inputId}`);

  console.log('5. Submitting run...');
  const configuration: Record<string, unknown> = {};
  echo.parameters.forEach((p) => {
    configuration[p.id] = p.default;
  });
  const runId = await client.submitRun(
    echo.id,
    instanceId,
    { [inputSpec.id]: [inputId] },
    configuration,
  );
  console.log(`   OK - run_id=${runId}`);

  console.log('6. Polling run status...');
  const final = await client.waitForRun(echo.id, instanceId, runId, { timeoutMs: 30_000 });
  console.log(`   OK - status=${final.status}`);
  if (final.status !== BackendRunStatus.FINISHED) {
    throw new Error(`Run did not finish: ${JSON.stringify(final.errors)}`);
  }

  console.log('7. Downloading output...');
  const outputSpec = echo.outputs[0];
  const outputIds = final.outputs?.[outputSpec.id] ?? [];
  if (outputIds.length === 0) {
    throw new Error('No output produced');
  }
  const blob = await client.downloadOutput(echo.id, instanceId, outputIds[0]);
  const text = await blob.text();
  console.log(`   OK - output (${blob.type}): ${JSON.stringify(text)}`);

  console.log('8. Destroying session...');
  await client.destroySession();
  console.log('   OK');

  console.log('\nE2E PASSED');
}

main().catch((error) => {
  console.error('\nE2E FAILED:', error);
  process.exit(1);
});
