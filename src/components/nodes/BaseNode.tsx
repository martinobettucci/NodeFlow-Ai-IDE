import React from 'react';
import { Handle, Position, NodeResizer } from 'reactflow';
import { clsx } from 'clsx';
import { NodeData, NodeCategory, NodeMode, ConnectionType } from '../../types';

const connectionEmoticons = {
  text: '📝',
  image: '🖼️',
  mask: '🎭',
  video: '🎥',
};

interface BaseNodeProps {
  data: NodeData;
  selected: boolean;
  children?: React.ReactNode;
}

const BaseNode: React.FC<BaseNodeProps> = ({ data, selected, children }) => {
  const getNodeClasses = () => {
    const categoryClasses = {
      [NodeCategory.TEXT]: 'node-text',
      [NodeCategory.IMAGE]: 'node-image',
      [NodeCategory.MASK]: 'node-mask',
      [NodeCategory.VIDEO]: 'node-video',
    };
    
    return clsx(
      'px-3 py-2 rounded-lg border-2 shadow-md',
      categoryClasses[data.category],
      {
        'ring-2 ring-blue-500': selected,
      }
    );
  };
  
  const getTextColor = () => {
    const textColors = {
      [NodeCategory.TEXT]: 'text-node-text',
      [NodeCategory.IMAGE]: 'text-node-image',
      [NodeCategory.VIDEO]: 'text-node-video',
    };
    
    return textColors[data.category];
  };
  
  return (
    <div className={getNodeClasses()}>
      <NodeResizer
        color="#3b82f6"
        isVisible={selected}
        minWidth={200}
        minHeight={100}
        handleStyle={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          backgroundColor: 'currentColor',
          border: '2px solid white',
        }}
      />
      {/* Header */}
      <div className="flex items-center justify-between mb-2 min-h-[28px]">
        <div className="flex items-center space-x-2">
          <span className={clsx('font-semibold', getTextColor())}>{data.label}</span>
        </div>
        <div>
          <span
            className={clsx(
              'text-xs px-1.5 py-0.5 rounded-full',
              data.mode === NodeMode.STATIC ? 'static-badge' : 'gen-badge'
            )}
          >
            {data.mode === NodeMode.STATIC ? 'Static' : 'Gen'}
          </span>
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-hidden">{children}</div>
      
      {/* Inputs */}
      {data.inputs.map((input, index) => (
        <Handle
          isConnectable={true}
          key={input.id}
          type="target"
          position={Position.Top}
          id={input.id}
          style={{
            left: `${((index + 1) * 100) / (data.inputs.length + 1)}%`,
            backgroundColor: 'transparent',
            border: 'none',
            zIndex: 100,
          }}
        >
          <div className={clsx(
            'absolute -translate-y-1/2 -translate-x-1/2 text-base transition-opacity',
            input.connected ? 'opacity-100' : 'opacity-50'
          )}
          title={`${input.type} input${input.maxConnections === Infinity ? ' (multiple)' : ''}`}
          >
            {connectionEmoticons[input.type]}
            {input.maxConnections === Infinity && (
              <span className="absolute -top-1 -right-1 text-[0.6em]">∞</span>
            )}
          </div>
        </Handle>
      ))}
      
      {/* Output */}
      <Handle
        isConnectable={true}
        type="source"
        position={Position.Bottom}
        id={data.output.id}
        style={{
          left: '50%',
          backgroundColor: 'transparent',
          border: 'none',
          zIndex: 100,
        }}
      >
        <div className="absolute translate-y-1/2 -translate-x-1/2 text-base">
          {connectionEmoticons[data.output.type]}
        </div>
      </Handle>
    </div>
  );
};

export default BaseNode;