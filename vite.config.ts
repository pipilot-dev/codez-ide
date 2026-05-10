import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { viteStaticCopy } from 'vite-plugin-static-copy';

// @opensumi/monaco-editor-core/esm/vs/nls.js does a CommonJS
// `require('../nls.messages.zh-cn.json')` at module top level. In Vite's
// ESM dev runtime that throws "require is not defined". The bundle only
// uses zhCnBundle when locale === 'zh-cn'; we force en-US, so replacing
// the require with an empty object is safe and avoids the runtime crash.
function stripMonacoNlsRequire(): Plugin {
  return {
    name: 'codez:strip-monaco-nls-require',
    enforce: 'pre',
    transform(code, id) {
      if (
        id.includes('@opensumi/monaco-editor-core') &&
        id.endsWith('/esm/vs/nls.js') &&
        code.includes('zhCnBundle')
      ) {
        return code.replace(
          /const\s+zhCnBundle\s*=\s*require\([^)]+\);?/,
          'const zhCnBundle = {};',
        );
      }
      return undefined;
    },
  };
}

// Codeblitz ships pre-bundled UMD-ish artifacts under @codeblitzjs/ide-core/bundle.
// Its webpack runtime fetches WASM and worker chunks via *relative* URLs from
// the document root (e.g. `/a5d01a41d1b288b6934e.module.wasm`). Vite has no
// reason to expose those node_modules assets at the root, so we mirror them
// here for both `dev` and `build`.
export default defineConfig({
  plugins: [
    stripMonacoNlsRequire(),
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
