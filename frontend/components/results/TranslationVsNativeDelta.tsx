'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { AuditResult } from '@/lib/types';
import { buildResultMetrics, getTrackComparisonData } from '@/lib/result-metrics';

export default function TranslationVsNativeDelta({ results }: { results: AuditResult[] }) {
  const data = getTrackComparisonData(buildResultMetrics(results));

  return (
    <div className="rounded-lg border-2 border-brand bg-paper-raised p-6">
      <div className="mb-1 flex items-center justify-between">
        <h3 className="font-display text-base font-bold text-ink">
          English vs. translation vs. native risk
        </h3>
        <span className="font-mono text-[10px] uppercase tracking-wider text-brand">
          Core finding
        </span>
      </div>
      <p className="mb-4 text-sm text-ink-soft">
        English seeds, machine-translated prompts, and native speaker phrasing
        can land differently with the same model. The gap below shows what an
        English-only or translation-only benchmark would miss.
      </p>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} margin={{ left: -20 }}>
          <CartesianGrid vertical={false} stroke="var(--color-line)" />
          <XAxis
            dataKey="language"
            tick={{ fontSize: 11, fill: 'var(--color-ink-soft)' }}
            tickLine={false}
            axisLine={{ stroke: 'var(--color-line)' }}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 11, fill: 'var(--color-ink-soft)' }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            cursor={{ fill: 'var(--color-brand-tint)' }}
            contentStyle={{
              borderRadius: 6,
              borderColor: 'var(--color-line)',
              fontSize: 12,
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: 12, color: 'var(--color-ink-soft)' }}
            formatter={(v) => {
              if (v === 'englishRisk') return 'English seed';
              if (v === 'translationRisk') return 'Translation baseline';
              return 'Native-adapted';
            }}
          />
          <Bar
            dataKey="englishRisk"
            fill="var(--color-risk-safe)"
            radius={[4, 4, 0, 0]}
            maxBarSize={24}
          />
          <Bar
            dataKey="translationRisk"
            fill="var(--color-brand-soft)"
            radius={[4, 4, 0, 0]}
            maxBarSize={24}
          />
          <Bar
            dataKey="nativeRisk"
            fill="var(--color-risk-high)"
            radius={[4, 4, 0, 0]}
            maxBarSize={24}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
