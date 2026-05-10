// Codez Files module: registers OpenSumi commands for opening folders from
// disk, switching workspaces, and creating fresh empty workspaces. Commands
// surface in the command palette (Ctrl+Shift+P) — File-menu integration
// would require the menu/next subpath which codeblitz doesn't expose via
// requireModule.

import {
  Autowired,
  BrowserModule,
  CommandContribution,
  Domain,
  IDialogService,
  Injectable,
  QuickPickService,
  type CommandRegistry,
  type IDialogServiceType,
  type QuickPickItem,
  type QuickPickServiceType,
} from '../codez-di';
import { emitWorkspaceChange } from './event-bus';
import { pickAndReadFolder } from './open-folder';
import { loadRecent } from './recent';
import type { RecentWorkspace } from './types';

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'workspace';

const C_OPEN_FOLDER = { id: 'codez.openFolder', label: 'Codez: Open Folder…' };
const C_NEW_WORKSPACE = { id: 'codez.newWorkspace', label: 'Codez: New Empty Workspace' };
const C_SWITCH_WORKSPACE = { id: 'codez.switchWorkspace', label: 'Codez: Switch Workspace…' };
const C_CLOSE_FOLDER = { id: 'codez.closeFolder', label: 'Codez: Close Folder' };

@Domain(CommandContribution)
class CodezFilesContribution {
  @Autowired(IDialogService)
  private dialog!: IDialogServiceType;

  @Autowired(QuickPickService)
  private quickPick!: QuickPickServiceType;

  registerCommands(commands: CommandRegistry): void {
    commands.registerCommand(C_OPEN_FOLDER, {
      execute: () => this.openFolder(),
    });
    commands.registerCommand(C_NEW_WORKSPACE, {
      execute: () => this.newWorkspace(),
    });
    commands.registerCommand(C_SWITCH_WORKSPACE, {
      execute: () => this.switchWorkspace(),
    });
    commands.registerCommand(C_CLOSE_FOLDER, {
      execute: () =>
        emitWorkspaceChange({
          workspaceDir: 'codez-workspace',
          displayName: 'Codez Workspace',
        }),
    });
  }

  private async openFolder() {
    try {
      const { name, files } = await pickAndReadFolder();
      const wsDir = `${slug(name)}-${Date.now().toString(36)}`;
      emitWorkspaceChange({
        workspaceDir: wsDir,
        displayName: name,
        seed: files,
      });
    } catch (err) {
      if ((err as DOMException)?.name === 'AbortError') return;
      this.dialog.error(`Open Folder failed: ${(err as Error).message}`);
    }
  }

  private async newWorkspace() {
    const ts = Date.now().toString(36);
    emitWorkspaceChange({
      workspaceDir: `empty-${ts}`,
      displayName: `Empty (${ts})`,
    });
  }

  private async switchWorkspace() {
    const recent = loadRecent();
    if (!recent.length) {
      this.dialog.info('No recent workspaces yet — open a folder first.');
      return;
    }
    const items: QuickPickItem<RecentWorkspace>[] = recent.map((r) => ({
      label: r.displayName,
      description: new Date(r.openedAt).toLocaleString(),
      value: r,
    }));
    const picked = await this.quickPick.show(items, {
      placeholder: 'Pick a recent workspace',
    });
    if (!picked) return;
    emitWorkspaceChange({
      workspaceDir: picked.workspaceDir,
      displayName: picked.displayName,
    });
  }
}

@Injectable()
export class CodezFilesModule extends BrowserModule {
  providers = [CodezFilesContribution];
}
