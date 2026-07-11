export default function LoadingSpinner({
  label = 'Loading',
}: {
  label?: string;
}) {
  return (
    <div className="flex items-center gap-2.5 text-ink-soft" role="status" aria-live="polite">
      <span className="relative flex h-3.5 w-3.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-soft opacity-40" />
        <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-brand" />
      </span>
      <span className="font-mono text-xs tracking-wide">{label}</span>
    </div>
  );
}
