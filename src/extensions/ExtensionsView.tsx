import { useCallback, useEffect, useMemo, useState } from 'react';
import { BrowserVsxExtensionBackService } from '../extension-manager/openvsx-stub';

interface VsxItem {
  namespace: string;
  name: string;
  displayName?: string;
  description?: string;
  publisher?: string;
  version?: string;
  iconUrl?: string;
  files?: { download?: string };
  downloadUrl?: string;
}

interface SearchResponse {
  extensions?: VsxItem[];
  totalSize?: number;
}

const svc = new BrowserVsxExtensionBackService();

export function CodezExtensionsView() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<VsxItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [installing, setInstalling] = useState<string | null>(null);
  const [installed, setInstalled] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (q: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = (await svc.search({
        query: q || 'theme',
        size: 30,
      })) as SearchResponse;
      setResults(res.extensions ?? []);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void search('');
  }, [search]);

  const id = (e: VsxItem) => `${e.namespace}.${e.name}`;

  const onInstall = useCallback(
    async (e: VsxItem) => {
      const url = e.files?.download ?? e.downloadUrl;
      if (!url || !e.version) {
        setError(`No download URL for ${id(e)}`);
        return;
      }
      setInstalling(id(e));
      setError(null);
      try {
        const path = await svc.install({
          id: id(e),
          name: e.name,
          url,
          version: e.version,
        });
        setInstalled((s) => ({ ...s, [id(e)]: path }));
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setInstalling(null);
      }
    },
    [],
  );

  const onSubmit = (ev: React.FormEvent<HTMLFormElement>) => {
    ev.preventDefault();
    void search(query);
  };

  const list = useMemo(
    () => results.filter((e) => e.namespace && e.name),
    [results],
  );

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: '#0b0d12',
        color: '#e6e8ee',
        fontSize: 12,
      }}
    >
      <form onSubmit={onSubmit} style={{ padding: 8, borderBottom: '1px solid #1f2430' }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search Open VSX…"
          style={{
            width: '100%',
            background: '#11141b',
            color: '#e6e8ee',
            border: '1px solid #1f2430',
            borderRadius: 4,
            padding: '6px 8px',
            outline: 'none',
            fontSize: 12,
          }}
        />
      </form>
      {error && (
        <div style={{ padding: 8, color: '#ff7b72', borderBottom: '1px solid #1f2430' }}>
          {error}
        </div>
      )}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {loading && <div style={{ padding: 12, color: '#8a93a6' }}>Loading…</div>}
        {!loading && !list.length && (
          <div style={{ padding: 12, color: '#8a93a6' }}>No results.</div>
        )}
        {list.map((e) => {
          const eid = id(e);
          const isInstalling = installing === eid;
          const isInstalled = !!installed[eid];
          return (
            <div
              key={eid}
              style={{
                display: 'flex',
                gap: 8,
                padding: '8px 10px',
                borderBottom: '1px solid #1f2430',
                alignItems: 'flex-start',
              }}
            >
              {e.iconUrl ? (
                <img
                  src={e.iconUrl}
                  alt=""
                  style={{ width: 32, height: 32, borderRadius: 4, flexShrink: 0 }}
                />
              ) : (
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 4,
                    background: '#1f2430',
                    flexShrink: 0,
                  }}
                />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, color: '#e6e8ee' }}>
                  {e.displayName ?? e.name}{' '}
                  <span style={{ color: '#8a93a6', fontWeight: 400 }}>
                    {e.version ? `v${e.version}` : ''}
                  </span>
                </div>
                <div
                  style={{
                    color: '#8a93a6',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {e.description ?? ''}
                </div>
                <div style={{ color: '#8a93a6', fontSize: 11, marginTop: 2 }}>
                  {e.namespace}.{e.name} · {e.publisher ?? e.namespace}
                </div>
              </div>
              <button
                onClick={() => onInstall(e)}
                disabled={isInstalling || isInstalled}
                style={{
                  padding: '4px 10px',
                  background: isInstalled ? '#1f2430' : '#7c5cff',
                  color: '#fff',
                  border: 0,
                  borderRadius: 4,
                  cursor: isInstalling || isInstalled ? 'default' : 'pointer',
                  fontSize: 11,
                  flexShrink: 0,
                }}
              >
                {isInstalled ? 'Installed' : isInstalling ? 'Installing…' : 'Install'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
