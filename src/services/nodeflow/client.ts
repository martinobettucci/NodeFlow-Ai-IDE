// HTTP client for a NodeFlow SDK backend.
//
// Protocol (see NodeFlow-SDK nodeflowsdk/api/):
//   POST   /session/handshake                                   -> { session_id }
//   DELETE /session
//   GET    /nodes                                               -> { manifests }
//   POST   /nodes/{node}/describe                               -> manifest
//   POST   /nodes/{node}/validate                               -> { valid, errors }
//   GET    /nodes/{node}/health                                 -> { status, details }
//   POST   /nodes/{node}/instances/{instance}/inputs            -> { input_id }
//   POST   /nodes/{node}/instances/{instance}/runs              -> { run_id }
//   GET    /nodes/{node}/instances/{instance}/runs/{run}        -> { status, outputs, errors }
//   GET    /nodes/{node}/instances/{instance}/outputs/{output}  -> binary
//
// All endpoints except the handshake require the `session-id` header.

import {
  generateSessionKeyPair,
  msLeftInTimestampWindow,
  randomChallenge,
  roundedUtcTimestamp,
  signMessage,
} from './crypto';
import {
  BackendHealth,
  BackendNodeManifest,
  BackendRunStatus,
  CostEstimateResult,
  RunStatusResult,
} from './types';

const HANDSHAKE_SAFETY_MARGIN_MS = 1500;
const DEFAULT_POLL_INTERVAL_MS = 1000;
const DEFAULT_RUN_TIMEOUT_MS = 10 * 60 * 1000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function errorFromResponse(response: Response): Promise<Error> {
  let detail = `${response.status} ${response.statusText}`;
  try {
    const body = await response.json();
    if (body && typeof body.detail === 'string') {
      detail = body.detail;
    }
  } catch {
    // Non-JSON error body; keep the status text.
  }
  return new Error(detail);
}

export class NodeFlowClient {
  readonly baseUrl: string;
  private readonly apiKey?: string;
  private sessionId: string | null = null;

  constructor(baseUrl: string, apiKey?: string) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
    this.apiKey = apiKey?.trim() || undefined;
  }

  get isConnected(): boolean {
    return this.sessionId !== null;
  }

  async handshake(ttl?: number): Promise<void> {
    try {
      await this.attemptHandshake(ttl);
    } catch {
      // The clocks may disagree on the 10-second window; one retry in a
      // fresh window resolves transient boundary races.
      await sleep(msLeftInTimestampWindow() + 100);
      await this.attemptHandshake(ttl);
    }
  }

  private async attemptHandshake(ttl?: number): Promise<void> {
    // Avoid signing right before the 10-second window rolls over,
    // otherwise the server computes a different timestamp.
    if (msLeftInTimestampWindow() < HANDSHAKE_SAFETY_MARGIN_MS) {
      await sleep(msLeftInTimestampWindow() + 100);
    }

    const { publicKeyPem, privateKey } = await generateSessionKeyPair();
    const challenge = randomChallenge();
    const message = challenge + roundedUtcTimestamp();
    const signature = await signMessage(privateKey, message);

    const response = await fetch(`${this.baseUrl}/session/handshake`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        challenge,
        public_key_pem: publicKeyPem,
        signature_b64: signature,
        ttl: ttl ?? null,
        // Only sent when configured: gateways authenticate with it,
        // plain SDK backends ignore unknown fields.
        ...(this.apiKey ? { api_key: this.apiKey } : {}),
      }),
    });
    if (!response.ok) {
      throw await errorFromResponse(response);
    }
    const body = await response.json();
    this.sessionId = body.session_id;
  }

  async destroySession(): Promise<void> {
    if (!this.sessionId) return;
    try {
      await fetch(`${this.baseUrl}/session`, {
        method: 'DELETE',
        headers: this.sessionHeaders(),
      });
    } finally {
      this.sessionId = null;
    }
  }

  async listNodes(): Promise<BackendNodeManifest[]> {
    const body = await this.requestJson<{ manifests: BackendNodeManifest[] }>('GET', '/nodes');
    return body.manifests;
  }

  async describeNode(
    nodeId: string,
    configuration?: Record<string, unknown>,
  ): Promise<BackendNodeManifest> {
    return (await this.requestJson('POST', `/nodes/${encodeURIComponent(nodeId)}/describe`, {
      configuration: configuration ?? null,
    })) as BackendNodeManifest;
  }

  async validateConfiguration(
    nodeId: string,
    configuration: Record<string, unknown>,
  ): Promise<{ valid: boolean; errors: string[] | null }> {
    return (await this.requestJson('POST', `/nodes/${encodeURIComponent(nodeId)}/validate`, {
      configuration,
    })) as { valid: boolean; errors: string[] | null };
  }

  async nodeHealth(nodeId: string): Promise<BackendHealth> {
    return (await this.requestJson(
      'GET',
      `/nodes/${encodeURIComponent(nodeId)}/health`,
    )) as BackendHealth;
  }

  // Preview the cost of a run for the given configuration without
  // executing it. Backends predating the endpoint report 404, which is
  // mapped to { estimable: false }.
  async estimateCost(
    nodeId: string,
    configuration: Record<string, unknown>,
  ): Promise<CostEstimateResult> {
    try {
      return (await this.requestJson(
        'POST',
        `/nodes/${encodeURIComponent(nodeId)}/cost/estimate`,
        { configuration },
      )) as CostEstimateResult;
    } catch {
      return { estimable: false };
    }
  }

  async uploadInput(
    nodeId: string,
    instanceId: string,
    data: Blob,
    mimeType: string,
    sourceNodeId?: string,
  ): Promise<string> {
    const form = new FormData();
    form.append('mime_type', mimeType);
    if (sourceNodeId) {
      form.append('source_node_id', sourceNodeId);
    }
    form.append('file', data, 'input');

    const response = await this.rawRequest(
      'POST',
      `${this.instancePath(nodeId, instanceId)}/inputs`,
      { body: form },
    );
    const body = await response.json();
    return body.input_id as string;
  }

  async submitRun(
    nodeId: string,
    instanceId: string,
    inputMapping: Record<string, string[]>,
    configuration: Record<string, unknown>,
  ): Promise<string> {
    const body = await this.requestJson<{ run_id: string }>(
      'POST',
      `${this.instancePath(nodeId, instanceId)}/runs`,
      { input_mapping: inputMapping, configuration },
    );
    return body.run_id;
  }

  async getRunStatus(nodeId: string, instanceId: string, runId: string): Promise<RunStatusResult> {
    return (await this.requestJson(
      'GET',
      `${this.instancePath(nodeId, instanceId)}/runs/${encodeURIComponent(runId)}`,
    )) as RunStatusResult;
  }

  async waitForRun(
    nodeId: string,
    instanceId: string,
    runId: string,
    options?: { timeoutMs?: number; intervalMs?: number; onPoll?: (status: RunStatusResult) => void },
  ): Promise<RunStatusResult> {
    const timeoutMs = options?.timeoutMs ?? DEFAULT_RUN_TIMEOUT_MS;
    const intervalMs = options?.intervalMs ?? DEFAULT_POLL_INTERVAL_MS;
    const deadline = Date.now() + timeoutMs;

    for (;;) {
      const status = await this.getRunStatus(nodeId, instanceId, runId);
      options?.onPoll?.(status);
      if (
        status.status === BackendRunStatus.FINISHED ||
        status.status === BackendRunStatus.ERROR
      ) {
        return status;
      }
      if (Date.now() > deadline) {
        throw new Error(`Run ${runId} timed out after ${timeoutMs / 1000}s`);
      }
      await sleep(intervalMs);
    }
  }

  // Follow a run live over the WebSocket stream, falling back to HTTP
  // polling when WebSockets are unavailable or the stream breaks early.
  async watchRun(
    nodeId: string,
    instanceId: string,
    runId: string,
    options?: { timeoutMs?: number; onUpdate?: (status: RunStatusResult) => void },
  ): Promise<RunStatusResult> {
    try {
      return await this.watchRunOverWebSocket(nodeId, instanceId, runId, options);
    } catch {
      return this.waitForRun(nodeId, instanceId, runId, {
        timeoutMs: options?.timeoutMs,
        onPoll: options?.onUpdate,
      });
    }
  }

  private watchRunOverWebSocket(
    nodeId: string,
    instanceId: string,
    runId: string,
    options?: { timeoutMs?: number; onUpdate?: (status: RunStatusResult) => void },
  ): Promise<RunStatusResult> {
    return new Promise<RunStatusResult>((resolve, reject) => {
      if (typeof WebSocket === 'undefined') {
        reject(new Error('WebSocket is not available in this environment'));
        return;
      }
      if (!this.sessionId) {
        reject(new Error('Not connected: perform the session handshake first'));
        return;
      }

      const wsUrl =
        this.baseUrl.replace(/^http/, 'ws') +
        `${this.instancePath(nodeId, instanceId)}/runs/${encodeURIComponent(runId)}/ws` +
        `?session_id=${encodeURIComponent(this.sessionId)}`;

      const socket = new WebSocket(wsUrl);
      let terminal: RunStatusResult | null = null;
      const timeout = setTimeout(() => {
        socket.close();
        reject(new Error(`Run ${runId} timed out`));
      }, options?.timeoutMs ?? DEFAULT_RUN_TIMEOUT_MS);

      socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(String(event.data)) as RunStatusResult;
          options?.onUpdate?.(payload);
          if (
            payload.status === BackendRunStatus.FINISHED ||
            payload.status === BackendRunStatus.ERROR
          ) {
            terminal = payload;
            socket.close();
          }
        } catch {
          // Malformed frame: let the close handler decide.
        }
      };
      socket.onclose = () => {
        clearTimeout(timeout);
        if (terminal) {
          resolve(terminal);
        } else {
          reject(new Error('WebSocket closed before the run completed'));
        }
      };
      socket.onerror = () => {
        // onclose always follows onerror; nothing else to do here.
      };
    });
  }

  async downloadOutput(nodeId: string, instanceId: string, outputId: string): Promise<Blob> {
    const response = await this.rawRequest(
      'GET',
      `${this.instancePath(nodeId, instanceId)}/outputs/${encodeURIComponent(outputId)}`,
    );
    return response.blob();
  }

  private instancePath(nodeId: string, instanceId: string): string {
    return `/nodes/${encodeURIComponent(nodeId)}/instances/${encodeURIComponent(instanceId)}`;
  }

  private sessionHeaders(): Record<string, string> {
    if (!this.sessionId) {
      throw new Error('Not connected: perform the session handshake first');
    }
    return { 'session-id': this.sessionId };
  }

  private async rawRequest(
    method: string,
    path: string,
    options?: { body?: BodyInit; json?: unknown },
  ): Promise<Response> {
    const doFetch = () => {
      const headers: Record<string, string> = this.sessionHeaders();
      let body = options?.body;
      if (options?.json !== undefined) {
        headers['Content-Type'] = 'application/json';
        body = JSON.stringify(options.json);
      }
      return fetch(`${this.baseUrl}${path}`, { method, headers, body });
    };

    let response = await doFetch();
    if (response.status === 401) {
      // Session expired on the backend: transparently open a new one.
      this.sessionId = null;
      await this.handshake();
      response = await doFetch();
    }
    if (!response.ok) {
      throw await errorFromResponse(response);
    }
    return response;
  }

  private async requestJson<T>(method: string, path: string, json?: unknown): Promise<T> {
    const response = await this.rawRequest(method, path, json !== undefined ? { json } : undefined);
    return response.json() as Promise<T>;
  }
}
