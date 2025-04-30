import React, { useState, useEffect } from 'react';
import BaseNode from './BaseNode';
import { NodeMode, NodeType } from '../../types';
import { Sparkles, RotateCcw } from 'lucide-react';
import { useApiKeys } from '../../contexts/APIKeyContext';
import { generateText } from '../../services/apiService';

const TextNode: React.FC<any> = ({ data, selected }) => {
  const [localContent, setLocalContent] = useState(data.content || '');
  const [isGenerating, setIsGenerating] = useState(false);
  const { openaiKey } = useApiKeys();
  
  // Update local content when node data changes
  useEffect(() => {
    setLocalContent(data.content || '');
  }, [data.content]);
  
  // Update node data when local content changes
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setLocalContent(newContent);
    data.updateNodeData({
      content: newContent,
    });
  };
  
  const handleGenerateText = async () => {
    if (data.type !== NodeType.TEXT_GENERATED || !openaiKey) {
      return;
    }
    
    try {
      setIsGenerating(true);
      data.updateNodeData({
        generationStatus: 'generating',
        generationError: undefined,
      });
      
      // Get input text from connected nodes
      const connectedInputs = data.getConnectedInputs();
      const prompt = connectedInputs.length > 0
        ? connectedInputs.map((input: any) => input.content).join('\n')
        : 'Generate creative text based on this prompt.';
      
      // Generate text using OpenAI
      const generatedText = await generateText(openaiKey, prompt);
      
      setLocalContent(generatedText);
      data.updateNodeData({
        content: generatedText,
        generationStatus: 'success',
      });
    } catch (error) {
      console.error('Failed to generate text:', error);
      data.updateNodeData({
        generationStatus: 'error',
        generationError: error instanceof Error ? error.message : 'Failed to generate text',
      });
    } finally {
      setIsGenerating(false);
    }
  };
  
  return (
    <BaseNode data={data} selected={selected}>
      <div className="space-y-2">
        <textarea
          value={localContent}
          onChange={handleContentChange}
          placeholder={data.mode === NodeMode.STATIC ? "Enter text..." : "Generated text will appear here..."}
          className="w-full h-full min-h-[100px] p-2 text-sm bg-slate-800 border border-slate-700 rounded resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
          disabled={data.mode === NodeMode.GENERATED && isGenerating}
        />
        
        {data.mode === NodeMode.GENERATED && (
          <div className="flex justify-between">
            <button
              onClick={handleGenerateText}
              disabled={isGenerating || !openaiKey}
              className="flex items-center space-x-1 px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Sparkles className="w-3 h-3" />
              <span>{isGenerating ? 'Generating...' : 'Generate'}</span>
            </button>
            
            {data.generationStatus === 'error' && (
              <div className="text-xs text-red-400 truncate" title={data.generationError}>
                Error: {data.generationError}
              </div>
            )}
            
            {data.content && data.generationStatus === 'success' && (
              <button
                onClick={() => {
                  setLocalContent('');
                  data.updateNodeData({
                    content: '',
                    generationStatus: 'idle',
                  });
                }}
                className="flex items-center px-2 py-1 text-xs bg-slate-700 hover:bg-slate-600 rounded transition-colors"
              >
                <RotateCcw className="w-3 h-3 mr-1" />
                Reset
              </button>
            )}
          </div>
        )}
      </div>
    </BaseNode>
  );
};

export default TextNode;