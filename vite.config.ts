import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Dependencies change far less often than this app does, so they go in their own chunks. A
 * deploy then invalidates the application chunk and leaves the cached copies of React and
 * MUI alone.
 */
function vendorChunk(id: string): string | undefined {
  // Separators are normalised first, so the patterns below do not need to care whether
  // this is running on Windows.
  const path = id.split('\\').join('/');

  if (!path.includes('/node_modules/')) {
    return undefined;
  }
  if (/\/node_modules\/(react|react-dom|react-router|scheduler)\//.test(path)) {
    return 'react';
  }
  if (/\/node_modules\/(@mui|@emotion|@popperjs)\//.test(path)) {
    return 'mui';
  }
  return 'vendor';
}

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Mirrors "paths" in tsconfig.app.json. A leading slash is resolved from the project
    // root, so this needs no Node path helpers and no @types/node.
    alias: { '@': '/src' },
  },
  build: {
    rollupOptions: {
      output: { manualChunks: vendorChunk },
    },
  },
});
