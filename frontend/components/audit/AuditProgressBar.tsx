export default function AuditProgressBar({
  current,
  total,
}: {
  current: number;
  total: number;
}) {
  const pct = total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0;

  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <span className="font-mono text-xs uppercase tracking-wider text-ink-faint">
          Prompts executed
        </span>
        <span className="font-mono text-sm font-tabular text-ink">
          {current} / {total}
        </span>
      </div>
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-ink/8"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full bg-brand transition-[width] duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
