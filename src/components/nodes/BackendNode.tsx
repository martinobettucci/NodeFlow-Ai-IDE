import React, { useState } from 'react';
import { Handle, Position, NodeResizer } from 'reactflow';
import { clsx } from 'clsx';
import { Play, Server } from 'lucide-react';
import { NodeCategory } from '../../types';
import { BackendParamType } from '../../services/nodeflow/types';
import { useBackends } from '../../contexts/BackendContext';
import { runBackendNode } from '../../services/nodeflow/executor';

const connectionEmoticons: Record<string, string> = {
  text: '📝',
  image: '🖼️',
  mask: '🎭',
  video: '🎥',
  audio: '🔊',
  json: '🧾',
};

const BackendNode: React.FC<any> = ({ data, selected }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState('');
  const { backends, getClient } = useBackends();

  const backendInfo = data.backend;
  const registered =
    backends.find((b) => b.id === backendInfo?.backendId) ??
    backends.find((b) => b.url === backendInfo?.backendUrl);
  const client = registered ? getClient(registered.id) : undefined;
  const isConnected = registered?.status === 'connected' && client !== undefined;

  const categoryClasses: Record<string, string> = {
    [NodeCategory.TEXT]: 'node-text',
    [NodeCategory.IMAGE]: 'node-image',
    [NodeCategory.MASK]: 'node-mask',
    [NodeCategory.VIDEO]: 'node-video',
  };

  const outputs = data.outputs ?? [data.output];

  const updateParameter = (paramId: string, value: unknown) => {
    data.updateNodeData({
      backend: {
        ...backendInfo,
        parameters: { ...backendInfo.parameters, [paramId]: value },
      },
    });
  };

  const handleRun = async () => {
    if (!client || !backendInfo || isRunning) return;

    setIsRunning(true);
    data.updateNodeData({ generationStatus: 'generating', generationError: undefined });
    try {
      const incoming = data.getIncomingConnections();
      const { results, primaryContent } = await runBackendNode(
        client,
        data,
        incoming,
        setProgress,
      );
      data.updateNodeData({
        results,
        content: primaryContent,
        generationStatus: 'success',
      });
    } catch (error) {
      data.updateNodeData({
        generationStatus: 'error',
        generationError: error instanceof Error ? error.message : 'Run failed',
      });
    } finally {
      setIsRunning(false);
      setProgress('');
    }
  };

  const renderResultPreview = () => {
    const handleId = outputs[0]?.id;
    const result = handleId ? data.results?.[handleId] : undefined;
    const content = result?.content ?? data.content;
    if (!content) return null;
    const mimeType = result?.mimeType ?? 'text/plain';

    if (mimeType.startsWith('image/')) {
      return <img src={content} alt="Output" className="max-h-32 rounded object-contain" />;
    }
    if (mimeType.startsWith('video/')) {
      return <video src={content} controls className="max-h-32 rounded" />;
    }
    if (mimeType.startsWith('audio/')) {
      return <audio src={content} controls className="w-full" />;
    }
    return (
      <pre className="max-h-32 overflow-auto whitespace-pre-wrap break-words p-2 text-xs bg-slate-800 border border-slate-700 rounded">
        {content}
      </pre>
    );
  };

  return (
    <div
      className={clsx(
        'px-3 py-2 rounded-lg border-2 shadow-md',
        categoryClasses[data.category] ?? 'node-text',
        { 'ring-2 ring-blue-500': selected },
      )}
    >
      <NodeResizer
        color="#3b82f6"
        isVisible={selected}
        minWidth={220}
        minHeight={120}
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
        <div className="flex items-center space-x-2" title={backendInfo?.manifest?.description}>
          <Server className="w-4 h-4 text-blue-400" />
          <span className="font-semibold">{data.label}</span>
        </div>
        <span
          className={clsx(
            'text-xs px-1.5 py-0.5 rounded-full gen-badge',
            !isConnected && 'opacity-50',
          )}
          title={registered ? registered.url : 'Backend not registered'}
        >
          {isConnected ? registered?.name ?? 'SDK' : 'offline'}
        </span>
      </div>

      {/* Parameters */}
      {backendInfo?.manifest?.parameters?.length > 0 && (
        <div className="space-y-1 mb-2">
          {backendInfo.manifest.parameters.map((param: any) => (
            <div key={param.id} className="flex items-center justify-between text-xs">
              <span className="text-slate-400 mr-2 truncate" title={param.id}>
                {param.label}
              </span>
              {param.type === BackendParamType.CHECKBOX && (
                <input
                  type="checkbox"
                  className="nodrag"
                  checked={Boolean(backendInfo.parameters[param.id])}
                  onChange={(e) => updateParameter(param.id, e.target.checked)}
                />
              )}
              {param.type === BackendParamType.COMBOBOX && (
                <select
                  className="nodrag bg-slate-800 border border-slate-700 rounded px-1 py-0.5 text-xs"
                  value={String(backendInfo.parameters[param.id] ?? '')}
                  onChange={(e) => updateParameter(param.id, e.target.value)}
                >
                  {(param.options ?? []).map((option: string) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              )}
              {param.type === BackendParamType.NUMBER && (
                <input
                  type="number"
                  step="any"
                  className="nodrag w-20 bg-slate-800 border border-slate-700 rounded px-1 py-0.5 text-xs"
                  value={String(backendInfo.parameters[param.id] ?? '')}
                  onChange={(e) =>
                    updateParameter(
                      param.id,
                      e.target.value === '' ? param.default : Number(e.target.value),
                    )
                  }
                />
              )}
              {param.type === BackendParamType.TEXTBOX && (
                <input
                  type="text"
                  className="nodrag flex-1 min-w-0 bg-slate-800 border border-slate-700 rounded px-1 py-0.5 text-xs"
                  value={String(backendInfo.parameters[param.id] ?? '')}
                  onChange={(e) => updateParameter(param.id, e.target.value)}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Result preview */}
      <div className="flex-1 overflow-hidden mb-2">{renderResultPreview()}</div>

      {/* Run controls */}
      <div className="flex items-center justify-between">
        <button
          onClick={handleRun}
          disabled={!isConnected || isRunning}
          title={!isConnected ? 'Backend offline: connect it in Settings > Backends' : 'Run node'}
          className="flex items-center space-x-1 px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors nodrag"
        >
          <Play className="w-3 h-3" />
          <span>{isRunning ? progress || 'Running...' : 'Run'}</span>
        </button>
        {data.generationStatus === 'error' && (
          <div className="text-xs text-red-400 truncate max-w-[140px]" title={data.generationError}>
            {data.generationError}
          </div>
        )}
      </div>

      {/* Input handles */}
      {data.inputs.map((input: any, index: number) => (
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
          <div
            className={clsx(
              'absolute -translate-y-1/2 -translate-x-1/2 text-base transition-opacity',
              input.connected ? 'opacity-100' : 'opacity-50',
            )}
            title={`${input.label ?? input.type} (${input.type})${
              input.maxConnections === Infinity ? ' (multiple)' : ''
            }`}
          >
            {connectionEmoticons[input.type] ?? '🔌'}
            {input.maxConnections === Infinity && (
              <span className="absolute -top-1 -right-1 text-[0.6em]">∞</span>
            )}
          </div>
        </Handle>
      ))}

      {/* Output handles */}
      {outputs.map((output: any, index: number) => (
        <Handle
          isConnectable={true}
          key={output.id}
          type="source"
          position={Position.Bottom}
          id={output.id}
          style={{
            left: `${((index + 1) * 100) / (outputs.length + 1)}%`,
            backgroundColor: 'transparent',
            border: 'none',
            zIndex: 100,
          }}
        >
          <div
            className="absolute translate-y-1/2 -translate-x-1/2 text-base"
            title={`${output.label ?? output.type} (${output.type})`}
          >
            {connectionEmoticons[output.type] ?? '🔌'}
          </div>
        </Handle>
      ))}
    </div>
  );
};

export default BackendNode;
