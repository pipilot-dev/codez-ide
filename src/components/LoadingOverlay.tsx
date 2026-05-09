interface Props {
  label: string;
}

export function LoadingOverlay({ label }: Props) {
  return (
    <div className="codez-loading" role="status" aria-live="polite">
      <div className="codez-spinner" />
      <span>{label}</span>
    </div>
  );
}
