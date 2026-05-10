// Codez-native Extensions activity-bar panel. Replaces the npm-installed
// @opensumi/ide-extension-manager which can't be wired up because it's
// decorated by a different copy of the OpenSumi DI than the one codeblitz
// pre-bundles. Our panel is a plain React component talking to OpenVSX
// via the existing BrowserVsxExtensionBackService.

import {
  BrowserModule,
  ComponentContribution,
  Domain,
  Injectable,
  getIcon,
  type ComponentRegistry,
} from '../codez-di';
import { CodezExtensionsView } from './ExtensionsView';

const EXTENSIONS_CONTAINER_ID = 'codez-extensions';

@Domain(ComponentContribution)
class CodezExtensionsContribution {
  registerComponent(registry: ComponentRegistry) {
    registry.register(
      EXTENSIONS_CONTAINER_ID,
      {
        id: EXTENSIONS_CONTAINER_ID,
        component: CodezExtensionsView,
      },
      {
        title: 'Extensions',
        priority: 5,
        containerId: EXTENSIONS_CONTAINER_ID,
        iconClass: getIcon('extension'),
        activateKeyBinding: 'ctrlcmd+shift+x',
      },
    );
  }
}

@Injectable()
export class CodezExtensionsModule extends BrowserModule {
  providers = [CodezExtensionsContribution];
}
