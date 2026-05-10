// Pure-browser stub for the OpenVSX backend service that
// `@opensumi/ide-extension-manager` expects on the Node side.
//
// The real backend lives in `@opensumi/ide-extension-manager/lib/node` and uses
// node-fetch to hit https://open-vsx.org. Codeblitz has no Node runtime, so
// without this stub the activity-bar Extensions panel mounts but every RPC
// rejects with METHOD_NOT_REGISTERED.
//
// This stub fulfils the *read* surface of the API by calling open-vsx.org's
// public REST API directly from the browser (it returns CORS-friendly JSON).
// Install/uninstall are intentionally left unimplemented — they require VSIX
// download + extraction + writing into the in-browser extension host, which is
// a separate, larger piece of work.

const OPEN_VSX_REGISTRY = 'https://open-vsx.org';

async function json<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    throw new Error(`OpenVSX ${res.status}: ${url}`);
  }
  return res.json() as Promise<T>;
}

export class BrowserVsxExtensionBackService {
  // The browser-side service reads this once at boot to render the registry
  // badge and to build download URLs.
  async getOpenVSXRegistry(): Promise<string> {
    return OPEN_VSX_REGISTRY;
  }

  async search(param?: Record<string, string | number | undefined>) {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(param ?? {})) {
      if (v !== undefined && v !== null && v !== '') qs.set(k, String(v));
    }
    return json(`${OPEN_VSX_REGISTRY}/api/-/search?${qs.toString()}`);
  }

  async getExtension({ namespace, name }: { namespace: string; name: string }) {
    return json(`${OPEN_VSX_REGISTRY}/api/${namespace}/${name}`);
  }

  async getAllVersion({ namespace, name }: { namespace: string; name: string }) {
    return json(`${OPEN_VSX_REGISTRY}/api/${namespace}/${name}/versions`);
  }

  async getReadme(url: string): Promise<string> {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`OpenVSX readme ${res.status}: ${url}`);
    return res.text();
  }

  // Install / uninstall require writing VSIX bytes into the extension host's
  // virtual FS. Not supported in this pure-browser build.
  async install(): Promise<never> {
    throw new Error(
      'Extension install is not supported in the pure-browser build. ' +
        'Pre-bundle extensions via appConfig.extensionMetadata instead.',
    );
  }

  async uninstall(): Promise<never> {
    throw new Error('Extension uninstall is not supported in the pure-browser build.');
  }
}
