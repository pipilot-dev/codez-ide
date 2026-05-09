import { Suspense, lazy, useMemo, useState } from 'react';
import './codeblitz-side-effects';
import { CodezTitlebar } from './components/Titlebar';
import { LoadingOverlay } from './components/LoadingOverlay';

const IDE = lazy(() => import('./Ide'));

export default function App() {
  const [ready, setReady] = useState(false);

  // The workspace name shows up in the IDE chrome and is part of the FS path
  // (`/workspace/<workspaceDir>`). Keeping it stable means the IndexedDB
  // contents persist across reloads.
  const workspaceDir = useMemo(() => 'codez-workspace', []);

  return (
    <div className="codez-shell">
      <CodezTitlebar workspace={workspaceDir} />
      <div className="codez-ide">
        {!ready && <LoadingOverlay label="Booting Codez IDE…" />}
        <Suspense fallback={<LoadingOverlay label="Loading editor bundle…" />}>
          <IDE workspaceDir={workspaceDir} onReady={() => setReady(true)} />
        </Suspense>
      </div>
    </div>
  );
}
