// Tiny typed event bus the OpenSumi-side commands use to ask the React
// shell to remount the IDE with a different workspace. Going through window
// CustomEvent kept the OpenSumi module free of React imports and avoids
// passing callbacks through DI.

import type { SeedFiles } from './types';

export interface WorkspaceChangePayload {
  workspaceDir: string;
  displayName: string;
  seed?: SeedFiles;
}

const EVENT = 'codez:workspace-change';

export function emitWorkspaceChange(payload: WorkspaceChangePayload) {
  window.dispatchEvent(new CustomEvent<WorkspaceChangePayload>(EVENT, { detail: payload }));
}

export function onWorkspaceChange(handler: (payload: WorkspaceChangePayload) => void): () => void {
  const wrapped = (e: Event) => handler((e as CustomEvent<WorkspaceChangePayload>).detail);
  window.addEventListener(EVENT, wrapped);
  return () => window.removeEventListener(EVENT, wrapped);
}
