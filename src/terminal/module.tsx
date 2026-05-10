// OpenSumi module that registers the Codez terminal as a tab in the bottom
// panel. The slot id is 'codez-terminal' — listed in layoutConfig.bottom.

import { Injectable } from '@opensumi/di';
import {
  BrowserModule,
  ComponentContribution,
  ComponentRegistry,
  getIcon,
} from '@opensumi/ide-core-browser';
import { Domain } from '@opensumi/ide-core-common/lib/di-helper';
import { CodezTerminalView } from './TerminalView';

const TERMINAL_CONTAINER_ID = 'codez-terminal';

@Domain(ComponentContribution)
class CodezTerminalContribution implements ComponentContribution {
  registerComponent(registry: ComponentRegistry) {
    registry.register(
      TERMINAL_CONTAINER_ID,
      {
        id: TERMINAL_CONTAINER_ID,
        component: CodezTerminalView,
      },
      {
        title: 'Terminal',
        priority: 8,
        containerId: TERMINAL_CONTAINER_ID,
        iconClass: getIcon('terminal'),
        activateKeyBinding: 'ctrlcmd+`',
      },
    );
  }
}

@Injectable()
export class CodezTerminalModule extends BrowserModule {
  providers = [CodezTerminalContribution];
}
