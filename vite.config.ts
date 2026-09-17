/// <reference types="vitest/config" />
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

  /* Here rather than in a vitest.config.ts of its own, so the alias above is the only one
     the tests resolve through. A second config file means a second copy of it, and two
     copies of a path mapping are two things that will eventually disagree.

     No browser environment: the only DOM API the app touches is localStorage, and the
     tests that need it install their own. Adding jsdom for the sake of it would cost a
     dependency, a slower run, and a fake that is harder to make misbehave on purpose. */
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
