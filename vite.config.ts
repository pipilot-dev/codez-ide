import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteStaticCopy } from 'vite-plugin-static-copy';

// Codeblitz ships pre-bundled UMD-ish artifacts under @codeblitzjs/ide-core/bundle.
// Its webpack runtime fetches WASM and worker chunks via *relative* URLs from
// the document root (e.g. `/a5d01a41d1b288b6934e.module.wasm`). Vite has no
// reason to expose those node_modules assets at the root, so we mirror them
// here for both `dev` and `build`.
export default defineConfig({
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        {
          src: 'node_modules/@codeblitzjs/ide-core/bundle/*.wasm',
          dest: '.',
          rename: { stripBase: true },
        },
      ],
    }),
  ],
  define: {
    global: 'globalThis',
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV ?? 'development'),
  },
  server: {
    host: true,
    port: 5173,
    // WebContainers (used by the Codez terminal panel) require the page to
    // be cross-origin isolated so it can use SharedArrayBuffer.
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
    },
  },
  preview: {
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
    },
  },
  optimizeDeps: {
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
