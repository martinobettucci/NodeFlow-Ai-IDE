import { NodeType, NodeCategory, NodeMode, ConnectionType, Project, NodeData } from '../types';
import { nanoid } from 'nanoid';
import { saveProject } from '../services/dbService';
import { BackendIOType, BackendNodeManifest } from '../services/nodeflow/types';

// Create a static content node of the specified type
export function createNode(
  type: NodeType,
  position: { x: number; y: number },
): NodeData {
  const id = nanoid();
  const nodeCategory = type.split('_')[0] as NodeCategory;
  const outputType = nodeCategory.toLowerCase() as ConnectionType;

  return {
    id,
    type,
    label: getLabelForNodeType(type),
    category: nodeCategory,
    mode: NodeMode.STATIC,
    position,
    inputs: [],
    output: {
      id: `${id}-out`,
      type: outputType,
    },
    generationStatus: 'idle',
  };
}

// Map SDK IO types to IDE connection types
export function connectionTypeForIOType(ioType: BackendIOType): ConnectionType {
  switch (ioType) {
    case BackendIOType.TEXT:
      return ConnectionType.TEXT;
    case BackendIOType.JSON:
      return ConnectionType.JSON;
    case BackendIOType.IMAGE:
      return ConnectionType.IMAGE;
    case BackendIOType.MASK:
      return ConnectionType.MASK;
    case BackendIOType.AUDIO:
      return ConnectionType.AUDIO;
    case BackendIOType.VIDEO:
      return ConnectionType.VIDEO;
    default:
      return ConnectionType.TEXT;
  }
}

// Create a node backed by a NodeFlow SDK backend, from its manifest
export function createBackendNode(
  backendId: string,
  backendUrl: string,
  manifest: BackendNodeManifest,
  position: { x: number; y: number },
): NodeData {
  const id = nanoid();

  const inputs = manifest.inputs.map((spec) => ({
    id: `${id}-in-${spec.id}`,
    type: connectionTypeForIOType(spec.type),
    maxConnections: spec.multi ? Infinity : 1,
    label: spec.label,
    ioId: spec.id,
  }));

  const outputs = manifest.outputs.map((spec) => ({
    id: `${id}-out-${spec.id}`,
    type: connectionTypeForIOType(spec.type),
    label: spec.label,
    ioId: spec.id,
  }));

  const parameters: Record<string, unknown> = {};
  manifest.parameters.forEach((param) => {
    parameters[param.id] = param.default;
  });

  const primaryOutputType = outputs[0]?.type ?? ConnectionType.TEXT;
  const category = (
    [
      ConnectionType.TEXT,
      ConnectionType.IMAGE,
      ConnectionType.AUDIO,
      ConnectionType.VIDEO,
      ConnectionType.MASK,
    ].includes(primaryOutputType)
      ? (primaryOutputType as string)
      : NodeCategory.TEXT
  ) as NodeCategory;

  return {
    id,
    type: NodeType.BACKEND,
    label: manifest.label,
    category,
    mode: NodeMode.GENERATED,
    position,
    inputs,
    output: outputs[0] ?? { id: `${id}-out`, type: ConnectionType.TEXT },
    outputs,
    backend: {
      backendId,
      backendUrl,
      nodeId: manifest.id,
      manifest,
      parameters,
    },
    generationStatus: 'idle',
  };
}

// Get a human-readable label for a node type
function getLabelForNodeType(type: NodeType): string {
  switch (type) {
    case NodeType.TEXT_STATIC:
      return 'Text';
    case NodeType.IMAGE_STATIC:
      return 'Image';
    case NodeType.AUDIO_STATIC:
      return 'Audio';
    case NodeType.VIDEO_STATIC:
      return 'Video';
    default:
      return 'Unknown';
  }
}

// Create a default project
export async function createDefaultProject(): Promise<string> {
  const defaultProject: Project = {
    id: nanoid(),
    name: 'New Project',
    created: Date.now(),
    updated: Date.now(),
    nodes: [],
    connections: [],
  };

  return saveProject(defaultProject);
}

// Clone a project
export async function cloneProject(project: Project): Promise<string> {
  const clonedProject: Project = {
    ...project,
    id: nanoid(),
    name: `${project.name} (Copy)`,
    created: Date.now(),
    updated: Date.now(),
  };

  return saveProject(clonedProject);
}

// Generate a unique node ID
export function generateNodeId(): string {
  return `node-${nanoid(6)}`;
}

// Generate a unique connection ID
export function generateConnectionId(): string {
  return `conn-${nanoid(6)}`;
}
