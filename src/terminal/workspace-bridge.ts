// Bridges the codeblitz IDE workspace (BrowserFS / IndexedDB at
// /workspace/<workspaceDir>) to a WebContainer FS so the terminal's `jsh`,
// `node`, and `npm` see the same files the editor edits.
//
// The IDE FS and the WebContainer FS are separate runtimes. We do a one-time
// recursive copy when the terminal first boots, then forward edit events as
// they happen via the runtimeConfig.workspace callbacks codeblitz already
// emits. Reverse sync (WebContainer -> IDE) is not implemented; running
// `npm install` writes node_modules into the WebContainer FS only, which is
// usually what users want anyway.

import { WebContainer } from '@webcontainer/api';
import { requireModule } from '@codeblitzjs/ide-core/bundle';

type FileTree = Record<
  string,
  { file: { contents: Uint8Array | string } } | { directory: FileTree }
>;

interface FsExtra {
  readdir(p: string): Promise<string[]>;
  stat(p: string): Promise<{ isDirectory(): boolean; isFile(): boolean }>;
  readFile(p: string): Promise<Uint8Array>;
  pathExists(p: string): Promise<boolean>;
}

interface PathMod {
  join(...p: string[]): string;
  dirname(p: string): string;
  posix: { join(...p: string[]): string; dirname(p: string): string };
}

// Folders we don't want to spend time copying into the WebContainer.
const SKIP_NAMES = new Set([
  '.codeblitz',
  '.git',
  'node_modules',
]);

class WorkspaceBridge {
  private container: WebContainer | null = null;
  private bootPromise: Promise<WebContainer> | null = null;
  private mounted = false;
  private mountPromise: Promise<void> | null = null;
  private workspaceRoot = '/workspace/codez-workspace';

  setWorkspaceRoot(root: string) {
    this.workspaceRoot = root;
  }

  /** Boot (or return) the singleton WebContainer instance. */
  boot(): Promise<WebContainer> {
    if (!this.bootPromise) {
      this.bootPromise = WebContainer.boot().then((wc) => {
        this.container = wc;
        return wc;
      });
    }
    return this.bootPromise;
  }

  /** Boot + initial recursive copy from the IDE FS. Idempotent. */
  async ready(): Promise<WebContainer> {
    const wc = await this.boot();
    if (!this.mounted) {
      if (!this.mountPromise) {
        this.mountPromise = this.initialSync(wc).then(() => {
          this.mounted = true;
        });
      }
      await this.mountPromise;
    }
    return wc;
  }

  private async initialSync(wc: WebContainer): Promise<void> {
    const fse = requireModule('fs-extra') as FsExtra;
    const path = requireModule('path') as PathMod;
    if (!(await fse.pathExists(this.workspaceRoot))) return;
    const tree = await this.walk(fse, path, this.workspaceRoot);
    await wc.mount(tree);
  }

  private async walk(fse: FsExtra, path: PathMod, dir: string): Promise<FileTree> {
    const out: FileTree = {};
    const entries = await fse.readdir(dir);
    for (const name of entries) {
      if (SKIP_NAMES.has(name)) continue;
      const full = path.join(dir, name);
      let stat;
      try {
        stat = await fse.stat(full);
      } catch {
        continue;
      }
      if (stat.isDirectory()) {
        out[name] = { directory: await this.walk(fse, path, full) };
      } else if (stat.isFile()) {
        try {
          const data = await fse.readFile(full);
          out[name] = { file: { contents: data } };
        } catch {
          // Unreadable file — skip rather than abort the whole sync.
        }
      }
    }
    return out;
  }

  // --- Event-driven sync. Filepaths from codeblitz are workspace-relative. ---

  async writeFile(filepath: string, content: string | Uint8Array): Promise<void> {
    const wc = this.container;
    if (!wc || !this.mounted) return;
    const target = this.toContainerPath(filepath);
    await this.ensureParentDir(wc, target);
    await wc.fs.writeFile(target, content as never);
  }

  async deleteFile(filepath: string): Promise<void> {
    const wc = this.container;
    if (!wc || !this.mounted) return;
    const target = this.toContainerPath(filepath);
    try {
      await wc.fs.rm(target, { recursive: true, force: true } as never);
    } catch {
      /* ignore */
    }
  }

  /** Convert a workspace-relative path (`src/index.ts`) to the WC root path. */
  private toContainerPath(filepath: string): string {
    const clean = filepath.replace(/^\/+/, '');
    return '/' + clean;
  }

  private async ensureParentDir(wc: WebContainer, target: string): Promise<void> {
    const i = target.lastIndexOf('/');
    if (i <= 0) return;
    const parent = target.slice(0, i);
    try {
      await wc.fs.mkdir(parent, { recursive: true } as never);
    } catch {
      /* ignore — already exists or race */
    }
  }
}

export const workspaceBridge = new WorkspaceBridge();
