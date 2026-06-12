import React from 'react';
import { Layers } from 'lucide-react';

const AboutTab: React.FC = () => {
  return (
    <div className="text-center">
      <div className="flex justify-center mb-4">
        <Layers className="w-16 h-16 text-blue-500" />
      </div>

      <h2 className="text-2xl font-bold mb-2">NodeFlow AI IDE</h2>
      <p className="text-slate-400 mb-4">
        Version 2.0.0
      </p>

      <p className="text-sm text-slate-300 mb-6">
        The visual node-based IDE for AI workflows, powered exclusively by
        NodeFlow SDK backends.
      </p>

      <div className="bg-slate-800 rounded-lg p-4 mb-6 text-left">
        <h3 className="text-lg font-medium mb-2">Features</h3>
        <ul className="text-sm text-slate-400 space-y-1 list-disc list-inside">
          <li>Build visual workflows from text, image, audio and video nodes</li>
          <li>Connect any NodeFlow SDK backend: its nodes appear in the palette</li>
          <li>RSA-authenticated sessions; API keys stay on the backend</li>
          <li>Run a single node, or the whole workflow in dependency order</li>
          <li>Save and organize your projects locally</li>
        </ul>
      </div>

      <div className="text-sm text-slate-500">
        <p>
          Built with React, TypeScript, and Tailwind CSS.
        </p>
        <p className="mt-1">
          Powered by the NodeFlow SDK.
        </p>
        <p className="mt-4 text-xs">
          Projects are stored locally in your browser. Backends keep their own
          credentials: nothing sensitive ever reaches this app.
        </p>
      </div>
    </div>
  );
};

export default AboutTab;
