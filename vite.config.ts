import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react', 'node-fetch'],
  },
  resolve: {
    alias: {
      // Redirect node-fetch to use the browser's native fetch
      'node-fetch': 'cross-fetch',
    },
  },
});
