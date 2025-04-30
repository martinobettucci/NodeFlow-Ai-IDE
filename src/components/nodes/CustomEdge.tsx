import React from 'react';
import { EdgeProps, getSmoothStepPath, EdgeLabelRenderer } from 'reactflow';
import { ConnectionType } from '../../types';

const CustomEdge: React.FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  data,
  markerEnd,
}) => {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });
  
  // Get color based on connection type
  const getEdgeColor = () => {
    if (!data || !data.type) return '#64748b';
    
    const colors = {
      [ConnectionType.TEXT]: 'hsl(var(--node-text))',
      [ConnectionType.IMAGE]: 'hsl(var(--node-image))',
      [ConnectionType.MASK]: 'hsl(var(--node-mask))',
      [ConnectionType.VIDEO]: 'hsl(var(--node-video))',
    };
    
    return colors[data.type] || '#64748b';
    switch (data.type) {
      case ConnectionType.TEXT:
        return 'hsl(var(--node-text))';
      case ConnectionType.IMAGE:
        return 'hsl(var(--node-image))';
      case ConnectionType.MASK:
        return 'hsl(var(--node-mask))';
      case ConnectionType.VIDEO:
        return 'hsl(var(--node-video))';
      default:
        return '#64748b';
    }
  };
  
  const color = getEdgeColor();
  
  const labelStyle: React.CSSProperties = {
    transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
    fontSize: '10px',
    pointerEvents: 'all',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: '2px 4px',
    borderRadius: '4px',
    color: 'white',
    fontWeight: 'bold',
  };
  
  return (
    <>
      <path
        id={id}
        className="react-flow__edge-path"
        d={edgePath}
        strokeWidth={2}
        stroke={color}
        markerEnd={markerEnd}
      />
    </>
  );
};

export default CustomEdge;