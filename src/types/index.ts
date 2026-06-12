import { BackendNodeManifest } from '../services/nodeflow/types';

// Node types: static content nodes feed data into NodeFlow SDK backend nodes,
// which perform all processing/generation server-side.
export enum NodeType {
  TEXT_STATIC = 'text_static',
  IMAGE_STATIC = 'image_static',
  AUDIO_STATIC = 'audio_static',
  VIDEO_STATIC = 'video_static',
  BACKEND = 'backend'
}

export enum NodeCategory {
  TEXT = 'text',
  IMAGE = 'image',
  AUDIO = 'audio',
  VIDEO = 'video',
  MASK = 'mask'
}

export enum NodeMode {
  STATIC = 'static',
  GENERATED = 'generated'
}

export enum ConnectionType {
  TEXT = 'text',
  IMAGE = 'image',
  MASK = 'mask',
  VIDEO = 'video',
  AUDIO = 'audio',
  JSON = 'json'
}

export interface NodeData {
  id: string;
  type: NodeType;
  label: string;
  category: NodeCategory;
  mode: NodeMode;
  position: {
    x: number;
    y: number;
    width?: number;
    height?: number;
  };
  content?: string; // Text content, or media as data URL
  inputs: {
    id: string;
    type: ConnectionType;
    maxConnections?: number;
    connected?: boolean;
    label?: string;
    ioId?: string; // SDK IOId for backend nodes
  }[];
  output: {
    id: string;
    type: ConnectionType;
  };
  generationStatus?: 'idle' | 'generating' | 'success' | 'error';
  generationError?: string;

  // NodeFlow SDK backend nodes
  backend?: {
    backendId: string; // RegisteredBackend.id
    backendUrl: string;
    nodeId: string; // SDK NodeId
    manifest: BackendNodeManifest;
    parameters: Record<string, unknown>;
  };
  // Multi-output nodes (backend nodes); single-output nodes keep `output`.
  outputs?: {
    id: string;
    type: ConnectionType;
    label?: string;
    ioId?: string;
  }[];
  // Per-output-handle results from the last backend run (text or data URL).
  results?: Record<string, { content: string; mimeType: string }>;
  // Cost in credits of the last backend run, when reported.
  lastRunCost?: number | null;
}

export interface Connection {
  id: string;
  source: string; // Node ID
  sourceHandle: string; // Output ID
  target: string; // Node ID
  targetHandle: string; // Input ID
  type: ConnectionType;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  created: number;
  updated: number;
  nodes: NodeData[];
  connections: Connection[];
}

// Settings
export interface UserSettings {
  theme: 'dark' | 'light';
}
