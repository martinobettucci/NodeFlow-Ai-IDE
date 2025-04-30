import { NodeType, NodeCategory, NodeMode, ConnectionType, Project, NodeData } from '../types';
import { nanoid } from 'nanoid';
import { saveProject, getProject } from '../services/dbService';

// Create a default node of the specified type
export function createNode(
  type: NodeType,
  position: { x: number; y: number },
): NodeData {
  const id = nanoid();
  const nodeCategory = type.split('_')[0] as NodeCategory;
  const nodeMode = type.split('_')[1] as NodeMode;
  
  const inputs: { id: string; type: ConnectionType }[] = [];
  
  if (type === NodeType.TEXT_GENERATED) {
    // Generated text can take text input
    inputs.push({ id: `${id}-in-1`, type: ConnectionType.TEXT });
  } else if (type === NodeType.IMAGE_GENERATED) {
    // Image node can have text input and image input
    inputs.push({ id: `${id}-in-1`, type: ConnectionType.TEXT, maxConnections: 1 });
    inputs.push({ id: `${id}-in-2`, type: ConnectionType.IMAGE, maxConnections: Infinity });
    inputs.push({ id: `${id}-in-3`, type: ConnectionType.MASK, maxConnections: 1 });
  } else if (type === NodeType.VIDEO_GENERATED) {
    // Generated video can take text, image, or video input
    inputs.push({ id: `${id}-in-1`, type: ConnectionType.TEXT, maxConnections: 1 });
    inputs.push({ id: `${id}-in-2`, type: ConnectionType.IMAGE, maxConnections: 1 });
    inputs.push({ id: `${id}-in-3`, type: ConnectionType.VIDEO, maxConnections: 1 });
  }
  
  // Determine output type based on node category
  const outputType = nodeCategory.toLowerCase() as ConnectionType;
  
  return {
    id,
    type,
    label: type === NodeType.IMAGE_GENERATED ? 'Image Generator' : getLabelForNodeType(type),
    category: nodeCategory as NodeCategory,
    mode: nodeMode as NodeMode,
    position,
    inputs,
    output: {
      id: `${id}-out`,
      type: outputType,
      width: 250,
      height: 200,
    },
    settings: type === NodeType.IMAGE_GENERATED ? {
      model: 'dall-e-3',
      size: '1024x1024',
      quality: 'hd',
      style: 'vivid',
      moderation: 'auto'
    } : undefined,
    generationStatus: 'idle',
  };
}

// Get a human-readable label for a node type
function getLabelForNodeType(type: NodeType): string {
  switch (type) {
    case NodeType.TEXT_STATIC:
      return 'Static Text';
    case NodeType.TEXT_GENERATED:
      return 'Generated Text';
    case NodeType.IMAGE_STATIC:
      return 'Static Image';
    case NodeType.IMAGE_GENERATED:
      return 'Generated Image';
    case NodeType.VIDEO_STATIC:
      return 'Static Video';
    case NodeType.VIDEO_GENERATED:
      return 'Generated Video';
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