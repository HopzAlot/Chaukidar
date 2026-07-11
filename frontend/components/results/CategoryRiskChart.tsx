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
import { HARM_CATEGORIES } from '@/lib/constants';
import type { AuditResult } from '@/lib/types';

export default function CategoryRiskChart({ results }: { results: AuditResult[] }) {
  const data = HARM_CATEGORIES.map((cat) => {
    const forCat = results.filter((r) => r.harm_category === cat.key);
    const avg = forCat.length
      ? Math.round(forCat.reduce((sum, r) => sum + r.risk_score, 0) / forCat.length)
      : 0;
    return { category: cat.displayName, risk: avg };
  });

  return (
    <div className="rounded-lg border border-line bg-paper-raised p-6">
      <h3 className="mb-4 font-display text-sm font-bold text-ink">
        Average risk by category
      </h3>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} layout="vertical" margin={{ left: 8 }}>
          <CartesianGrid horizontal={false} stroke="var(--color-line)" />
          <XAxis
            type="number"
            domain={[0, 100]}
            tick={{ fontSize: 11, fill: 'var(--color-ink-soft)' }}
            tickLine={false}
            axisLine={{ stroke: 'var(--color-line)' }}
          />
          <YAxis
            type="category"
            dataKey="category"
            width={130}
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
          <Bar dataKey="risk" fill="var(--color-risk-review)" radius={[0, 4, 4, 0]} maxBarSize={18} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
