import React, { useState, useEffect } from 'react';
import { useApiKeys } from '../../contexts/APIKeyContext';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import { testApiKey } from '../../services/apiService';

interface APIKeysTabProps {
  onClose: () => void;
}

const APIKeysTab: React.FC<APIKeysTabProps> = ({ onClose }) => {
  const { openaiKey, falaiKey, setApiKeys } = useApiKeys();
  
  const [openaiKeyInput, setOpenaiKeyInput] = useState(openaiKey);
  const [falaiKeyInput, setFalaiKeyInput] = useState(falaiKey);
  const [showOpenaiKey, setShowOpenaiKey] = useState(false);
  const [showFalaiKey, setShowFalaiKey] = useState(false);
  
  const [openaiKeyValid, setOpenaiKeyValid] = useState<boolean | null>(null);
  const [falaiKeyValid, setFalaiKeyValid] = useState<boolean | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  
  // Set initial state
  useEffect(() => {
    setOpenaiKeyInput(openaiKey);
    setFalaiKeyInput(falaiKey);
  }, [openaiKey, falaiKey]);
  
  // Save API keys
  const handleSave = async () => {
    setIsValidating(true);
    
    let hasError = false;
    
    try {
      // Validate OpenAI API key
      const openaiValid = await testApiKey('openai', openaiKeyInput);
      setOpenaiKeyValid(openaiValid);
      if (!openaiValid) {
        hasError = true;
      }
      
      // Validate FAL.AI API key
      const falaiValid = await testApiKey('falai', falaiKeyInput);
      setFalaiKeyValid(falaiValid);
      if (!falaiValid) {
        hasError = true;
      }
      
      // Only save if both keys are valid
      if (!hasError) {
        setApiKeys(openaiKeyInput, falaiKeyInput);
        onClose();
      }
    } catch (error) {
      console.error('Error validating API keys:', error);
      setOpenaiKeyValid(false);
      setFalaiKeyValid(false);
    } finally {
      setIsValidating(false);
    }
  };
  
  return (
    <div>
      <p className="text-sm text-slate-400 mb-4">
        Enter your API keys to enable AI-powered features. These keys are stored locally in your browser.
      </p>
      
      {/* OpenAI API Key */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">
          OpenAI API Key
        </label>
        <div className="relative">
          <input
            type={showOpenaiKey ? 'text' : 'password'}
            value={openaiKeyInput}
            onChange={(e) => {
              setOpenaiKeyInput(e.target.value);
              setOpenaiKeyValid(null);
            }}
            className={`w-full p-2 pr-10 text-sm bg-slate-800 border ${
              openaiKeyValid === false
                ? 'border-red-500'
                : openaiKeyValid === true
                ? 'border-green-500'
                : 'border-slate-700'
            } rounded focus:outline-none focus:ring-1 focus:ring-blue-500`}
            placeholder="sk-..."
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 px-3 text-slate-400 hover:text-white"
            onClick={() => setShowOpenaiKey(!showOpenaiKey)}
          >
            {showOpenaiKey ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        </div>
        {openaiKeyValid === false && (
          <p className="text-xs text-red-400 mt-1 flex items-center">
            <AlertCircle className="w-3 h-3 mr-1" />
            Invalid OpenAI API key. Please check and try again.
          </p>
        )}
        <p className="text-xs text-slate-500 mt-1">
          Get your OpenAI API key at{' '}
          <a
            href="https://platform.openai.com/api-keys"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:underline"
          >
            platform.openai.com/api-keys
          </a>
        </p>
      </div>
      
      {/* FAL.AI API Key */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-1">
          FAL.AI API Key
        </label>
        <div className="relative">
          <input
            type={showFalaiKey ? 'text' : 'password'}
            value={falaiKeyInput}
            onChange={(e) => {
              setFalaiKeyInput(e.target.value);
              setFalaiKeyValid(null);
            }}
            className={`w-full p-2 pr-10 text-sm bg-slate-800 border ${
              falaiKeyValid === false
                ? 'border-red-500'
                : falaiKeyValid === true
                ? 'border-green-500'
                : 'border-slate-700'
            } rounded focus:outline-none focus:ring-1 focus:ring-blue-500`}
            placeholder="Your FAL.AI key..."
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 px-3 text-slate-400 hover:text-white"
            onClick={() => setShowFalaiKey(!showFalaiKey)}
          >
            {showFalaiKey ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        </div>
        {falaiKeyValid === false && (
          <p className="text-xs text-red-400 mt-1 flex items-center">
            <AlertCircle className="w-3 h-3 mr-1" />
            Invalid FAL.AI API key. Please check and try again.
          </p>
        )}
        <p className="text-xs text-slate-500 mt-1">
          Get your FAL.AI API key at{' '}
          <a
            href="https://fal.ai/dashboard/keys"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:underline"
          >
            fal.ai/dashboard/keys
          </a>
        </p>
      </div>
      
      <div className="flex justify-end space-x-3">
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={isValidating || !openaiKeyInput || !falaiKeyInput}
          className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isValidating ? (
            <>
              <span className="mr-2">Validating...</span>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            </>
          ) : (
            'Save Keys'
          )}
        </button>
      </div>
    </div>
  );
};

export default APIKeysTab;