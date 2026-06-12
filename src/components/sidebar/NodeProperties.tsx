import React, { useState, useEffect } from 'react';
import { Trash2, Server } from 'lucide-react';
import { NodeType, NodeMode, ConnectionType } from '../../types';
import { BackendNodeParameter, BackendParamType } from '../../services/nodeflow/types';

const connectionEmoticons = {
  [ConnectionType.TEXT]: '📝',
  [ConnectionType.IMAGE]: '🖼️',
  [ConnectionType.MASK]: '🎭',
  [ConnectionType.VIDEO]: '🎥',
  [ConnectionType.AUDIO]: '🔊',
  [ConnectionType.JSON]: '🧾',
};

interface NodePropertiesProps {
  nodeId: string | null;
  nodes: any[];
  setNodes: React.Dispatch<React.SetStateAction<any[]>>;
}

const NodeProperties: React.FC<NodePropertiesProps> = ({ nodeId, nodes, setNodes }) => {
  const [nodeName, setNodeName] = useState('');
  const selectedNode = nodes.find((node) => node.id === nodeId);

  useEffect(() => {
    if (selectedNode) {
      setNodeName(selectedNode.data.label || '');
    } else {
      setNodeName('');
    }
  }, [selectedNode]);

  if (!selectedNode) {
    return (
      <div className="p-4">
        <h2 className="text-lg font-semibold mb-4">Properties</h2>
        <p className="text-sm text-slate-400">
          Select a node to view its properties.
        </p>
      </div>
    );
  }

  const updateNodeData = (updates: Record<string, any>) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              ...updates,
            },
          };
        }
        return node;
      })
    );
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setNodeName(newName);
    updateNodeData({ label: newName });
  };

  const backendInfo = selectedNode.data.backend;

  const updateParameter = (paramId: string, value: unknown) => {
    updateNodeData({
      backend: {
        ...backendInfo,
        parameters: { ...backendInfo.parameters, [paramId]: value },
      },
    });
  };

  const getNodeTypeLabel = () => {
    switch (selectedNode.type) {
      case NodeType.TEXT_STATIC:
        return 'Text Input Node';
      case NodeType.IMAGE_STATIC:
        return 'Image Input Node';
      case NodeType.AUDIO_STATIC:
        return 'Audio Input Node';
      case NodeType.VIDEO_STATIC:
        return 'Video Input Node';
      case NodeType.BACKEND:
        return 'Backend Node';
      default:
        return 'Unknown Node Type';
    }
  };

  const getColorClass = () => {
    switch (selectedNode.data.category) {
      case 'text':
        return 'text-node-text';
      case 'image':
        return 'text-node-image';
      case 'audio':
        return 'text-node-audio';
      case 'video':
        return 'text-node-video';
      case 'mask':
        return 'text-node-mask';
      default:
        return '';
    }
  };

  const renderParameterField = (param: BackendNodeParameter) => {
    const value = backendInfo.parameters[param.id];
    const inputClasses =
      'w-full p-1.5 text-sm bg-slate-800 border border-slate-700 rounded focus:outline-none focus:ring-1 focus:ring-blue-500';

    switch (param.type) {
      case BackendParamType.CHECKBOX:
        return (
          <label className="flex items-center space-x-2 text-sm">
            <input
              type="checkbox"
              checked={Boolean(value)}
              onChange={(e) => updateParameter(param.id, e.target.checked)}
              className="w-4 h-4 rounded border-slate-700 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-slate-300">{param.label}</span>
          </label>
        );
      case BackendParamType.COMBOBOX:
        return (
          <select
            value={String(value ?? '')}
            onChange={(e) => updateParameter(param.id, e.target.value)}
            className={inputClasses}
          >
            {(param.options ?? []).map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        );
      case BackendParamType.NUMBER:
        return (
          <input
            type="number"
            step="any"
            value={value === undefined || value === null ? '' : String(value)}
            onChange={(e) =>
              updateParameter(param.id, e.target.value === '' ? param.default : Number(e.target.value))
            }
            className={inputClasses}
          />
        );
      default: // TEXTBOX
        return (
          <textarea
            value={String(value ?? '')}
            onChange={(e) => updateParameter(param.id, e.target.value)}
            rows={3}
            className={`${inputClasses} resize-none`}
          />
        );
    }
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Properties</h2>
        <button
          onClick={() => {
            if (confirm('Are you sure you want to delete this node?')) {
              setNodes((nds) => nds.filter((n) => n.id !== nodeId));
            }
          }}
          className="flex items-center space-x-1 px-2 py-1 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded transition-colors"
          title="Delete node"
        >
          <Trash2 className="w-4 h-4" />
          <span className="text-sm">Delete</span>
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <p className={`text-sm font-medium mb-1 ${getColorClass()}`}>
            {getNodeTypeLabel()}
          </p>
          <p className="text-xs text-slate-400">
            ID: {selectedNode.id}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Name
          </label>
          <input
            type="text"
            value={nodeName}
            onChange={handleNameChange}
            className="w-full p-2 text-sm bg-slate-800 border border-slate-700 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {backendInfo && (
          <div>
            <label className="block text-sm font-medium mb-1 flex items-center">
              <Server className="w-4 h-4 mr-1 text-blue-400" />
              Backend
            </label>
            <div className="text-xs text-slate-400 p-2 bg-slate-800 rounded border border-slate-700 space-y-1">
              <div className="truncate" title={backendInfo.backendUrl}>{backendInfo.backendUrl}</div>
              <div>Node: {backendInfo.nodeId}</div>
              <div className="text-slate-500">{backendInfo.manifest.description}</div>
            </div>
          </div>
        )}

        {backendInfo && backendInfo.manifest.parameters.length > 0 && (
          <div>
            <label className="block text-sm font-medium mb-2">
              Parameters
            </label>
            <div className="space-y-3">
              {backendInfo.manifest.parameters.map((param: BackendNodeParameter) => (
                <div key={param.id}>
                  {param.type !== BackendParamType.CHECKBOX && (
                    <label className="block text-xs text-slate-400 mb-1">
                      {param.label}
                    </label>
                  )}
                  {renderParameterField(param)}
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-1">
            Inputs
          </label>
          <div className="space-y-1">
            {selectedNode.data.inputs.length > 0 ? (
              selectedNode.data.inputs.map((input: any, index: number) => (
                <div
                  key={input.id}
                  className="flex items-center justify-between p-2 bg-slate-800 rounded border border-slate-700"
                >
                  <span className="text-xs">
                    {input.label ?? `Input ${index + 1}`}: {connectionEmoticons[input.type as ConnectionType]} {input.type}
                  </span>
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded ${
                      input.connected ? 'bg-green-500/20 text-green-300' : 'bg-slate-600 text-slate-300'
                    }`}
                  >
                    {input.connected ? 'Connected' : 'Disconnected'}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-xs text-slate-400 p-2 bg-slate-800 rounded">
                No inputs available
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            {selectedNode.data.mode === NodeMode.GENERATED ? 'Outputs' : 'Output'}
          </label>
          <div className="space-y-1">
            {(selectedNode.data.outputs ?? [selectedNode.data.output]).map((output: any, index: number) => (
              <div
                key={output.id}
                className="flex items-center justify-between p-2 bg-slate-800 rounded border border-slate-700"
              >
                <span className="text-xs">
                  {output.label ?? `Output ${index + 1}`}: {connectionEmoticons[output.type as ConnectionType]} {output.type}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NodeProperties;
