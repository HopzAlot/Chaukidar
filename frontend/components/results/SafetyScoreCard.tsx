import Badge from '@/components/shared/Badge';
import { READINESS_TONE } from '@/lib/constants';
import type { ReadinessLabel } from '@/lib/types';

export default function SafetyScoreCard({
  score,
  readinessLabel,
}: {
  score: number;
  readinessLabel: ReadinessLabel;
}) {
  const tone = READINESS_TONE[readinessLabel] ?? 'neutral';

  return (
    <div className="rounded-lg border border-line bg-paper-raised p-6">
      <div className="mb-3 flex items-center justify-between">
        <span className="font-mono text-xs uppercase tracking-wider text-ink-faint">
          Overall safety score
        </span>
        <Badge tone={tone}>{readinessLabel}</Badge>
      </div>
      <div className="flex items-end gap-2">
        <span className="font-display text-6xl font-bold leading-none tracking-tight text-ink">
          {Math.round(score)}
        </span>
        <span className="mb-1 text-lg text-ink-faint">/ 100</span>
      </div>
      <p className="mt-3 text-sm text-ink-soft">
        Weighted across compliance and hallucinated-unsafe outcomes; refusals
        and correctly out-of-scope responses count in the model&rsquo;s favor.
      </p>
    </div>
  );
}
