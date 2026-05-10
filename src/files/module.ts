// Codez Files module: registers OpenSumi commands and File-menu entries
// for opening folders from disk, switching workspaces, and creating fresh
// empty workspaces. The actual workspace remount happens in App.tsx via the
// codez:workspace-change event the commands fire.

import { Autowired, Injectable } from '@opensumi/di';
import {
  BrowserModule,
  CommandContribution,
  CommandRegistry,
} from '@opensumi/ide-core-browser';
import { Domain } from '@opensumi/ide-core-common/lib/di-helper';
import {
  IMenuRegistry,
  MenuContribution,
  MenuId,
} from '@opensumi/ide-core-browser/lib/menu/next';
import { IDialogService } from '@opensumi/ide-overlay/lib/common';
import { QuickPickService } from '@opensumi/ide-core-browser/lib/quick-open';
import { emitWorkspaceChange } from './event-bus';
import { pickAndReadFolder } from './open-folder';
import { loadRecent } from './recent';

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'workspace';

const C_OPEN_FOLDER = { id: 'codez.openFolder', label: 'Open Folder…' };
const C_NEW_WORKSPACE = { id: 'codez.newWorkspace', label: 'New Empty Workspace…' };
const C_SWITCH_WORKSPACE = {
  id: 'codez.switchWorkspace',
  label: 'Switch Workspace…',
};
const C_CLOSE_FOLDER = { id: 'codez.closeFolder', label: 'Close Folder' };

@Domain(CommandContribution, MenuContribution)
class CodezFilesContribution implements CommandContribution, MenuContribution {
  @Autowired(IDialogService)
  private dialog!: IDialogService;

  @Autowired(QuickPickService)
  private quickPick!: QuickPickService;

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

  registerMenus(menus: IMenuRegistry): void {
    // Group "1_open" places these near the top of the File menu.
    menus.registerMenuItem(MenuId.MenubarFileMenu, {
      command: C_OPEN_FOLDER.id,
      group: '1_open',
      order: 1,
    });
    menus.registerMenuItem(MenuId.MenubarFileMenu, {
      command: C_NEW_WORKSPACE.id,
      group: '1_open',
      order: 2,
    });
    menus.registerMenuItem(MenuId.MenubarFileMenu, {
      command: C_SWITCH_WORKSPACE.id,
      group: '1_open',
      order: 3,
    });
    menus.registerMenuItem(MenuId.MenubarFileMenu, {
      command: C_CLOSE_FOLDER.id,
      group: '1_open',
      order: 4,
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
      // AbortError from the picker is the user cancelling — silent.
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
    const items = recent.map((r) => ({
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
