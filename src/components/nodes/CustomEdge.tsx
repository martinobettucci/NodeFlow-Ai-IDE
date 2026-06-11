import React from 'react';
import { EdgeProps, getSmoothStepPath } from 'reactflow';
import { ConnectionType } from '../../types';

const CustomEdge: React.FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  markerEnd,
}) => {
  const [edgePath] = getSmoothStepPath({
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

    const colors: Record<string, string> = {
      [ConnectionType.TEXT]: 'hsl(var(--node-text))',
      [ConnectionType.IMAGE]: 'hsl(var(--node-image))',
      [ConnectionType.MASK]: 'hsl(var(--node-mask))',
      [ConnectionType.VIDEO]: 'hsl(var(--node-video))',
    };

    return colors[data.type] || '#64748b';
  };

  const color = getEdgeColor();

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