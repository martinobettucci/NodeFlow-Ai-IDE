import React, { useState } from 'react';
import { Plug, PlugZap, RefreshCw, Trash2 } from 'lucide-react';
import { useBackends } from '../../contexts/BackendContext';

const statusStyles: Record<string, string> = {
  connected: 'bg-green-500/20 text-green-400',
  connecting: 'bg-yellow-500/20 text-yellow-400',
  disconnected: 'bg-slate-600/30 text-slate-400',
  error: 'bg-red-500/20 text-red-400',
};

const BackendsTab: React.FC = () => {
  const { backends, addBackend, removeBackend, connectBackend, disconnectBackend } = useBackends();
  const [url, setUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const handleAdd = async () => {
    if (!url.trim() || isAdding) return;
    setIsAdding(true);
    setAddError(null);
    try {
      await addBackend(url, undefined, apiKey);
      setUrl('');
      setApiKey('');
    } catch (error) {
      setAddError(error instanceof Error ? error.message : 'Failed to add backend');
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-400">
        Register NodeFlow SDK backends by URL. Connected backends expose their
        nodes in the palette; data is exchanged over an RSA-authenticated session.
      </p>

      <div className="flex space-x-2">
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="http://localhost:8000"
          className="flex-1 px-3 py-2 text-sm bg-slate-800 border border-slate-700 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <button
          onClick={handleAdd}
          disabled={isAdding || !url.trim()}
          className="px-3 py-2 text-sm bg-blue-600 hover:bg-blue-700 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isAdding ? 'Connecting...' : 'Add'}
        </button>
      </div>
      <input
        type="password"
        value={apiKey}
        onChange={(e) => setApiKey(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
        placeholder="API key (optional, for gateways; stored locally)"
        autoComplete="off"
        className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-700 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
      {addError && <div className="text-xs text-red-400">{addError}</div>}

      <div className="space-y-2">
        {backends.length === 0 && (
          <div className="text-sm text-slate-500 p-3 bg-slate-800/50 rounded">
            No backends registered yet. Start one with{' '}
            <code className="text-slate-300">nodeflowsdk serve --port 8000</code>{' '}
            and add its URL above.
          </div>
        )}
        {backends.map((backend) => (
          <div
            key={backend.id}
            className="flex items-center justify-between p-3 bg-slate-800 rounded border border-slate-700"
          >
            <div className="min-w-0 mr-2">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium truncate">{backend.name}</span>
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-full ${
                    statusStyles[backend.status] ?? statusStyles.disconnected
                  }`}
                >
                  {backend.status}
                </span>
              </div>
              <div className="text-xs text-slate-400 truncate">{backend.url}</div>
              {backend.status === 'connected' && (
                <div className="text-xs text-slate-500">
                  {backend.manifests.length} node{backend.manifests.length === 1 ? '' : 's'}
                </div>
              )}
              {backend.error && (
                <div className="text-xs text-red-400 truncate" title={backend.error}>
                  {backend.error}
                </div>
              )}
            </div>
            <div className="flex items-center space-x-1 shrink-0">
              {backend.status === 'connected' ? (
                <button
                  onClick={() => disconnectBackend(backend.id)}
                  title="Disconnect"
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors"
                >
                  <PlugZap className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => connectBackend(backend.id)}
                  title="Connect"
                  disabled={backend.status === 'connecting'}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors disabled:opacity-50"
                >
                  {backend.status === 'connecting' ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plug className="w-4 h-4" />
                  )}
                </button>
              )}
              <button
                onClick={() => removeBackend(backend.id)}
                title="Remove backend"
                className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BackendsTab;
