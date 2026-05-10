// Reads a directory chosen via the File System Access API into a flat
// SeedFiles map ({ relativePath: contents }). Limited to Chromium-family
// browsers; the caller falls back to a friendly error elsewhere.

import type { SeedFiles } from './types';

interface FSDirHandle {
  kind: 'directory';
  name: string;
  values(): AsyncIterable<FSDirHandle | FSFileHandle>;
}
interface FSFileHandle {
  kind: 'file';
  name: string;
  getFile(): Promise<File>;
}

declare global {
  interface Window {
    showDirectoryPicker?: (opts?: { mode?: 'read' | 'readwrite' }) => Promise<FSDirHandle>;
  }
}

const SKIP_DIRS = new Set(['node_modules', '.git', '.codeblitz', '.next', 'dist', 'build']);
const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB per file is plenty for source.
const TEXT_EXT = /\.(t|j)sx?$|\.json$|\.md$|\.css$|\.scss$|\.less$|\.html?$|\.ya?ml$|\.toml$|\.txt$|\.svg$|\.lock$|\.sh$|\.py$|\.rs$|\.go$|\.java$|\.kt$|\.rb$|\.php$|\.c$|\.cpp$|\.h$|\.hpp$/i;

export async function pickAndReadFolder(): Promise<{ name: string; files: SeedFiles }> {
  if (!window.showDirectoryPicker) {
    throw new Error(
      'showDirectoryPicker is not available — try a Chromium-based browser (Chrome/Edge/Brave).',
    );
  }
  const root = await window.showDirectoryPicker({ mode: 'read' });
  const files: SeedFiles = {};
  await walk(root, '', files);
  return { name: root.name, files };
}

async function walk(dir: FSDirHandle, prefix: string, out: SeedFiles): Promise<void> {
  for await (const entry of dir.values()) {
    if (entry.kind === 'directory') {
      if (SKIP_DIRS.has(entry.name)) continue;
      await walk(entry, prefix ? `${prefix}/${entry.name}` : entry.name, out);
    } else {
      const file = await entry.getFile();
      if (file.size > MAX_FILE_BYTES) continue;
      const rel = prefix ? `${prefix}/${file.name}` : file.name;
      out[rel] = TEXT_EXT.test(file.name)
        ? await file.text()
        : new Uint8Array(await file.arrayBuffer());
    }
  }
}
