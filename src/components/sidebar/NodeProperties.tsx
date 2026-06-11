import React, { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import { NodeType, NodeMode, ConnectionType } from '../../types';

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
  
  // Determine node type label
  const getNodeTypeLabel = () => {
    switch (selectedNode.type) {
      case NodeType.TEXT_STATIC:
        return 'Static Text Node';
      case NodeType.TEXT_GENERATED:
        return 'Generated Text Node';
      case NodeType.IMAGE_STATIC:
        return 'Static Image Node';
      case NodeType.IMAGE_GENERATED:
        return 'Generated Image Node';
      case NodeType.VIDEO_STATIC:
        return 'Static Video Node';
      case NodeType.VIDEO_GENERATED:
        return 'Generated Video Node';
      default:
        return 'Unknown Node Type';
    }
  };
  
  // Get color class based on node category
  const getColorClass = () => {
    switch (selectedNode.data.category) {
      case 'text':
        return 'text-node-text';
      case 'image':
        return 'text-node-image';
      case 'video':
        return 'text-node-video';
      default:
        return '';
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
        
        <div>
          <label className="block text-sm font-medium mb-1">
            Mode
          </label>
          <div className="text-sm bg-slate-800 p-2 rounded border border-slate-700">
            {selectedNode.data.mode === NodeMode.STATIC ? 'Static' : 'Generated'}
          </div>
        </div>
        
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
                  <span className="text-xs">Input {index + 1}: {connectionEmoticons[input.type as ConnectionType]} {input.type}</span>
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
            Output
          </label>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 bg-slate-800 rounded border border-slate-700">
              <span className="text-xs">Output: {connectionEmoticons[selectedNode.data.output.type as ConnectionType]} {selectedNode.data.output.type}</span>
            </div>
            {selectedNode.data.category === 'image' && selectedNode.data.mode === NodeMode.GENERATED && (
              <select
                value={selectedNode.data.output.type}
                onChange={(e) => {
                  updateNodeData({
                    output: {
                      id: selectedNode.data.output.id,
                      type: e.target.value as ConnectionType
                    }
                  });
                }}
                className="w-full p-1.5 text-sm bg-slate-800 border border-slate-700 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value={ConnectionType.IMAGE}>Generate as Image</option>
                <option value={ConnectionType.MASK}>Generate as Mask</option>
              </select>
            )}
          </div>
        </div>
        
        {/* Generation Settings - Image Node */}
        {selectedNode.type === NodeType.IMAGE_GENERATED && (
          <div className="mt-4">
            <label className="block text-sm font-medium mb-1">
              Generation Mode
            </label>
            <div className="text-sm bg-slate-800 p-2 rounded border border-slate-700 mb-3">
              {(() => {
                const imageInputs = selectedNode.data.inputs
                  .filter((input: any) => input.connected && input.type === 'image')
                  .length;
                const textInputs = selectedNode.data.inputs
                  .filter((input: any) => input.connected && input.type === 'text')
                  .length;
                
                if (imageInputs > 0 && textInputs > 0) return 'Edit (Image + Text)';
                if (imageInputs > 0) return 'Variations (Image Only)';
                return 'Generate (Text Only)';
              })()}
            </div>
            
            <div className="space-y-3">
              {/* Model Setting */}
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  AI Model
                </label>
                <select
                  value={selectedNode.data.settings?.model || 'dall-e-3'}
                  onChange={(e) => {
                    const newModel = e.target.value;
                    let updatedSettings: any = {
                      model: newModel
                    };

                    // Set default settings based on model
                    if (newModel === 'dall-e-3') {
                      updatedSettings = {
                        ...updatedSettings,
                        size: '1024x1024',
                        quality: 'hd',
                        style: 'vivid'
                      };
                    } else if (newModel === 'gpt-image-1') {
                      updatedSettings = {
                        ...updatedSettings,
                        size: '1024x1024',
                        quality: 'high',
                        background: 'auto',
                        output_format: 'png',
                        output_compression: 100,
                        moderation: 'auto'
                      };
                    } else { // dall-e-2
                      updatedSettings = {
                        ...updatedSettings,
                        size: '1024x1024'
                      };
                    }
                    
                    updateNodeData({
                      settings: updatedSettings,
                    });
                  }}
                  className="w-full p-1.5 text-sm bg-slate-800 border border-slate-700 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {(() => {
                    const hasImageInput = selectedNode.data.inputs
                      .some((input: any) => input.connected && input.type === 'image');
                    
                    if (hasImageInput) {
                      // Only DALL·E 2 and GPT-IMAGE-1 support edits
                      return (
                        <>
                          <option value="dall-e-2">DALL·E 2 (Standard)</option>
                          <option value="gpt-image-1">GPT-IMAGE-1 (Advanced)</option>
                        </>
                      );
                    }
                    
                    return (
                      <>
                        <option value="gpt-image-1">GPT-IMAGE-1 (Advanced)</option>
                        <option value="dall-e-3">DALL·E 3 (High creativity)</option>
                        <option value="dall-e-2">DALL·E 2 (Standard)</option>
                      </>
                    );
                  })()}
                </select>
              </div>
              
              {/* Size Setting */}
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Image Size
                </label>
                <select
                  value={selectedNode.data.settings?.size || '1024x1024'}
                  onChange={(e) => {
                    updateNodeData({
                      settings: {
                        ...selectedNode.data.settings,
                        size: e.target.value,
                      },
                    });
                  }}
                  className="w-full p-1.5 text-sm bg-slate-800 border border-slate-700 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {(() => {
                    const model = selectedNode.data.settings?.model;
                    
                    if (model === 'dall-e-3') {
                      return (
                        <>
                          <option value="1024x1024">Square (1024×1024)</option>
                          <option value="1792x1024">Landscape (1792×1024)</option>
                          <option value="1024x1792">Portrait (1024×1792)</option>
                        </>
                      );
                    }
                    
                    if (model === 'gpt-image-1') {
                      return (
                        <>
                          <option value="1024x1024">Square (1024×1024)</option>
                          <option value="1536x1024">Landscape (1536×1024)</option>
                          <option value="1024x1536">Portrait (1024×1536)</option>
                        </>
                      );
                    }
                    
                    // DALL·E 2
                    return (
                      <>
                        <option value="256x256">Small (256×256)</option>
                        <option value="512x512">Medium (512×512)</option>
                        <option value="1024x1024">Large (1024×1024)</option>
                      </>
                    );
                  })()}
                </select>
              </div>
              
              {/* Quality Setting */}
              {(() => {
                const model = selectedNode.data.settings?.model;
                if (!model) return null;
                
                let options;
                if (model === 'dall-e-3') {
                  options = [
                    { value: 'standard', label: 'Standard' },
                    { value: 'hd', label: 'HD' }
                  ];
                } else if (model === 'gpt-image-1') {
                  options = [
                    { value: 'high', label: 'High' },
                    { value: 'medium', label: 'Medium' },
                    { value: 'low', label: 'Low' }
                  ];
                } else {
                  return null; // DALL·E 2 doesn't support quality settings
                }
                
                return (
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">
                      Quality
                    </label>
                    <select
                      value={selectedNode.data.settings?.quality || options[0].value}
                      onChange={(e) => {
                        updateNodeData({
                          settings: {
                            ...selectedNode.data.settings,
                            quality: e.target.value,
                          },
                        });
                      }}
                      className="w-full p-1.5 text-sm bg-slate-800 border border-slate-700 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      {options.map(opt => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              })()}
              
              {/* Style Setting (DALL·E 3 only) */}
              {selectedNode.data.settings?.model === 'dall-e-3' && !selectedNode.data.inputs
                .some((input: any) => input.connected && input.type === 'image') && (
                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    Style
                  </label>
                  <select
                    value={selectedNode.data.settings?.style || 'vivid'}
                    onChange={(e) => {
                      updateNodeData({
                        settings: {
                          ...selectedNode.data.settings,
                          style: e.target.value,
                        },
                      });
                    }}
                    className="w-full p-1.5 text-sm bg-slate-800 border border-slate-700 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="vivid">Vivid (Hyper-real)</option>
                    <option value="natural">Natural (More subtle)</option>
                  </select>
                </div>
              )}
              
              {/* Background Setting (GPT-4V only) */}
              {selectedNode.data.settings?.model === 'gpt-image-1' && !selectedNode.data.inputs
                .some((input: any) => input.connected && input.type === 'image') && (
                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    Background
                  </label>
                  <select
                    value={selectedNode.data.settings?.background || 'auto'}
                    onChange={(e) => {
                      updateNodeData({
                        settings: {
                          ...selectedNode.data.settings,
                          background: e.target.value,
                        },
                      });
                    }}
                    className="w-full p-1.5 text-sm bg-slate-800 border border-slate-700 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="auto">Auto</option>
                    <option value="transparent">Transparent</option>
                    <option value="opaque">Opaque</option>
                  </select>
                </div>
              )}
              
              {/* Output Format (GPT-4V only) */}
              {selectedNode.data.settings?.model === 'gpt-image-1' && !selectedNode.data.inputs
                .some((input: any) => input.connected && input.type === 'image') && (
                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    Output Format
                  </label>
                  <select
                    value={selectedNode.data.settings?.output_format || 'png'}
                    onChange={(e) => {
                      updateNodeData({
                        settings: {
                          ...selectedNode.data.settings,
                          output_format: e.target.value,
                        },
                      });
                    }}
                    className="w-full p-1.5 text-sm bg-slate-800 border border-slate-700 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="png">PNG</option>
                    <option value="jpeg">JPEG</option>
                    <option value="webp">WebP</option>
                  </select>
                </div>
              )}
              
              {/* Compression (GPT-4V only) */}
              {selectedNode.data.settings?.model === 'gpt-image-1' && !selectedNode.data.inputs
                .some((input: any) => input.connected && input.type === 'image') && 
               (selectedNode.data.settings?.output_format === 'webp' || 
                selectedNode.data.settings?.output_format === 'jpeg') && (
                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    Compression (%)
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="100"
                    value={selectedNode.data.settings?.output_compression || 100}
                    onChange={(e) => {
                      updateNodeData({
                        settings: {
                          ...selectedNode.data.settings,
                          output_compression: parseInt(e.target.value),
                        },
                      });
                    }}
                    className="w-full"
                  />
                  <div className="text-xs text-slate-400 text-right">
                    {selectedNode.data.settings?.output_compression || 100}%
                  </div>
                </div>
              )}
              
              {/* Moderation Setting */}
              {selectedNode.data.settings?.model === 'gpt-image-1' && (
                <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Content Moderation
                </label>
                <select
                  value={selectedNode.data.settings?.moderation || 'auto'}
                  onChange={(e) => {
                    updateNodeData({
                      settings: {
                        ...selectedNode.data.settings,
                        moderation: e.target.value,
                      },
                    });
                  }}
                  className="w-full p-1.5 text-sm bg-slate-800 border border-slate-700 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="auto">Auto</option>
                  <option value="low">Low (Family-friendly)</option>
                </select>
              </div>
              )}
            </div>
          </div>
        )}
        
        {/* Generation Settings - Video Node */}
        {selectedNode.type === NodeType.VIDEO_GENERATED && (
          <div className="mt-4">
            <label className="block text-sm font-medium mb-1">
              Video Generation Settings
            </label>
            
            <div className="space-y-3">
              {/* Prompt Field */}
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Negative Prompt
                </label>
                <textarea
                  value={selectedNode.data.settings?.negative_prompt || ''}
                  onChange={(e) => {
                    updateNodeData({
                      settings: {
                        ...selectedNode.data.settings,
                        negative_prompt: e.target.value,
                      },
                    });
                  }}
                  placeholder="Specify what NOT to include in the video"
                  rows={2}
                  className="w-full p-2 text-sm bg-slate-800 border border-slate-700 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                />
              </div>
              
              {/* Aspect Ratio */}
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Aspect Ratio
                </label>
                <select
                  value={selectedNode.data.settings?.aspect_ratio || '16:9'}
                  onChange={(e) => {
                    updateNodeData({
                      settings: {
                        ...selectedNode.data.settings,
                        aspect_ratio: e.target.value,
                      },
                    });
                  }}
                  className="w-full p-1.5 text-sm bg-slate-800 border border-slate-700 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="16:9">Landscape (16:9)</option>
                  <option value="9:16">Portrait (9:16)</option>
                </select>
              </div>
              
              {/* Resolution */}
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Resolution
                </label>
                <select
                  value={selectedNode.data.settings?.resolution || '720p'}
                  onChange={(e) => {
                    updateNodeData({
                      settings: {
                        ...selectedNode.data.settings,
                        resolution: e.target.value,
                      },
                    });
                  }}
                  className="w-full p-1.5 text-sm bg-slate-800 border border-slate-700 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="720p">720p (HD)</option>
                  <option value="480p">480p (SD)</option>
                </select>
              </div>
              
              {/* Number of Frames */}
              <div>
                <div className="flex justify-between items-center">
                  <label className="text-xs text-slate-400">Frames:</label>
                  <span className="text-xs text-slate-300">{selectedNode.data.settings?.num_frames || 180}</span>
                </div>
                <input
                  type="range"
                  min="60"
                  max="240"
                  step="30"
                  value={selectedNode.data.settings?.num_frames || 180}
                  onChange={(e) => {
                    updateNodeData({
                      settings: {
                        ...selectedNode.data.settings,
                        num_frames: parseInt(e.target.value),
                      },
                    });
                  }}
                  className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                />
              </div>
              
              {/* CFG Scale */}
              <div>
                <div className="flex justify-between items-center">
                  <label className="text-xs text-slate-400">CFG Scale:</label>
                  <span className="text-xs text-slate-300">{selectedNode.data.settings?.cfg_scale || 1}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="20"
                  step="0.5"
                  value={selectedNode.data.settings?.cfg_scale || 1}
                  onChange={(e) => {
                    updateNodeData({
                      settings: {
                        ...selectedNode.data.settings,
                        cfg_scale: parseFloat(e.target.value),
                      },
                    });
                  }}
                  className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                />
              </div>
              
              {/* Guidance Scale */}
              <div>
                <div className="flex justify-between items-center">
                  <label className="text-xs text-slate-400">Guidance Scale:</label>
                  <span className="text-xs text-slate-300">{selectedNode.data.settings?.guidance_scale || 10}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="20"
                  step="0.5"
                  value={selectedNode.data.settings?.guidance_scale || 10}
                  onChange={(e) => {
                    updateNodeData({
                      settings: {
                        ...selectedNode.data.settings,
                        guidance_scale: parseFloat(e.target.value),
                      },
                    });
                  }}
                  className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                />
              </div>
              
              {/* Safety Checker */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="safety-checker"
                  checked={selectedNode.data.settings?.enable_safety_checker || false}
                  onChange={(e) => {
                    updateNodeData({
                      settings: {
                        ...selectedNode.data.settings,
                        enable_safety_checker: e.target.checked,
                      },
                    });
                  }}
                  className="w-4 h-4 rounded border-slate-700 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="safety-checker" className="ml-2 text-xs text-slate-400">
                  Enable Safety Checker
                </label>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NodeProperties;