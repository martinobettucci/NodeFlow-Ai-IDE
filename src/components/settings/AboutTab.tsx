import React from 'react';
import { Layers } from 'lucide-react';

const AboutTab: React.FC = () => {
  return (
    <div className="text-center">
      <div className="flex justify-center mb-4">
        <Layers className="w-16 h-16 text-blue-500" />
      </div>
      
      <h2 className="text-2xl font-bold mb-2">NodeFlow</h2>
      <p className="text-slate-400 mb-4">
        Version 1.0.0
      </p>
      
      <p className="text-sm text-slate-300 mb-6">
        A node-based image and video generation software powered by cutting-edge AI technologies.
      </p>
      
      <div className="bg-slate-800 rounded-lg p-4 mb-6 text-left">
        <h3 className="text-lg font-medium mb-2">Features</h3>
        <ul className="text-sm text-slate-400 space-y-1 list-disc list-inside">
          <li>Create complex visual workflows with nodes</li>
          <li>Generate images with OpenAI</li>
          <li>Generate videos with FAL.AI</li>
          <li>Connect nodes to create powerful generation chains</li>
          <li>Save and organize your projects</li>
        </ul>
      </div>
      
      <div className="text-sm text-slate-500">
        <p>
          Built with React, TypeScript, and Tailwind CSS.
        </p>
        <p className="mt-1">
          Powered by OpenAI and FAL.AI.
        </p>
        <p className="mt-4 text-xs">
          Data is stored locally in your browser. API keys are required for AI features.
        </p>
      </div>
    </div>
  );
};

export default AboutTab;