import { useEffect, useMemo } from 'react';
import { AppRenderer } from '@codeblitzjs/ide-core/bundle';
import { OpenVsxExtensionManagerModule } from '@opensumi/ide-extension-manager/lib/browser';
import { CodezExtensionMarketplaceModule } from './extension-manager/module';
import { CodezTerminalModule } from './terminal/module';

// Curated bundled extensions. Each is a worker/runtime extension shipped with
// codeblitz; adding it to `extensionMetadata` makes it appear as installed.
import typescriptWorker from '@codeblitzjs/ide-core/extensions/codeblitz.typescript-language-features-worker';
import jsonWorker from '@codeblitzjs/ide-core/extensions/codeblitz.json-language-features-worker';
import cssWorker from '@codeblitzjs/ide-core/extensions/codeblitz.css-language-features-worker';
import htmlWorker from '@codeblitzjs/ide-core/extensions/codeblitz.html-language-features-worker';
import markdownWorker from '@codeblitzjs/ide-core/extensions/codeblitz.markdown-language-features-worker';
import emmet from '@codeblitzjs/ide-core/extensions/codeblitz.emmet';
import referencesView from '@codeblitzjs/ide-core/extensions/codeblitz.references-view';
import imagePreview from '@codeblitzjs/ide-core/extensions/codeblitz.image-preview';
import mergeConflict from '@codeblitzjs/ide-core/extensions/codeblitz.merge-conflict';
import gitGraph from '@codeblitzjs/ide-core/extensions/codeblitz.git-graph';
import gitlens from '@codeblitzjs/ide-core/extensions/codeblitz.gitlens';

import { SEED_FILES } from './seed';

interface IdeProps {
  workspaceDir: string;
  onReady?: () => void;
}

// Mirrors codeblitz's default getDefaultLayoutConfig() but extends the `left`
// slot (the activity bar) with SCM (git) and Debug. Note: codeblitz's
// mergeConfig fully replaces `layoutConfig`, so we have to spell out every
// slot the default would have provided.
const layoutConfig = {
  top: { modules: ['@opensumi/ide-menu-bar', 'toolbar'] },
  action: { modules: [''] },
  left: {
    modules: [
      '@opensumi/ide-explorer',
      '@opensumi/ide-search',
      '@opensumi/ide-scm',
      '@opensumi/ide-debug',
      '@opensumi/ide-extension-manager',
    ],
  },
  main: { modules: ['@opensumi/ide-editor'] },
  bottom: {
    modules: [
      'codez-terminal',
      '@opensumi/ide-output',
      'debug-console',
      '@opensumi/ide-markers',
    ],
  },
  statusBar: { modules: ['@opensumi/ide-status-bar'] },
  extra: { modules: ['breadcrumb-menu'] },
};

export default function Ide({ workspaceDir, onReady }: IdeProps) {
  const appConfig = useMemo(
    () => ({
      workspaceDir,
      layoutConfig,
      modules: [
        OpenVsxExtensionManagerModule,
        CodezExtensionMarketplaceModule,
        CodezTerminalModule,
      ],
      extensionMetadata: [
        typescriptWorker,
        jsonWorker,
        cssWorker,
        htmlWorker,
        markdownWorker,
        emmet,
        referencesView,
        imagePreview,
        mergeConflict,
        gitGraph,
        gitlens,
      ],
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
          fs: 'IndexedDB' as const,
          options: { storeName: `codez-${workspaceDir}` },
        },
        initialFileTree: async () => SEED_FILES,
      },
      defaultOpenFile: 'README.md',
      startupEditor: 'readme' as const,
      scenario: 'codez',
    }),
    [workspaceDir],
  );

  useEffect(() => {
    const t = window.setTimeout(() => onReady?.(), 50);
    return () => window.clearTimeout(t);
  }, [onReady]);

  return <AppRenderer appConfig={appConfig} runtimeConfig={runtimeConfig} />;
}
