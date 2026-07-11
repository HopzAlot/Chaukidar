import type { ReactNode } from 'react';

type Tone = 'safe' | 'review' | 'high' | 'neutral' | 'brand';

const TONE_CLASSES: Record<Tone, string> = {
  safe: 'bg-risk-safe-tint text-risk-safe',
  review: 'bg-risk-review-tint text-risk-review',
  high: 'bg-risk-high-tint text-risk-high',
  neutral: 'bg-ink/5 text-ink-soft',
  brand: 'bg-brand-tint text-brand',
};

export default function Badge({
  tone = 'neutral',
  children,
}: {
  tone?: Tone;
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-sm px-2 py-0.5 text-xs font-medium font-mono tracking-tight ${TONE_CLASSES[tone]}`}
    >
      {children}
    </span>
  );
}
