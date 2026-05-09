// Initial files dropped into the workspace on first boot. Once the user has
// edited the workspace these are ignored — IndexedDB owns the truth.
export const SEED_FILES = {
  'README.md': [
    '# Welcome to Codez',
    '',
    'Codez is a browser-based VSCode-style IDE built on the OpenSumi codeblitz framework.',
    '',
    '- Files persist in IndexedDB — your edits survive a refresh.',
    '- TypeScript / JavaScript intellisense runs in a Web Worker.',
    '- Markdown, JSON, CSS, HTML highlighting are bundled.',
    '',
    'Open `src/index.ts` to start hacking.',
    '',
  ].join('\n'),
  'src/index.ts': [
    "// Edit me — TypeScript intellisense is live.",
    "export function greet(name: string): string {",
    "  return `Hello, ${name}!`;",
    "}",
    '',
    "console.log(greet('Codez'));",
    '',
  ].join('\n'),
  'src/utils.ts': [
    "export const sum = (a: number, b: number) => a + b;",
    '',
  ].join('\n'),
  'package.json': JSON.stringify(
    {
      name: 'codez-playground',
      version: '0.0.1',
      private: true,
      type: 'module',
    },
    null,
    2,
  ) + '\n',
};
