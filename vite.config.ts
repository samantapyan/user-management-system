import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Mirrors "paths" in tsconfig.app.json. A leading slash is resolved from the
    // project root, so this needs no Node path helpers and no @types/node.
    alias: { '@': '/src' },
  },
});
