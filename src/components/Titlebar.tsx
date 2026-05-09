interface Props {
  workspace: string;
}

export function CodezTitlebar({ workspace }: Props) {
  return (
    <div className="codez-titlebar">
      <span className="codez-logo" aria-label="Codez">
        <svg viewBox="0 0 64 64" aria-hidden="true">
          <defs>
            <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#7c5cff" />
              <stop offset="100%" stopColor="#22d3ee" />
            </linearGradient>
          </defs>
          <path
            d="M22 20 L12 32 L22 44"
            fill="none"
            stroke="url(#lg)"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M42 20 L52 32 L42 44"
            fill="none"
            stroke="url(#lg)"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M36 16 L28 48"
            fill="none"
            stroke="url(#lg)"
            strokeWidth="5"
            strokeLinecap="round"
          />
        </svg>
        Codez
      </span>
      <span style={{ color: 'var(--codez-muted)', fontSize: 12 }}>
        — browser IDE on OpenSumi
      </span>
      <span className="codez-title-actions">
        <span className="codez-pill">workspace: {workspace}</span>
        <span className="codez-pill">IndexedDB</span>
      </span>
    </div>
  );
}
