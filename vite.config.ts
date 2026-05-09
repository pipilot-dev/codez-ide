import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Codeblitz ships pre-bundled UMD-ish artifacts under @codeblitzjs/ide-core/bundle.
// We mark a few node-style globals as defined so its browser bundle is happy
// inside Vite's ESM dev pipeline.
export default defineConfig({
  plugins: [react()],
  define: {
    global: 'globalThis',
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV ?? 'development'),
  },
  server: {
    host: true,
    port: 5173,
  },
  optimizeDeps: {
    // The codeblitz bundle is large and imports CSS side-effects; let Vite
    // pre-bundle it so HMR stays snappy.
    include: ['@codeblitzjs/ide-core/bundle'],
    esbuildOptions: {
      define: { global: 'globalThis' },
    },
  },
  build: {
    target: 'es2020',
    sourcemap: true,
    chunkSizeWarningLimit: 4096,
  },
});
