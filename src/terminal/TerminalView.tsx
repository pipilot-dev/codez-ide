import { useEffect, useRef } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import { workspaceBridge } from './workspace-bridge';

export function CodezTerminalView() {
  const hostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!hostRef.current) return;
    const term = new Terminal({
      convertEol: true,
      fontFamily:
        "'JetBrains Mono', 'Fira Code', Menlo, Monaco, 'Courier New', monospace",
      fontSize: 12,
      theme: {
        background: '#0b0d12',
        foreground: '#e6e8ee',
        cursor: '#7c5cff',
      },
    });
    const fit = new FitAddon();
    term.loadAddon(fit);
    term.open(hostRef.current);
    requestAnimationFrame(() => fit.fit());

    const ro = new ResizeObserver(() => {
      try {
        fit.fit();
      } catch {
        // xterm throws if the host element isn't laid out yet.
      }
    });
    ro.observe(hostRef.current);

    let disposed = false;
    let writer: WritableStreamDefaultWriter<string> | null = null;
    let process: Awaited<ReturnType<Awaited<ReturnType<typeof workspaceBridge.ready>>['spawn']>> | null = null;

    (async () => {
      term.writeln('\x1b[38;5;141mCodez\x1b[0m terminal — booting WebContainer…');
      try {
        if (!self.crossOriginIsolated) {
          term.writeln('\x1b[31mError:\x1b[0m page is not cross-origin isolated.');
          term.writeln(
            'Set COOP/COEP headers on the host (already configured in vite.config.ts).',
          );
          return;
        }
        const wc = await workspaceBridge.ready();
        if (disposed) return;
        term.writeln('\x1b[38;5;141mCodez\x1b[0m terminal ready. Workspace mounted at /.');
        const { cols, rows } = term;
        process = await wc.spawn('jsh', { terminal: { cols, rows } });
        process.output.pipeTo(
          new WritableStream({
            write(chunk) {
              term.write(chunk);
            },
          }),
        );
        writer = process.input.getWriter();
        term.onData((d) => {
          writer?.write(d);
        });
        term.onResize(({ cols: c, rows: r }) => {
          process?.resize({ cols: c, rows: r });
        });
      } catch (err) {
        term.writeln(`\x1b[31mFailed to start terminal:\x1b[0m ${(err as Error).message}`);
      }
    })();

    return () => {
      disposed = true;
      ro.disconnect();
      try {
        writer?.close();
      } catch {
        /* ignore */
      }
      try {
        process?.kill();
      } catch {
        /* ignore */
      }
      term.dispose();
    };
  }, []);

  return (
    <div
      ref={hostRef}
      style={{ width: '100%', height: '100%', background: '#0b0d12', padding: 4 }}
    />
  );
}
