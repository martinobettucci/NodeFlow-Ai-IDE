import React from 'react';
import { Layers } from 'lucide-react';

export const LoadingScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-slate-900 flex flex-col items-center justify-center">
      <div className="flex flex-col items-center">
        <Layers className="w-12 h-12 text-blue-500 mb-4" />
        <h1 className="text-2xl font-bold text-white mb-6">NodeFlow</h1>
        
        <div className="w-32 h-1 bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full bg-blue-500 animate-progress rounded-full"></div>
        </div>
        
        <p className="mt-4 text-slate-400 text-sm">
          Loading your creative canvas...
        </p>
      </div>
    </div>
  );
};

// Add this to your CSS
const progressAnimation = `
@keyframes progress {
  0% {
    width: 0%;
    transform: translateX(-100%);
  }
  50% {
    width: 70%;
  }
  100% {
    width: 100%;
    transform: translateX(100%);
  }
}
.animate-progress {
  animation: progress 2s ease-in-out infinite;
}
`;

// Add the animation to the stylesheet
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.innerHTML = progressAnimation;
  document.head.appendChild(style);
}