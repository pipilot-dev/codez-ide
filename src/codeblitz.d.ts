// Codeblitz ships its own types but the deep subpath imports
// (`/bundle`, `/languages/*`, `/extensions/*`) aren't always declared. These
// shims keep the TS build green while preserving runtime behavior.
declare module '@codeblitzjs/ide-core/bundle' {
  import type { ComponentType } from 'react';
  export const AppRenderer: ComponentType<{
    appConfig: Record<string, unknown>;
    runtimeConfig?: Record<string, unknown>;
  }>;
  export const SlotRenderer: ComponentType<{ slot: string }>;
}

declare module '@codeblitzjs/ide-core/bundle/codeblitz.css';
declare module '@codeblitzjs/ide-core/languages/*';
declare module '@codeblitzjs/ide-core/extensions/*' {
  const extension: unknown;
  export default extension;
}
