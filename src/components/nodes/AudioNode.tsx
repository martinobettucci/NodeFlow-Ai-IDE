import React from 'react';
import { RotateCcw } from 'lucide-react';
import BaseNode from './BaseNode';
import MediaUpload from './MediaUpload';

// Static audio node: upload an audio file that feeds connected nodes
// (e.g. a transcription backend).
const AudioNode: React.FC<any> = ({ data, selected }) => {
  return (
    <BaseNode data={data} selected={selected}>
      {data.content ? (
        <div className="space-y-2">
          <audio src={data.content} controls className="nodrag w-full" />
          <button
            onClick={() => data.updateNodeData({ content: undefined })}
            className="nodrag flex items-center px-2 py-1 text-xs bg-slate-700 hover:bg-slate-600 rounded transition-colors"
          >
            <RotateCcw className="w-3 h-3 mr-1" />
            Replace
          </button>
        </div>
      ) : (
        <MediaUpload
          accept="audio/*"
          prompt="Drop an audio file or click to upload"
          onContent={(content) => data.updateNodeData({ content })}
        />
      )}
    </BaseNode>
  );
};

export default AudioNode;
