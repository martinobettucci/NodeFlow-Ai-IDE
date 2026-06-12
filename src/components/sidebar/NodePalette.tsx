import React from 'react';
import { NodeType } from '../../types';
import { Type, Image, Music, Video, Server } from 'lucide-react';
import { useBackends } from '../../contexts/BackendContext';

const staticNodes: { type: NodeType; icon: React.ReactNode; label: string; hint: string; border: string }[] = [
  {
    type: NodeType.TEXT_STATIC,
    icon: <Type className="w-4 h-4 mr-1 text-node-text" />,
    label: 'Text',
    hint: 'Prompt or text content',
    border: 'border-node-text',
  },
  {
    type: NodeType.IMAGE_STATIC,
    icon: <Image className="w-4 h-4 mr-1 text-node-image" />,
    label: 'Image',
    hint: 'Upload your own image',
    border: 'border-node-image',
  },
  {
    type: NodeType.AUDIO_STATIC,
    icon: <Music className="w-4 h-4 mr-1 text-node-audio" />,
    label: 'Audio',
    hint: 'Upload your own audio',
    border: 'border-node-audio',
  },
  {
    type: NodeType.VIDEO_STATIC,
    icon: <Video className="w-4 h-4 mr-1 text-node-video" />,
    label: 'Video',
    hint: 'Upload your own video',
    border: 'border-node-video',
  },
];

const NodePalette: React.FC = () => {
  const { backends } = useBackends();
  const connectedBackends = backends.filter(
    (backend) => backend.status === 'connected' && backend.manifests.length > 0
  );

  const onDragStart = (event: React.DragEvent, nodeType: NodeType) => {
    event.dataTransfer.setData('application/nodeType', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  const onBackendNodeDragStart = (
    event: React.DragEvent,
    backendId: string,
    nodeId: string
  ) => {
    event.dataTransfer.setData(
      'application/nodeflow-backend',
      JSON.stringify({ backendId, nodeId })
    );
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-4">Node Palette</h2>

      {/* Static input nodes */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-slate-400 mb-2">Inputs</h3>
        <div className="space-y-2">
          {staticNodes.map((node) => (
            <div
              key={node.type}
              className={`p-3 bg-slate-800 border-l-4 ${node.border} rounded cursor-grab hover:bg-slate-700 transition-colors`}
              draggable
              onDragStart={(e) => onDragStart(e, node.type)}
            >
              <div className="text-sm font-medium flex items-center">
                {node.icon}
                {node.label}
              </div>
              <div className="text-xs text-slate-400">{node.hint}</div>
            </div>
          ))}
        </div>
      </div>

      {/* NodeFlow SDK Backend Nodes */}
      {connectedBackends.map((backend) => (
        <div className="mb-6" key={backend.id}>
          <h3 className="text-sm font-medium text-slate-400 mb-2 flex items-center">
            <Server className="w-4 h-4 mr-1 text-blue-400" />
            {backend.name}
          </h3>
          <div className="space-y-2">
            {backend.manifests.map((manifest) => (
              <div
                key={`${backend.id}-${manifest.id}`}
                className="p-3 bg-slate-800 border-l-4 border-blue-400 rounded cursor-grab hover:bg-slate-700 transition-colors"
                draggable
                onDragStart={(e) => onBackendNodeDragStart(e, backend.id, manifest.id)}
              >
                <div className="text-sm font-medium">{manifest.label}</div>
                <div className="text-xs text-slate-400">{manifest.description}</div>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="text-xs text-slate-500 mt-6 p-3 bg-slate-800/50 rounded-md">
        <p>Drag nodes onto the canvas to create your workflow.</p>
        <p className="mt-2">Connect nodes by dragging from outputs to inputs.</p>
        {connectedBackends.length === 0 && (
          <p className="mt-2 text-amber-400/80">
            No backend connected: all processing nodes come from NodeFlow SDK
            backends. Add one in Settings &gt; Backends.
          </p>
        )}
      </div>
    </div>
  );
};

export default NodePalette;
