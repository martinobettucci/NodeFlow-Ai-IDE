import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  NodeTypes,
  EdgeTypes,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { useProject } from '../contexts/ProjectContext';
import { useBackends } from '../contexts/BackendContext';
import { NodeType, ConnectionType } from '../types';
import { createNode, createBackendNode } from '../utils/projectUtils';
import TextNode from './nodes/TextNode';
import ImageNode from './nodes/ImageNode';
import VideoNode from './nodes/VideoNode';
import BackendNode from './nodes/BackendNode';
import CustomEdge from './nodes/CustomEdge';
import NodePalette from './sidebar/NodePalette';
import NodeProperties from './sidebar/NodeProperties';

const NodeEditor: React.FC = () => {
  const { currentProject, updateProject } = useProject();
  const { backends } = useBackends();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<string | null>(null);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  
  // Memoize node types and edge types
  const nodeTypes = useMemo<NodeTypes>(() => ({
    [NodeType.TEXT_STATIC]: TextNode,
    [NodeType.TEXT_GENERATED]: TextNode,
    [NodeType.IMAGE_STATIC]: ImageNode,
    [NodeType.IMAGE_GENERATED]: ImageNode,
    [NodeType.VIDEO_STATIC]: VideoNode,
    [NodeType.VIDEO_GENERATED]: VideoNode,
    [NodeType.BACKEND]: BackendNode,
  }), []);
  
  const edgeTypes = useMemo<EdgeTypes>(() => ({
    default: CustomEdge,
  }), []);

  // Update connection status for all nodes
  const updateConnectionStatus = useCallback(() => {
    setNodes((nds) =>
      nds.map((node) => {
        const updatedInputs = node.data.inputs.map((input: any) => ({
          ...input,
          connected: edges.some(
            (edge) =>
              edge.target === node.id && edge.targetHandle === input.id
          ),
        }));
        
        // Only update if inputs have actually changed
        if (JSON.stringify(updatedInputs) === JSON.stringify(node.data.inputs)) {
          return node;
        }
        
        return {
          ...node,
          data: {
            ...node.data,
            inputs: updatedInputs,
          },
        };
      })
    );
  }, [edges, setNodes]);

  // Update connection status whenever edges change
  useEffect(() => {
    updateConnectionStatus();
  }, [edges, updateConnectionStatus]);

  // Function to get connected inputs for a node
  const getConnectedInputs = useCallback((nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return [];
    
    // Find connected edges for this node's inputs
    const connectedInputIds = node.data.inputs
      .filter((input: any) => input.connected)
      .map((input: any) => input.id);
    
    if (connectedInputIds.length === 0) return [];
    
    // Find edges connected to these inputs
    const connectedEdges = nodes
      .filter(n => n.id !== nodeId)
      .flatMap(n => {
        const edgesToThisNode = edges.filter(edge => 
          edge.target === nodeId && 
          connectedInputIds.includes(edge.targetHandle) &&
          edge.source === n.id
        );
        
        if (edgesToThisNode.length > 0) {
          return [n.data];
        }
        return [];
      });
    
    return connectedEdges;
  }, [nodes, edges]);

  // Resolve incoming connections of a node with their handles and source data,
  // so backend nodes can map each connected input to the right SDK input spec.
  const getIncomingConnections = useCallback((nodeId: string) => {
    return edges
      .filter(edge => edge.target === nodeId)
      .flatMap(edge => {
        const sourceNode = nodes.find(n => n.id === edge.source);
        if (!sourceNode) return [];
        return [{
          targetHandle: edge.targetHandle || '',
          sourceHandle: edge.sourceHandle || '',
          source: sourceNode.data,
        }];
      });
  }, [nodes, edges]);

  // Function to update node data
  const updateNodeData = useCallback((nodeId: string, updates: Record<string, any>) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          // Only update if data has actually changed
          if (JSON.stringify(node.data) === JSON.stringify({ ...node.data, ...updates })) {
            return node;
          }
          
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
  }, [setNodes]);
  
  // Load project data
  useEffect(() => {
    if (currentProject) {
      // Convert project nodes to ReactFlow format
      const flowNodes = currentProject.nodes.map(node => ({
        id: node.id,
        type: node.type,
        position: {
          x: node.position.x,
          y: node.position.y,
        },
        style: {
          width: node.position.width || 250,
          height: node.position.height || 200,
        },
        data: {
          ...node,
          updateNodeData: (updates: Record<string, any>) => updateNodeData(node.id, updates),
          getConnectedInputs: () => getConnectedInputs(node.id),
          getIncomingConnections: () => getIncomingConnections(node.id),
        },
      }));
      
      // Convert project connections to ReactFlow edges
      const flowEdges = currentProject.connections.map(conn => ({
        id: conn.id,
        source: conn.source,
        sourceHandle: conn.sourceHandle,
        target: conn.target,
        targetHandle: conn.targetHandle,
        type: 'default',
        data: { type: conn.type },
      }));
      
      setNodes(flowNodes);
      setEdges(flowEdges);
    }
  }, [currentProject, setNodes, setEdges]);

  // Save changes to project
  const saveChanges = useCallback(() => {
    if (currentProject && nodes.length > 0) {
      // Create clean copies for comparison
      const cleanNodes = nodes.map(node => {
        const { updateNodeData, getConnectedInputs, getIncomingConnections, ...cleanData } = node.data;
        // Include node dimensions in position data
        cleanData.position = {
          x: node.position.x,
          y: node.position.y,
          width: node.style?.width || 250,
          height: node.style?.height || 200,
        };
        return cleanData;
      });
      
      const cleanConnections = edges.map(edge => ({
        id: edge.id,
        source: edge.source,
        sourceHandle: edge.sourceHandle || '',
        target: edge.target,
        targetHandle: edge.targetHandle || '',
        type: (edge.data?.type as ConnectionType) || ConnectionType.TEXT,
      }));
      
      // Only update if data has actually changed
      if (
        JSON.stringify(cleanNodes) === JSON.stringify(currentProject.nodes) &&
        JSON.stringify(cleanConnections) === JSON.stringify(currentProject.connections)
      ) {
        return;
      }
      
      // Clean up node data before saving
      updateProject({
        ...currentProject,
        nodes: cleanNodes,
        connections: cleanConnections,
      });
    }
  }, [currentProject, nodes, edges, updateProject]);

  // Auto-save changes when nodes or edges change
  useEffect(() => {
    if (nodes.length > 0 || edges.length > 0) {
      const timeoutId = setTimeout(() => {
        saveChanges();
      }, 500);
      
      return () => clearTimeout(timeoutId);
    }
  }, [nodes, edges, saveChanges]);

  // Handle node selection
  const onNodeClick = useCallback((_: React.MouseEvent, node: any) => {
    setSelectedNode(node.id);
  }, []);

  // Handle node deletion
  const onNodesDelete = useCallback((deleted: any[]) => {
    const deletedIds = deleted.map(node => node.id);
    setEdges(eds => eds.filter(edge => 
      !deletedIds.includes(edge.source) && !deletedIds.includes(edge.target)
    ));
  }, [setEdges]);

  // Handle background click to deselect nodes
  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
    setSelectedEdge(null);
  }, []);

  // Handle edge selection
  const onEdgeClick = useCallback((_: React.MouseEvent, edge: Edge) => {
    setSelectedEdge(edge.id);
  }, []);

  // Handle new edge connections
  const onConnect = useCallback(
    (connection: Connection) => {
      // Find source and target nodes
      const sourceNode = nodes.find(n => n.id === connection.source);
      const targetNode = nodes.find(n => n.id === connection.target);
      
      if (sourceNode && targetNode) {
        // Backend nodes can expose several outputs; resolve by handle.
        const sourceOutputs = sourceNode.data.outputs ?? [sourceNode.data.output];
        const sourceOutput = sourceOutputs.find(
          (o: any) => o.id === connection.sourceHandle
        ) ?? sourceNode.data.output;
        const targetInput = targetNode.data.inputs.find(
          (i: any) => i.id === connection.targetHandle
        );
        
        // Check if we can add another connection to this input
        const existingConnections = edges.filter(
          edge => edge.target === targetNode.id && edge.targetHandle === targetInput?.id
        ).length;
        
        if (targetInput?.maxConnections !== undefined && 
            existingConnections >= targetInput.maxConnections) {
          console.warn('Maximum connections reached for this input');
          return;
        }
        
        // Only allow connection if types are compatible
        if (
          sourceOutput && targetInput &&
          sourceOutput.type === targetInput.type &&
          connection.source && connection.target
        ) {
          // Create edge with correct type
          const edge: Edge = {
            ...connection,
            source: connection.source,
            target: connection.target,
            id: `e${connection.source}-${connection.target}-${Date.now()}`,
            data: { type: sourceOutput.type },
          };
          
          setEdges(eds => addEdge(edge, eds));
          
          // Update target node input connection status
          const updatedNodes = nodes.map(node => {
            if (node.id === targetNode.id) {
              const updatedInputs = node.data.inputs.map((input: any) => {
                if (input.id === connection.targetHandle) {
                  return { ...input, connected: true };
                }
                return input;
              });
              
              return {
                ...node,
                data: {
                  ...node.data,
                  inputs: updatedInputs,
                },
              };
            }
            return node;
          });
          
          setNodes(updatedNodes);
        }
      }
    },
    [nodes, setEdges, setNodes, edges]
  );

  // Handle edge removal
  const onEdgesDelete = useCallback(
    (deletedEdges: Edge[]) => {
      // Update target node input connection status
      const updatedNodes = nodes.map(node => {
        const affectedEdges = deletedEdges.filter(e => e.target === node.id);
        
        if (affectedEdges.length > 0) {
          const updatedInputs = node.data.inputs.map((input: any) => {
            const isDisconnected = affectedEdges.some(
              e => e.targetHandle === input.id
            );
            
            if (isDisconnected) {
              return { ...input, connected: false };
            }
            return input;
          });
          
          return {
            ...node,
            data: {
              ...node.data,
              inputs: updatedInputs,
            },
          };
        }
        return node;
      });
      
      setNodes(updatedNodes);
    },
    [nodes, setNodes]
  );

  // Handle node drag & drop from palette
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      if (!reactFlowWrapper.current || !reactFlowInstance) {
        return;
      }

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      // Create the new node: either a NodeFlow backend node or a built-in one
      let newNode = null;
      const backendPayload = event.dataTransfer.getData('application/nodeflow-backend');
      if (backendPayload) {
        try {
          const { backendId, nodeId } = JSON.parse(backendPayload);
          const backend = backends.find(b => b.id === backendId);
          const manifest = backend?.manifests.find(m => m.id === nodeId);
          if (backend && manifest) {
            newNode = createBackendNode(backend.id, backend.url, manifest, position);
          }
        } catch (error) {
          console.error('Invalid backend node payload:', error);
        }
      } else {
        const type = event.dataTransfer.getData('application/nodeType') as NodeType;
        if (typeof type === 'string' && type) {
          newNode = createNode(type, position);
        }
      }

      if (!newNode) {
        return;
      }
      const createdNode = newNode;

      // Add node to state
      setNodes(nds => {
        const nodeWithFunctions = {
          ...createdNode,
          updateNodeData: (updates: Record<string, any>) => updateNodeData(createdNode.id, updates),
          getConnectedInputs: () => getConnectedInputs(createdNode.id),
          getIncomingConnections: () => getIncomingConnections(createdNode.id),
        };

        return [
          ...nds,
          {
            id: createdNode.id,
            type: createdNode.type,
            position: createdNode.position,
            data: nodeWithFunctions,
          },
        ];
      });

      // Select the new node
      setSelectedNode(createdNode.id);
    },
    [reactFlowInstance, setNodes, backends, updateNodeData, getConnectedInputs, getIncomingConnections]
  );

  return (
    <div className="flex h-full">
      {/* Node Palette */}
      <div className="w-64 bg-slate-900 border-r border-slate-800 overflow-y-auto">
        <NodePalette />
      </div>
      
      {/* Main Editor */}
      <div className="flex-1 flex flex-col h-full">
        <div ref={reactFlowWrapper} className="flex-1">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onNodesDelete={onNodesDelete}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onEdgesDelete={onEdgesDelete}
            onEdgeClick={onEdgeClick}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            onInit={setReactFlowInstance}
            onDrop={onDrop}
            onDragOver={onDragOver}
            fitView
            snapToGrid
            snapGrid={[20, 20]}
            defaultViewport={{ x: 0, y: 0, zoom: 1.5 }}
          >
            <Controls />
            <MiniMap
              nodeStrokeColor="#374151"
              nodeColor="#1e293b"
              nodeBorderRadius={2}
            />
            <Background color="#64748b" gap={20} size={1} />
          </ReactFlow>
        </div>
        
        {/* Edge Delete Button */}
        {selectedEdge && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-slate-800 rounded-lg shadow-lg border border-slate-700 p-2">
            <button
              onClick={() => {
                setEdges(eds => eds.filter(e => e.id !== selectedEdge));
                setSelectedEdge(null);
              }}
              className="flex items-center space-x-2 px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded transition-colors"
            >
              <span>Delete Connection</span>
            </button>
          </div>
        )}
      </div>
      
      {/* Properties Panel */}
      <div className="w-72 bg-slate-900 border-l border-slate-800 overflow-y-auto">
        <NodeProperties
          nodeId={selectedNode}
          nodes={nodes}
          setNodes={setNodes}
        />
      </div>
    </div>
  );
};

export default NodeEditor;