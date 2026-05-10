// Pure-browser replacement for the Node-side VSXExtensionServicePath service
// that @opensumi/ide-extension-manager normally requires.
//
// The original Node service does four things:
//   1. proxies marketplace REST calls (search/getExtension/getOpenVSXRegistry)
//   2. downloads the .vsix over HTTP with retries
//   3. unzips it onto disk, stripping the "extension/" prefix that VSIX zips
//      wrap their contents in
//   4. writes files into appConfig.marketplace.extensionDir, which the
//      extension host scans on next refresh
//
// This implementation does all four against the codeblitz browser environment:
// fetch() for HTTP, fflate for unzip, and codeblitz's requireModule('fs-extra')
// to write into the BrowserFS-backed virtual disk mounted at /home/.codeblitz.
//
// After install() returns the install path, the marketplace UI calls
// extensionManagementService.postChangedExtension(false, path) which
// instantiates and activates the extension.

import { unzip } from 'fflate';
import { requireModule } from '@codeblitzjs/ide-core/bundle';

const OPEN_VSX_REGISTRY = 'https://open-vsx.org';
const EXTENSIONS_DIR = '/home/.codeblitz/extensions';
const VSIX_PREFIX = 'extension/';

async function json<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) throw new Error(`OpenVSX ${res.status}: ${url}`);
  return res.json() as Promise<T>;
}

function unzipAsync(bytes: Uint8Array): Promise<Record<string, Uint8Array>> {
  return new Promise((resolve, reject) => {
    unzip(
      bytes,
      // Filter to extension/ payload only — VSIX root files like
      // [Content_Types].xml and extension.vsixmanifest aren't needed.
      { filter: (file) => file.name.startsWith(VSIX_PREFIX) },
      (err, files) => (err ? reject(err) : resolve(files)),
    );
  });
}

export class BrowserVsxExtensionBackService {
  // ---- Read APIs ----

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

  async getExtension(query: { extensionId?: string; namespace?: string; name?: string }) {
    const ext = query.extensionId
      ? query.extensionId
      : `${query.namespace}.${query.name}`;
    const [namespace, name] = ext.split('.');
    if (!namespace || !name) {
      throw new Error(`Invalid extension id: ${ext}`);
    }
    const detail = await json<Record<string, unknown>>(
      `${OPEN_VSX_REGISTRY}/api/${namespace}/${name}`,
    );
    // Marketplace UI expects { extensions: [...] } shape (matches OpenSumi
    // search result). Single-detail call returns one entry, so wrap it.
    return { extensions: [detail] };
  }

  async getAllVersion({ namespace, name }: { namespace: string; name: string }) {
    return json(`${OPEN_VSX_REGISTRY}/api/${namespace}/${name}/versions`);
  }

  async getReadme(url: string): Promise<string> {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`OpenVSX readme ${res.status}: ${url}`);
    return res.text();
  }

  // ---- Install pipeline ----

  async install(param: { id: string; name: string; url: string; version: string }) {
    const fse = requireModule('fs-extra') as {
      ensureDir(p: string): Promise<void>;
      writeFile(p: string, data: Uint8Array | string): Promise<void>;
      pathExists(p: string): Promise<boolean>;
    };
    const path = requireModule('path') as { join(...p: string[]): string; dirname(p: string): string };

    const installRoot = path.join(EXTENSIONS_DIR, `${param.id}-${param.version}`);

    // If a previous install for this exact id+version already wrote a
    // package.json, we're done — the extension host will pick it up on its
    // next scan.
    if (await fse.pathExists(path.join(installRoot, 'package.json'))) {
      return installRoot;
    }

    const res = await fetch(param.url);
    if (!res.ok) {
      throw new Error(`Download VSIX ${res.status}: ${param.url}`);
    }
    const buf = new Uint8Array(await res.arrayBuffer());
    const entries = await unzipAsync(buf);

    await fse.ensureDir(installRoot);
    for (const [name, data] of Object.entries(entries)) {
      // Skip directory entries (zero-length, name ends with /).
      if (!data || data.length === 0 || name.endsWith('/')) continue;
      const rel = name.slice(VSIX_PREFIX.length);
      if (!rel) continue;
      const target = path.join(installRoot, rel);
      await fse.ensureDir(path.dirname(target));
      await fse.writeFile(target, data);
    }
    return installRoot;
  }

  async uninstall(): Promise<void> {
    // Marketplace UI calls extensionManagementService.postUninstallExtension
    // directly, which removes files via OpenSumi's IFileService — this RPC
    // hook is unused in that flow.
  }
}
