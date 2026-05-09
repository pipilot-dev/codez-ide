import { useEffect, useMemo } from 'react';
import { AppRenderer } from '@codeblitzjs/ide-core/bundle';
import typescriptWorker from '@codeblitzjs/ide-core/extensions/codeblitz.typescript-language-features-worker';
import { SEED_FILES } from './seed';

interface IdeProps {
  workspaceDir: string;
  onReady?: () => void;
}

export default function Ide({ workspaceDir, onReady }: IdeProps) {
  const appConfig = useMemo(
    () => ({
      workspaceDir,
      // Language-feature extensions running in workers — gives intellisense,
      // go-to-definition, and diagnostics for TS/JS without a backend.
      extensionMetadata: [typescriptWorker],
      defaultPreferences: {
        'general.theme': 'opensumi-dark',
        'general.icon': 'vsicons-slim',
        'editor.fontSize': 13,
        'editor.fontFamily':
          "'JetBrains Mono', 'Fira Code', Menlo, Monaco, 'Courier New', monospace",
        'editor.fontLigatures': true,
        'editor.minimap.enabled': true,
        'editor.wordWrap': 'on',
        'files.autoSave': 'afterDelay',
        'workbench.colorTheme': 'Default Dark+',
      },
    }),
    [workspaceDir],
  );

  const runtimeConfig = useMemo(
    () => ({
      workspace: {
        filesystem: {
          // Persist the workspace across page reloads via IndexedDB.
          fs: 'IndexedDB' as const,
          options: { storeName: `codez-${workspaceDir}` },
        },
        // Seed the workspace on first boot. After that the user's edits in
        // IndexedDB take precedence and we no-op.
        initialFileTree: async () => SEED_FILES,
      },
      defaultOpenFile: 'README.md',
      startupEditor: 'readme' as const,
      scenario: 'codez',
    }),
    [workspaceDir],
  );

  useEffect(() => {
    // AppRenderer doesn't expose an onReady, but mounting it is synchronous
    // enough that one tick later the workbench DOM is in place. Good enough
    // to drop the loading overlay.
    const t = window.setTimeout(() => onReady?.(), 50);
    return () => window.clearTimeout(t);
  }, [onReady]);

  return <AppRenderer appConfig={appConfig} runtimeConfig={runtimeConfig} />;
}
