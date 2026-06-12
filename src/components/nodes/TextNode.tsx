import React, { useState, useEffect } from 'react';
import BaseNode from './BaseNode';

// Static text node: the user types content that feeds connected nodes.
const TextNode: React.FC<any> = ({ data, selected }) => {
  const [localContent, setLocalContent] = useState(data.content || '');

  // Update local content when node data changes
  useEffect(() => {
    setLocalContent(data.content || '');
  }, [data.content]);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setLocalContent(newContent);
    data.updateNodeData({
      content: newContent,
    });
  };

  return (
    <BaseNode data={data} selected={selected}>
      <textarea
        value={localContent}
        onChange={handleContentChange}
        placeholder="Enter text..."
        className="nodrag w-full h-full min-h-[100px] p-2 text-sm bg-slate-800 border border-slate-700 rounded resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
    </BaseNode>
  );
};

export default TextNode;
