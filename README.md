# Codez

A browser-based VSCode-style IDE built on the [OpenSumi codeblitz](https://codeblitz.opensumi.com) framework.

- Full IDE chrome via `AppRenderer` (explorer, editor, search, panels)
- Persistent workspace in **IndexedDB** — edits survive refresh
- TypeScript / JavaScript intellisense in a Web Worker
- JS, TS, JSON, CSS, HTML, Markdown grammars preloaded
- Custom branded titlebar + dark theme

## Develop

```bash
npm install
npm run dev
```

Open http://localhost:5173.

## Build

```bash
npm run build
npm run preview
```

## Layout

| File | Purpose |
| --- | --- |
| `src/App.tsx` | Top-level shell, lazy-loads the IDE bundle |
| `src/Ide.tsx` | `AppRenderer` config (filesystem, theme, language workers) |
| `src/seed.ts` | Initial files written on first boot |
| `src/codeblitz-side-effects.ts` | One place for codeblitz CSS + grammar imports |
| `src/components/Titlebar.tsx` | Branded titlebar above the IDE |

## Reset the workspace

The persistent FS lives in IndexedDB under `codez-codez-workspace`. Delete it from your browser's devtools (Application → IndexedDB) to start fresh.

## Roadmap

- GitHub repo loader (DynamicRequest filesystem)
- Settings sync via remote backend
- Built-in terminal proxied through a server
- Extension host for third-party VSCode-compatible plugins
