import { Suspense, lazy, useEffect, useRef, useState } from 'react';
import './codeblitz-side-effects';
import { CodezTitlebar } from './components/Titlebar';
import { LoadingOverlay } from './components/LoadingOverlay';
import { onWorkspaceChange } from './files/event-bus';
import { loadCurrent, pushRecent, saveCurrent } from './files/recent';
import type { SeedFiles } from './files/types';

const IDE = lazy(() => import('./Ide'));

interface WorkspaceState {
  workspaceDir: string;
  displayName: string;
  /** Only set on the first mount of a freshly-opened folder; undefined after. */
  seed?: SeedFiles;
}

const DEFAULT_WORKSPACE: WorkspaceState = {
  workspaceDir: 'codez-workspace',
  displayName: 'Codez Workspace',
};

export default function App() {
  const [ready, setReady] = useState(false);
  const [workspace, setWorkspace] = useState<WorkspaceState>(() => {
    const persisted = loadCurrent();
    return persisted
      ? { workspaceDir: persisted.workspaceDir, displayName: persisted.displayName }
      : DEFAULT_WORKSPACE;
  });

  // Track the last seen workspace key so we can show the loading overlay
  // again across remounts triggered by switching projects.
  const prevDirRef = useRef(workspace.workspaceDir);

  useEffect(() => {
    if (prevDirRef.current !== workspace.workspaceDir) {
      setReady(false);
      prevDirRef.current = workspace.workspaceDir;
    }
  }, [workspace.workspaceDir]);

  useEffect(
    () =>
      onWorkspaceChange(({ workspaceDir, displayName, seed }) => {
        const next: WorkspaceState = { workspaceDir, displayName, seed };
        const meta = { workspaceDir, displayName, openedAt: Date.now() };
        saveCurrent(meta);
        pushRecent(meta);
        setWorkspace(next);
      }),
    [],
  );

  return (
    <div className="codez-shell">
      <CodezTitlebar workspace={workspace.displayName} />
      <div className="codez-ide">
        {!ready && <LoadingOverlay label="Booting Codez IDE…" />}
        <Suspense fallback={<LoadingOverlay label="Loading editor bundle…" />}>
          <IDE
            key={workspace.workspaceDir}
            workspaceDir={workspace.workspaceDir}
            seed={workspace.seed}
            onReady={() => setReady(true)}
          />
        </Suspense>
      </div>
    </div>
  );
}
