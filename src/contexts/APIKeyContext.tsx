import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getApiKeys, saveApiKeys } from '../services/dbService';

interface APIKeyContextType {
  openaiKey: string;
  falaiKey: string;
  setApiKeys: (openaiKey: string, falaiKey: string) => void;
}

const APIKeyContext = createContext<APIKeyContextType | undefined>(undefined);

export const APIKeyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [openaiKey, setOpenaiKey] = useState('');
  const [falaiKey, setFalaiKey] = useState('');
  
  // Load API keys from local storage on mount
  useEffect(() => {
    const keys = getApiKeys();
    setOpenaiKey(keys.openai);
    setFalaiKey(keys.falai);
  }, []);
  
  // Save API keys to local storage
  const handleSetApiKeys = (newOpenaiKey: string, newFalaiKey: string) => {
    saveApiKeys(newOpenaiKey, newFalaiKey);
    setOpenaiKey(newOpenaiKey);
    setFalaiKey(newFalaiKey);
  };
  
  return (
    <APIKeyContext.Provider
      value={{
        openaiKey,
        falaiKey,
        setApiKeys: handleSetApiKeys,
      }}
    >
      {children}
    </APIKeyContext.Provider>
  );
};

export const useApiKeys = (): APIKeyContextType => {
  const context = useContext(APIKeyContext);
  if (context === undefined) {
    throw new Error('useApiKeys must be used within an APIKeyProvider');
  }
  return context;
};