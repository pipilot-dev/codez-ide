// Codeblitz pre-bundles OpenSumi (and its DI runtime) inside codeblitz.js.
// Anything we decorate with the *npm-installed* @opensumi/di will fail with
// "Cannot find Provider" because the Symbol identities differ. Codeblitz
// exposes `requireModule(name)` to hand back the *bundled* copy; this file
// is the single place we fetch DI primitives so our custom modules share
// runtime identities with the bundled OpenSumi.

import { requireModule } from '@codeblitzjs/ide-core/bundle';
import type * as DiTypes from '@opensumi/di';
import type * as CoreBrowser from '@opensumi/ide-core-browser';
import type * as CoreCommon from '@opensumi/ide-core-common';
import type * as Overlay from '@opensumi/ide-overlay';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const di = requireModule('@opensumi/di') as any as typeof DiTypes;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const cb = requireModule('@opensumi/ide-core-browser') as any as typeof CoreBrowser;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const cc = requireModule('@opensumi/ide-core-common') as any as typeof CoreCommon;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const overlay = requireModule('@opensumi/ide-overlay') as any as typeof Overlay;

export const Injectable = di.Injectable;
export const Autowired = di.Autowired;

export const BrowserModule = cb.BrowserModule;
export const getIcon = cb.getIcon;
// QuickPickService is both a Symbol token (value) and a TS interface (type).
// Re-exporting under one name covers both — TypeScript resolves `value` /
// `type` on demand from the same identifier.
export const QuickPickService = cb.QuickPickService;
export const ComponentContribution = cb.ComponentContribution;

export const Domain = cc.Domain;
export const CommandContribution = cc.CommandContribution;

export const IDialogService = overlay.IDialogService;

// Type-only re-exports so consumers don't need to remember which package each
// type lives in. Listed separately from value exports to avoid TS2484/TS2323
// "duplicate export" diagnostics.
export type {
  CommandRegistry,
  ComponentRegistry,
} from '@opensumi/ide-core-browser';
export type { QuickPickItem, QuickPickService as QuickPickServiceType } from '@opensumi/ide-core-browser/lib/quick-open';
export type { IDialogService as IDialogServiceType } from '@opensumi/ide-overlay/lib/common';
