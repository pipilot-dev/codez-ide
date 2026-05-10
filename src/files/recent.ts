import type { RecentWorkspace } from './types';

const KEY_CURRENT = 'codez:current-workspace';
const KEY_RECENT = 'codez:recent-workspaces';
const MAX_RECENT = 10;

export function loadCurrent(): RecentWorkspace | null {
  try {
    const raw = localStorage.getItem(KEY_CURRENT);
    return raw ? (JSON.parse(raw) as RecentWorkspace) : null;
  } catch {
    return null;
  }
}

export function saveCurrent(ws: RecentWorkspace) {
  try {
    localStorage.setItem(KEY_CURRENT, JSON.stringify(ws));
  } catch {
    /* quota / disabled storage — ignore */
  }
}

export function loadRecent(): RecentWorkspace[] {
  try {
    const raw = localStorage.getItem(KEY_RECENT);
    return raw ? (JSON.parse(raw) as RecentWorkspace[]) : [];
  } catch {
    return [];
  }
}

export function pushRecent(ws: RecentWorkspace) {
  const list = loadRecent().filter((r) => r.workspaceDir !== ws.workspaceDir);
  list.unshift(ws);
  try {
    localStorage.setItem(KEY_RECENT, JSON.stringify(list.slice(0, MAX_RECENT)));
  } catch {
    /* ignore */
  }
}
