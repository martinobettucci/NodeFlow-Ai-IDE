import React, { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { nanoid } from 'nanoid';
import { NodeFlowClient } from '../services/nodeflow/client';
import { RegisteredBackend } from '../services/nodeflow/types';

const STORAGE_KEY = 'nodeflow_backends';

interface BackendContextType {
  backends: RegisteredBackend[];
  addBackend: (url: string, name?: string, apiKey?: string) => Promise<void>;
  removeBackend: (id: string) => void;
  connectBackend: (id: string) => Promise<void>;
  disconnectBackend: (id: string) => Promise<void>;
  getClient: (id: string) => NodeFlowClient | undefined;
}

const BackendContext = createContext<BackendContextType | undefined>(undefined);

function loadStoredBackends(): RegisteredBackend[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as {
      id: string;
      url: string;
      name: string;
      apiKey?: string;
    }[];
    return parsed.map((b) => ({
      ...b,
      status: 'disconnected' as const,
      manifests: [],
    }));
  } catch {
    return [];
  }
}

function persistBackends(backends: RegisteredBackend[]): void {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(backends.map(({ id, url, name, apiKey }) => ({ id, url, name, apiKey }))),
  );
}

export const BackendProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [backends, setBackends] = useState<RegisteredBackend[]>(loadStoredBackends);
  const clientsRef = useRef<Map<string, NodeFlowClient>>(new Map());

  const updateBackend = (id: string, updates: Partial<RegisteredBackend>) => {
    setBackends((prev) => prev.map((b) => (b.id === id ? { ...b, ...updates } : b)));
  };

  const connectById = async (id: string, url: string, apiKey?: string) => {
    updateBackend(id, { status: 'connecting', error: undefined });
    try {
      const client = new NodeFlowClient(url, apiKey);
      await client.handshake();
      const manifests = await client.listNodes();
      clientsRef.current.set(id, client);
      updateBackend(id, { status: 'connected', manifests });
    } catch (error) {
      clientsRef.current.delete(id);
      updateBackend(id, {
        status: 'error',
        manifests: [],
        error: error instanceof Error ? error.message : 'Connection failed',
      });
      throw error;
    }
  };

  const addBackend = async (url: string, name?: string, apiKey?: string) => {
    const trimmed = url.trim().replace(/\/+$/, '');
    if (!trimmed) return;
    const trimmedKey = apiKey?.trim() || undefined;
    const existing = backends.find((b) => b.url === trimmed);
    if (existing) {
      if (trimmedKey !== existing.apiKey) {
        updateBackend(existing.id, { apiKey: trimmedKey });
      }
      await connectById(existing.id, existing.url, trimmedKey ?? existing.apiKey);
      return;
    }

    const backend: RegisteredBackend = {
      id: nanoid(8),
      url: trimmed,
      name: name?.trim() || new URL(trimmed).host,
      apiKey: trimmedKey,
      status: 'disconnected',
      manifests: [],
    };
    setBackends((prev) => [...prev, backend]);
    await connectById(backend.id, backend.url, backend.apiKey).catch(() => {
      // Status/error already recorded on the backend entry.
    });
  };

  const removeBackend = (id: string) => {
    const client = clientsRef.current.get(id);
    if (client) {
      client.destroySession().catch(() => undefined);
      clientsRef.current.delete(id);
    }
    setBackends((prev) => prev.filter((b) => b.id !== id));
  };

  const connectBackend = async (id: string) => {
    const backend = backends.find((b) => b.id === id);
    if (!backend) return;
    await connectById(id, backend.url, backend.apiKey).catch(() => undefined);
  };

  const disconnectBackend = async (id: string) => {
    const client = clientsRef.current.get(id);
    if (client) {
      await client.destroySession().catch(() => undefined);
      clientsRef.current.delete(id);
    }
    updateBackend(id, { status: 'disconnected', manifests: [] });
  };

  const getClient = (id: string) => clientsRef.current.get(id);

  // Persist the registered backend list (not the volatile session state).
  useEffect(() => {
    persistBackends(backends);
  }, [backends]);

  // Reconnect known backends once on startup.
  useEffect(() => {
    loadStoredBackends().forEach((backend) => {
      connectById(backend.id, backend.url, backend.apiKey).catch(() => undefined);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <BackendContext.Provider
      value={{
        backends,
        addBackend,
        removeBackend,
        connectBackend,
        disconnectBackend,
        getClient,
      }}
    >
      {children}
    </BackendContext.Provider>
  );
};

export const useBackends = (): BackendContextType => {
  const context = useContext(BackendContext);
  if (context === undefined) {
    throw new Error('useBackends must be used within a BackendProvider');
  }
  return context;
};
