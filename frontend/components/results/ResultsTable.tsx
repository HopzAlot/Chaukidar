'use client';

import { useMemo, useState } from 'react';
import Badge from '@/components/shared/Badge';
import { HARM_CATEGORIES, LANGUAGES, RESULT_LABEL_META, TRACK_LABELS } from '@/lib/constants';
import type { AuditResult } from '@/lib/types';

const CAN_SHOW_RAW = process.env.NODE_ENV !== 'production';

export default function ResultsTable({ results }: { results: AuditResult[] }) {
  const [language, setLanguage] = useState('');
  const [category, setCategory] = useState('');
  const [showRaw, setShowRaw] = useState(false);

  const effectiveShowRaw = CAN_SHOW_RAW && showRaw;

  const filtered = useMemo(
    () =>
      results.filter(
        (r) =>
          (!language || r.language === language) &&
          (!category || r.harm_category === category)
      ),
    [results, language, category]
  );

  return (
    <div className="rounded-lg border border-line bg-paper-raised p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-display text-sm font-bold text-ink">
          Results ({filtered.length})
        </h3>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="rounded-sm border border-line bg-paper px-2.5 py-1.5 text-xs"
          >
            <option value="">All languages</option>
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.label}
              </option>
            ))}
          </select>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-sm border border-line bg-paper px-2.5 py-1.5 text-xs"
          >
            <option value="">All categories</option>
            {HARM_CATEGORIES.map((c) => (
              <option key={c.key} value={c.key}>
                {c.displayName}
              </option>
            ))}
          </select>
          {CAN_SHOW_RAW && (
            <button
              type="button"
              onClick={() => setShowRaw((v) => !v)}
              className={`rounded-sm border px-2.5 py-1.5 text-xs font-medium ${
                showRaw
                  ? 'border-risk-high bg-risk-high-tint text-risk-high'
                  : 'border-line text-ink-soft hover:border-ink-faint'
              }`}
            >
              {showRaw ? 'Hide raw (internal only)' : 'Show raw (internal only)'}
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-line text-left font-mono text-[10px] uppercase tracking-wide text-ink-faint">
              <th className="py-2 pr-3">Language</th>
              <th className="py-2 pr-3">Track</th>
              <th className="py-2 pr-3">Category</th>
              <th className="py-2 pr-3">Label</th>
              <th className="py-2 pr-3">Risk</th>
              <th className="py-2 pr-3">Explanation</th>
              {effectiveShowRaw && <th className="py-2 pr-3">Raw response</th>}
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => {
              const meta = RESULT_LABEL_META[r.label];
              return (
                <tr key={r.id} className="border-b border-line/70 align-top">
                  <td className="py-2.5 pr-3 text-ink-soft">
                    {LANGUAGES.find((l) => l.code === r.language)?.label ?? r.language}
                  </td>
                  <td className="py-2.5 pr-3 text-ink-soft">{TRACK_LABELS[r.track]}</td>
                  <td className="py-2.5 pr-3 text-ink-soft">
                    {HARM_CATEGORIES.find((c) => c.key === r.harm_category)?.displayName}
                  </td>
                  <td className="py-2.5 pr-3">
                    <Badge tone={meta?.tone ?? 'neutral'}>{meta?.display ?? r.label}</Badge>
                  </td>
                  <td className="py-2.5 pr-3 font-mono font-tabular text-ink">{r.risk_score}</td>
                  <td className="max-w-xs py-2.5 pr-3 text-ink-soft">{r.judge_explanation}</td>
                  {effectiveShowRaw && (
                    <td className="max-w-xs py-2.5 pr-3 font-mono text-xs text-ink-faint">
                      {r.raw_response_text}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
