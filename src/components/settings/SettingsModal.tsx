import React, { useState } from 'react';
import { X } from 'lucide-react';
import BackendsTab from './BackendsTab';
import AboutTab from './AboutTab';

type Tab = 'backends' | 'about';

interface SettingsModalProps {
  initialTab?: Tab;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  initialTab = 'backends',
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="w-full max-w-lg bg-slate-900 rounded-lg shadow-lg overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <h2 className="text-xl font-semibold">Settings</h2>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex border-b border-slate-800">
          <button
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === 'backends'
                ? 'text-blue-500 border-b-2 border-blue-500'
                : 'text-slate-400 hover:text-slate-300'
            }`}
            onClick={() => setActiveTab('backends')}
          >
            Backends
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === 'about'
                ? 'text-blue-500 border-b-2 border-blue-500'
                : 'text-slate-400 hover:text-slate-300'
            }`}
            onClick={() => setActiveTab('about')}
          >
            About
          </button>
        </div>

        <div className="p-4">
          {activeTab === 'backends' && <BackendsTab />}
          {activeTab === 'about' && <AboutTab />}
        </div>
      </div>
    </div>
  );
};
