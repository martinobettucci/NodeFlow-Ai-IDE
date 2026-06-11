import React, { useState, useRef, useEffect } from 'react';
import BaseNode from './BaseNode';
import { NodeMode, NodeType, ConnectionType } from '../../types';
import { Upload, Sparkles, RotateCcw, ImageIcon, VenetianMask } from 'lucide-react';
import { useApiKeys } from '../../contexts/APIKeyContext';
import { generateImage } from '../../services/apiService';

const ImageNode: React.FC<any> = ({ data, selected }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { openaiKey } = useApiKeys();
  
  // Initialize settings with defaults if not set
  useEffect(() => {
    if (!data.settings) {
      data.updateNodeData({
        settings: {
          model: 'dall-e-3',
          size: '1024x1024',
          quality: 'standard',
          style: 'vivid',
          moderation: 'medium',
          background: 'auto',
          output_format: 'png',
          output_compression: 100
        }
      });
    }
  }, []);
  
  // Handle file drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };
  
  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };
  
  // Process selected file
  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file.');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      data.updateNodeData({
        content,
        output: {
          id: data.output.id,
          type: data.output.type || ConnectionType.IMAGE
        }
      });
    };
    reader.readAsDataURL(file);
  };
  
  // Generate image using OpenAI
  const handleGenerateImage = async () => {
    if (data.type !== NodeType.IMAGE_GENERATED || !openaiKey) {
      return;
    }
    
    try {
      setIsGenerating(true);
      data.updateNodeData({
        generationStatus: 'generating',
        generationError: undefined,
      });
      
      // Get input from connected nodes
      const connectedInputs = data.getConnectedInputs();
      
      const textInputs = connectedInputs.filter((input: any) => 
        input.category === 'text' && input.content
      );
      
      const imageInputs = connectedInputs.filter((input: any) => 
        input.category === 'image' && input.content && input.output.type === ConnectionType.IMAGE
      ).map((input: any) => input.content);
      
      // Check if we have any inputs at all
      if (connectedInputs.length === 0) {
        throw new Error('No inputs connected. Connect a text or image input first.');
      }
      
      
      const maskInputs = connectedInputs.filter((input: any) => 
        input.category === 'image' && input.content && input.output.type === ConnectionType.MASK
      );
      
      let generatedImage;
      
      // Determine generation mode based on inputs
      let mode: 'generate' | 'edit' | 'variations' = 'generate';
      let maskImage: string | undefined;
      
      if (imageInputs.length > 0 && textInputs.length > 0) {
        mode = 'edit';
        const textPrompt = textInputs[0].content;
        maskImage = maskInputs.length > 0 ? maskInputs[0].content : undefined;
        
        // For edits, only DALL-E 2 and GPT-IMAGE-1 are supported
        const currentModel = data.settings?.model || 'dall-e-2';
        if (currentModel === 'dall-e-3') {
          data.updateNodeData({
            settings: {
              ...data.settings,
              model: 'dall-e-2'
            }
          });
        }
        
        generatedImage = await generateImage(
          openaiKey,
          textPrompt,
          data.settings || {},
          imageInputs,
          mode,
          maskImage
        );
      } else if (imageInputs.length > 0) {
        mode = 'variations';
        
        // For variations, only DALL-E 2 is supported
        const currentModel = data.settings?.model || 'dall-e-2';
        if (currentModel !== 'dall-e-2') {
          data.updateNodeData({
            settings: {
              ...data.settings,
              model: 'dall-e-2'
            }
          });
        }
        
        generatedImage = await generateImage(
          openaiKey,
          '',
          data.settings || {},
          imageInputs,
          mode
        );
      } else {
        // Text-to-image generation
        mode = 'generate';
        const textPrompt = textInputs.length > 0 
          ? textInputs[0].content 
          : 'Generate a creative image';
        
        // Ensure settings are properly set based on the selected model
        const currentModel = data.settings?.model || 'dall-e-3';
        const settings = {
          ...data.settings,
          model: currentModel,
        };
        
        generatedImage = await generateImage(
          openaiKey,
          textPrompt,
          settings
        );
      }
      
      data.updateNodeData({
        content: generatedImage,
        generationStatus: 'success',
      });
    } catch (error) {
      console.error('Failed to generate image:', error);
      data.updateNodeData({
        generationStatus: 'error',
        generationError: error instanceof Error ? error.message : 'Failed to generate image',
      });
    } finally {
      setIsGenerating(false);
    }
  };
  
  return (
    <BaseNode data={data} selected={selected}>
      <div className="space-y-2">
        <div className="flex justify-end mb-2 space-x-1">
          <div className="flex rounded-md overflow-hidden border border-slate-700">
            <button
              onClick={() => {
                data.updateNodeData({
                  output: {
                    id: data.output.id,
                    type: ConnectionType.IMAGE
                  }
                });
              }}
              className={`flex items-center space-x-1 px-2 py-1 text-xs transition-colors ${
                data.output.type === ConnectionType.IMAGE
                  ? 'bg-node-image text-white font-medium'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-400'
              }`}
            >
              <ImageIcon className="w-3 h-3" />
              <span>Image</span>
            </button>
            <button
              onClick={() => {
                data.updateNodeData({
                  output: {
                    id: data.output.id,
                    type: ConnectionType.MASK
                  }
                });
              }}
              className={`flex items-center space-x-1 px-2 py-1 text-xs transition-colors ${
                data.output.type === ConnectionType.MASK
                  ? 'bg-node-mask text-white font-medium'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-400'
              }`}
            >
              <VenetianMask className="w-3 h-3" />
              <span>Mask</span>
            </button>
          </div>
        </div>
        {data.content ? (
          <div className="relative flex items-center justify-center p-2 bg-slate-800/50 rounded-lg">
            <div className={`absolute top-1 left-1 px-2 py-0.5 text-xs rounded font-medium ${
              data.output.type === ConnectionType.MASK 
                ? 'bg-node-mask/90 text-white'
                : 'bg-node-image/90 text-white'
            }`}>
              {data.output.type === ConnectionType.MASK 
                ? <div className="flex items-center"><VenetianMask className="w-3 h-3 mr-1" /> Mask</div>
                : <div className="flex items-center"><ImageIcon className="w-3 h-3 mr-1" /> Image</div>
              }
            </div>
            <div className="relative max-w-full max-h-full">
              <img 
                src={data.content} 
                alt="Node content" 
                className={`max-w-full max-h-[calc(100vh-200px)] object-contain rounded border-2 ${
                  data.output.type === ConnectionType.MASK
                    ? 'border-node-mask/50'
                    : 'border-node-image/50'
                }`}
              />
            </div>
            <button
              onClick={() => {
                data.updateNodeData({ content: '' });
              }}
              className={`absolute top-1 right-1 p-1 rounded-full ${
                data.output.type === ConnectionType.MASK
                  ? 'bg-node-mask/90 hover:bg-node-mask text-white'
                  : 'bg-node-image/90 hover:bg-node-image text-white'
              }`}
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <div
            className={`border-2 border-dashed rounded-md p-4 text-center transition-colors ${
              dragActive 
                ? 'border-blue-500 bg-blue-900/20' 
                : 'border-slate-700 hover:border-slate-500'
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setDragActive(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setDragActive(false);
            }}
            onDrop={handleDrop}
            onClick={() => data.mode === NodeMode.STATIC && fileInputRef.current?.click()}
          >
            {data.mode === NodeMode.STATIC ? (
              <>
                <Upload className="w-6 h-6 mx-auto mb-2 text-slate-400" />
                <p className="text-xs text-slate-400">
                  Click or drop image here
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileChange}
                />
              </>
            ) : (
              <p className="text-xs text-slate-400">
                Generated image will appear here
              </p>
            )}
          </div>
        )}
        
        {data.mode === NodeMode.GENERATED && (
          <div className="flex justify-between">
            <button
              onClick={handleGenerateImage}
              disabled={isGenerating || !openaiKey || !data.inputs.some((input: any) => input.connected)}
              className="flex items-center space-x-1 px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Sparkles className="w-3 h-3" />
              <span>
                {isGenerating ? 'Generating...' : 
                 !data.inputs.some((input: any) => input.connected) ? 'Connect Input' : 
                 'Generate'}
              </span>
            </button>
            
            {data.generationStatus === 'error' && (
              <div className="text-xs text-red-400 truncate" title={data.generationError}>
                Error: {data.generationError}
              </div>
            )}
            
            {data.content && data.generationStatus === 'success' && (
              <button
                onClick={() => {
                  data.updateNodeData({
                    content: '',
                    generationStatus: 'idle',
                  });
                }}
                className="text-xs text-slate-400 hover:text-slate-300"
              >
                Clear
              </button>
            )}
          </div>
        )}
      </div>
    </BaseNode>
  );
};

export default ImageNode;