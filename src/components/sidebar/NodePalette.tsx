import React from 'react';
import { NodeType, NodeCategory } from '../../types';
import { Type, Image, Video } from 'lucide-react';

const NodePalette: React.FC = () => {
  const onDragStart = (event: React.DragEvent, nodeType: NodeType) => {
    event.dataTransfer.setData('application/nodeType', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-4">Node Palette</h2>
      
      {/* Text Nodes */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-slate-400 mb-2 flex items-center">
          <Type className="w-4 h-4 mr-1 text-node-text" />
          Text Nodes
        </h3>
        <div className="space-y-2">
          <div
            className="p-3 bg-slate-800 border-l-4 border-node-text rounded cursor-grab hover:bg-slate-700 transition-colors"
            draggable
            onDragStart={(e) => onDragStart(e, NodeType.TEXT_STATIC)}
          >
            <div className="text-sm font-medium">Static Text</div>
            <div className="text-xs text-slate-400">
              Manually entered text
            </div>
          </div>
          <div
            className="p-3 bg-slate-800 border-l-4 border-node-text rounded cursor-grab hover:bg-slate-700 transition-colors"
            draggable
            onDragStart={(e) => onDragStart(e, NodeType.TEXT_GENERATED)}
          >
            <div className="text-sm font-medium">Generated Text</div>
            <div className="text-xs text-slate-400">
              AI-generated text from prompt
            </div>
          </div>
        </div>
      </div>
      
      {/* Image Nodes */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-slate-400 mb-2 flex items-center">
          <Image className="w-4 h-4 mr-1 text-node-image" />
          Image Nodes
        </h3>
        <div className="space-y-2">
          <div
            className="p-3 bg-slate-800 border-l-4 border-node-image rounded cursor-grab hover:bg-slate-700 transition-colors"
            draggable
            onDragStart={(e) => onDragStart(e, NodeType.IMAGE_STATIC)}
          >
            <div className="text-sm font-medium">Static Image</div>
            <div className="text-xs text-slate-400">
              Upload your own image
            </div>
          </div>
          <div
            className="p-3 bg-slate-800 border-l-4 border-node-image rounded cursor-grab hover:bg-slate-700 transition-colors"
            draggable
            onDragStart={(e) => onDragStart(e, NodeType.IMAGE_GENERATED)}
          >
            <div className="text-sm font-medium">Generated Image</div>
            <div className="text-xs text-slate-400">
              AI-generated image from text or image
            </div>
          </div>
        </div>
      </div>
      
      {/* Video Nodes */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-slate-400 mb-2 flex items-center">
          <Video className="w-4 h-4 mr-1 text-node-video" />
          Video Nodes
        </h3>
        <div className="space-y-2">
          <div
            className="p-3 bg-slate-800 border-l-4 border-node-video rounded cursor-grab hover:bg-slate-700 transition-colors"
            draggable
            onDragStart={(e) => onDragStart(e, NodeType.VIDEO_STATIC)}
          >
            <div className="text-sm font-medium">Static Video</div>
            <div className="text-xs text-slate-400">
              Upload your own video
            </div>
          </div>
          <div
            className="p-3 bg-slate-800 border-l-4 border-node-video rounded cursor-grab hover:bg-slate-700 transition-colors"
            draggable
            onDragStart={(e) => onDragStart(e, NodeType.VIDEO_GENERATED)}
          >
            <div className="text-sm font-medium">Generated Video</div>
            <div className="text-xs text-slate-400">
              AI-generated video from text, image, or video
            </div>
          </div>
        </div>
      </div>
      
      <div className="text-xs text-slate-500 mt-6 p-3 bg-slate-800/50 rounded-md">
        <p>Drag nodes onto the canvas to create your workflow.</p>
        <p className="mt-2">Connect nodes by dragging from outputs to inputs.</p>
      </div>
    </div>
  );
};

export default NodePalette;