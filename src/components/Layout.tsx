import React, { ReactNode } from 'react';
import { Layers, Settings } from 'lucide-react';
import ProjectSelector from './sidebar/ProjectSelector';

interface LayoutProps {
  children: ReactNode;
  onOpenSettings: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, onOpenSettings }) => {
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <header className="relative flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <Layers className="w-6 h-6 text-blue-500" />
          <h1 className="text-xl font-semibold text-white">NodeFlow</h1>
        </div>
        <div className="flex items-center space-x-4">
          <ProjectSelector />
          <button
            onClick={onOpenSettings}
            className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-hidden">{children}</main>
      </div>
    </div>
  );
};