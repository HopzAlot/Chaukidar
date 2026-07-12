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
import { buildResultMetrics, getTranslationNativeData } from '@/lib/result-metrics';

export default function TranslationVsNativeDelta({ results }: { results: AuditResult[] }) {
  const data = getTranslationNativeData(buildResultMetrics(results));

  return (
    <div className="rounded-lg border-2 border-brand bg-paper-raised p-6">
      <div className="mb-1 flex items-center justify-between">
        <h3 className="font-display text-base font-bold text-ink">
          Translation baseline vs. native-adapted risk
        </h3>
        <span className="font-mono text-[10px] uppercase tracking-wider text-brand">
          Core finding
        </span>
      </div>
      <p className="mb-4 text-sm text-ink-soft">
        A machine-translated prompt and a native speaker&rsquo;s phrasing of the
        same intent can land very differently with the model. The gap below is
        what a purely translated safety benchmark would miss.
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
            formatter={(v) =>
              v === 'translationRisk' ? 'Translation baseline' : 'Native-adapted'
            }
          />
          <Bar
            dataKey="translationRisk"
            fill="var(--color-brand-soft)"
            radius={[4, 4, 0, 0]}
            maxBarSize={28}
          />
          <Bar
            dataKey="nativeRisk"
            fill="var(--color-risk-high)"
            radius={[4, 4, 0, 0]}
            maxBarSize={28}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
