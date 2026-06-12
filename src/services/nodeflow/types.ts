// Wire types for the NodeFlow SDK backend API.
// These mirror the Pydantic models in nodeflowsdk/models.py and api/schemas.py.

export enum BackendIOType {
  TEXT = 'TEXT',
  JSON = 'JSON',
  IMAGE = 'IMAGE',
  MASK = 'MASK',
  AUDIO = 'AUDIO',
  VIDEO = 'VIDEO',
}

export enum BackendParamType {
  CHECKBOX = 'checkbox',
  COMBOBOX = 'combobox',
  TEXTBOX = 'textbox',
  NUMBER = 'number',
}

export enum BackendRunStatus {
  UNKNOWN = 'unknown',
  RUNNING = 'running',
  FINISHED = 'finished',
  ERROR = 'error',
}

export interface BackendIOSpec {
  id: string;
  label: string;
  type: BackendIOType;
  multi: boolean;
}

export interface BackendNodeParameter {
  id: string;
  label: string;
  type: BackendParamType;
  default: unknown;
  options: string[] | null;
}

export interface BackendNodeManifest {
  id: string;
  label: string;
  category: string;
  description: string;
  inputs: BackendIOSpec[];
  outputs: BackendIOSpec[];
  parameters: BackendNodeParameter[];
}

export interface RunStatusResult {
  status: BackendRunStatus;
  outputs: Record<string, string[]> | null;
  errors: { type: string; message: string }[] | null;
  // Execution progress reported by the node (0.0 - 1.0), when available
  progress?: number | null;
  progress_message?: string | null;
  // Cost of the run in credits, reported by the node (or injected by an
  // API gateway), when available
  cost?: number | null;
  cost_detail?: Record<string, unknown> | null;
}

// Result of POST /nodes/{id}/cost/estimate; older backends without the
// endpoint are mapped to { estimable: false }.
export interface CostEstimateResult {
  estimable: boolean;
  cost?: number | null;
  currency?: string;
  confidence?: string | null;
  detail?: Record<string, unknown> | null;
}

export interface BackendHealth {
  status: string;
  details?: Record<string, unknown>;
}

// A backend registered in the IDE
export type BackendConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface RegisteredBackend {
  id: string;
  url: string;
  name: string;
  // Optional API key sent with the session handshake (used by API
  // gateways; plain SDK backends ignore it). Stored locally with the
  // backend entry.
  apiKey?: string;
  status: BackendConnectionStatus;
  manifests: BackendNodeManifest[];
  error?: string;
}
