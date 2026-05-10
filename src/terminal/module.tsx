// OpenSumi module that registers the Codez terminal as a tab in the bottom
// panel. The slot id is 'codez-terminal' — listed in layoutConfig.bottom.
//
// All DI primitives come from codez-di so we share runtime identities with
// the OpenSumi copy that codeblitz pre-bundles. Decorating with the npm copy
// of @opensumi/di would make the bundled DI raise "Cannot find Provider".

import {
  BrowserModule,
  ComponentContribution,
  Domain,
  Injectable,
  getIcon,
  type ComponentRegistry,
} from '../codez-di';
import { CodezTerminalView } from './TerminalView';

const TERMINAL_CONTAINER_ID = 'codez-terminal';

@Domain(ComponentContribution)
class CodezTerminalContribution {
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
