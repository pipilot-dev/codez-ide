// Custom OpenSumi module that overrides the extension-manager's back-service
// binding so the activity-bar panel works without a Node backend.
//
// VSXExtensionServicePath is the string token codeblitz/OpenSumi uses to
// resolve the RPC proxy for the marketplace service. By providing our own
// instance under the same token, the browser-side
// VSXExtensionService.backService becomes our stub.

import { Injectable } from '@opensumi/di';
import { BrowserModule } from '@opensumi/ide-core-browser';
import { VSXExtensionServicePath } from '@opensumi/ide-extension-manager/lib/common';
import { BrowserVsxExtensionBackService } from './openvsx-stub';

@Injectable()
export class CodezExtensionMarketplaceModule extends BrowserModule {
  providers = [
    {
      token: VSXExtensionServicePath,
      useClass: BrowserVsxExtensionBackService,
    },
  ];
}
