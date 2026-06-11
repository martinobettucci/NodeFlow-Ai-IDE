import { BackendNodeManifest } from '../services/nodeflow/types';

// Node types
export enum NodeType {
  TEXT_STATIC = 'text_static',
  TEXT_GENERATED = 'text_generated',
  IMAGE_STATIC = 'image_static',
  IMAGE_GENERATED = 'image_generated',
  VIDEO_STATIC = 'video_static',
  VIDEO_GENERATED = 'video_generated',
  BACKEND = 'backend'
}

export enum NodeCategory {
  TEXT = 'text',
  IMAGE = 'image',
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
  content?: string; // Text content, image URL or base64, video URL or base64
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
  settings?: {
    // Image generation settings
    model?: 'dall-e-2' | 'dall-e-3' | 'gpt-image-1';
    size?: '256x256' | '512x512' | '1024x1024' | '1792x1024' | '1024x1792' | '1536x1024' | '1024x1536';
    quality?: 'standard' | 'hd' | 'low' | 'medium' | 'high';
    style?: 'vivid' | 'natural';
    background?: 'auto' | 'transparent' | 'opaque';
    output_format?: 'png' | 'jpeg' | 'webp';
    output_compression?: number;
    moderation?: 'auto' | 'low';
    
    // Video generation settings
    negative_prompt?: string;
    aspect_ratio?: '16:9' | '9:16';
    resolution?: '720p' | '480p';
    cfg_scale?: number;
    guidance_scale?: number;
    num_frames?: number;
    enable_safety_checker?: boolean;
    seed?: number;
    end_image_url?: string;
    end_image_uploaded_url?: string;
    strength?: number;
  };
  generationStatus?: 'idle' | 'generating' | 'success' | 'error';
  generationError?: string;
  generationSeed?: number;
  uploaded_url?: string;
  last_uploaded_content?: string;

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

// OpenAI API types
export interface OpenAIImageResponse {
  created: number;
  data: {
    url?: string;
    b64_json?: string;
  }[];
  usage?: {
    input_tokens_details?: {
      text_tokens?: number;
      image_tokens?: number;
    };
    output_tokens?: number;
  };
}

// FAL.AI API types
export interface FalVideoResponse {
  data: {
    video?: {
      url: string;
    };
    video_url?: string;
    b64_json?: string;
    seed?: number;
  };
  requestId: string;
}

// Settings
export interface APIKeys {
  openai: string;
  falai: string;
}

export interface UserSettings {
  apiKeys: APIKeys;
  theme: 'dark' | 'light';
  quality: 'low' | 'medium' | 'high';
}