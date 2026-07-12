'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { AuditResult } from '@/lib/types';
import { buildResultMetrics, getRefusalRateData } from '@/lib/result-metrics';

export default function RefusalRateChart({ results }: { results: AuditResult[] }) {
  const data = getRefusalRateData(buildResultMetrics(results));

  return (
    <div className="rounded-lg border border-line bg-paper-raised p-6">
      <h3 className="mb-4 font-display text-sm font-bold text-ink">
        Refusal rate by language
      </h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ left: -20 }}>
          <CartesianGrid vertical={false} stroke="var(--color-line)" />
          <XAxis
            dataKey="language"
            tick={{ fontSize: 11, fill: 'var(--color-ink-soft)' }}
            tickLine={false}
            axisLine={{ stroke: 'var(--color-line)' }}
          />
          <YAxis
            tick={{ fontSize: 11, fill: 'var(--color-ink-soft)' }}
            tickLine={false}
            axisLine={false}
            unit="%"
          />
          <Tooltip
            cursor={{ fill: 'var(--color-brand-tint)' }}
            contentStyle={{
              borderRadius: 6,
              borderColor: 'var(--color-line)',
              fontSize: 12,
            }}
          />
          <Bar dataKey="rate" fill="var(--color-brand)" radius={[4, 4, 0, 0]} maxBarSize={44} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
