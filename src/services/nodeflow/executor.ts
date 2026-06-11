// Executes a backend node on its NodeFlow SDK backend:
// uploads the contents of connected inputs, submits a run, polls until
// completion and downloads the outputs.

import { NodeData } from '../../types';
import { NodeFlowClient } from './client';
import { BackendRunStatus } from './types';

export interface IncomingConnection {
  targetHandle: string;
  sourceHandle: string;
  source: NodeData;
}

export interface BackendRunResults {
  // Keyed by output handle id (`${nodeId}-out-${ioId}`)
  results: Record<string, { content: string; mimeType: string }>;
  primaryContent?: string;
}

function dataUrlToBlob(dataUrl: string): { blob: Blob; mimeType: string } {
  const [header, base64] = dataUrl.split(',');
  const mimeType = header.match(/data:([^;]+)/)?.[1] ?? 'application/octet-stream';
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return { blob: new Blob([bytes], { type: mimeType }), mimeType };
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

function contentToUpload(content: string): { blob: Blob; mimeType: string } {
  if (content.startsWith('data:')) {
    return dataUrlToBlob(content);
  }
  return { blob: new Blob([content], { type: 'text/plain' }), mimeType: 'text/plain' };
}

function isTextual(mimeType: string): boolean {
  return (
    mimeType.startsWith('text/') ||
    mimeType === 'application/json' ||
    mimeType === 'application/xml'
  );
}

// Resolve the content produced by the source side of a connection.
function sourceContent(connection: IncomingConnection): string | undefined {
  const { source, sourceHandle } = connection;
  const handleResult = source.results?.[sourceHandle];
  if (handleResult) {
    return handleResult.content;
  }
  return source.content;
}

export async function runBackendNode(
  client: NodeFlowClient,
  node: NodeData,
  incoming: IncomingConnection[],
  onProgress?: (message: string) => void,
): Promise<BackendRunResults> {
  const backend = node.backend;
  if (!backend) {
    throw new Error('Node is not bound to a backend');
  }
  const instanceId = node.id;

  // 1. Upload the content of every connected input.
  const inputMapping: Record<string, string[]> = {};
  for (const spec of backend.manifest.inputs) {
    const handleId = `${node.id}-in-${spec.id}`;
    const connections = incoming.filter((c) => c.targetHandle === handleId);
    if (connections.length === 0) {
      continue;
    }

    onProgress?.(`Uploading input "${spec.label}"...`);
    const inputIds: string[] = [];
    for (const connection of connections) {
      const content = sourceContent(connection);
      if (content === undefined || content === '') {
        throw new Error(`Input "${spec.label}" is connected to a node with no content`);
      }
      const { blob, mimeType } = contentToUpload(content);
      const inputId = await client.uploadInput(
        backend.nodeId,
        instanceId,
        blob,
        mimeType,
        backend.nodeId,
      );
      inputIds.push(inputId);
    }
    inputMapping[spec.id] = inputIds;
  }

  // 2. Submit the run and wait for it to finish.
  onProgress?.('Submitting run...');
  const runId = await client.submitRun(
    backend.nodeId,
    instanceId,
    inputMapping,
    backend.parameters,
  );

  onProgress?.('Running...');
  const finalStatus = await client.waitForRun(backend.nodeId, instanceId, runId);

  if (finalStatus.status === BackendRunStatus.ERROR) {
    const message =
      finalStatus.errors?.map((e) => `${e.type}: ${e.message}`).join('; ') ??
      'Run failed with an unknown error';
    throw new Error(message);
  }

  // 3. Download outputs and convert them to displayable content.
  const results: Record<string, { content: string; mimeType: string }> = {};
  let primaryContent: string | undefined;

  for (const spec of backend.manifest.outputs) {
    const outputIds = finalStatus.outputs?.[spec.id];
    if (!outputIds || outputIds.length === 0) {
      continue;
    }
    onProgress?.(`Downloading output "${spec.label}"...`);
    const blob = await client.downloadOutput(backend.nodeId, instanceId, outputIds[0]);
    const mimeType = blob.type || 'application/octet-stream';
    const content = isTextual(mimeType) ? await blob.text() : await blobToDataUrl(blob);

    const handleId = `${node.id}-out-${spec.id}`;
    results[handleId] = { content, mimeType };
    if (primaryContent === undefined) {
      primaryContent = content;
    }
  }

  return { results, primaryContent };
}
