'use client';

import { useParams } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Sidebar from '@/components/layout/Sidebar';
import Badge from '@/components/shared/Badge';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { READINESS_TONE } from '@/lib/constants';
import { getAuditResults, getReport } from '@/lib/api';
import { formatDateTime } from '@/lib/datetime';
import { useAsyncResource } from '@/hooks/useAsyncResource';
import type { AuditResult, Report } from '@/lib/types';
import { buildResultMetrics, getLanguageReportRows } from '@/lib/result-metrics';

export default function ReportPage() {
  const params = useParams<{ auditId: string }>();
  const auditId = Number(params.auditId);

  const { data, error } = useAsyncResource(
    () => Promise.all([getReport(auditId), getAuditResults(auditId)]),
    [auditId]
  );
  const report = data?.[0] ?? null;
  const results = data?.[1] ?? [];

  function handleDownload() {
    window.print();
  }

  return (
    <>
      <div className="no-print">
        <Navbar />
      </div>
      <main className="mx-auto max-w-shell px-6 py-12">
        <div className="flex flex-col gap-8 md:flex-row">
          <div className="no-print">
            <Sidebar auditId={params.auditId} />
          </div>

          <div className="flex-1">
            <div className="no-print mb-8 flex items-start justify-between gap-4">
              <div>
                <span className="font-mono text-xs uppercase tracking-wider text-brand">
                  Report
                </span>
                <h1 className="mt-2 font-display text-2xl font-bold text-ink">
                  Report export
                </h1>
                <p className="mt-1 text-xs text-ink-faint">
                  Choose &ldquo;Save as PDF&rdquo; in the print dialog.
                </p>
              </div>
              {report && (
                <button
                  type="button"
                  onClick={handleDownload}
                  className="rounded-sm bg-brand px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-soft"
                >
                  Download PDF
                </button>
              )}
            </div>

            {error ? (
              <p className="rounded-md border border-risk-high bg-risk-high-tint p-4 text-sm text-risk-high">{error}</p>
            ) : !report ? (
              <LoadingSpinner label="Generating report preview" />
            ) : (
              <ReportPreview report={report} results={results} />
            )}
          </div>
        </div>
      </main>
    </>
  );
}

function ReportPreview({ report, results }: { report: Report; results: AuditResult[] }) {
  const byLanguage = getLanguageReportRows(buildResultMetrics(results));

  return (
    <article className="print-area rounded-lg border border-line bg-paper-raised p-8">
      <header className="mb-8 flex items-center justify-between border-b border-line pb-6">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-wider text-brand">
            Chaukidar Safety Audit Report
          </div>
          <h2 className="mt-1 font-display text-xl font-bold text-ink">
            Audit #{report.audit_run_id}
          </h2>
        </div>
        <Badge tone={READINESS_TONE[report.readiness_label] ?? 'neutral'}>
          {report.readiness_label}
        </Badge>
      </header>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <div className="font-mono text-xs uppercase tracking-wider text-ink-faint">
            Overall safety score
          </div>
          <div className="mt-1 font-display text-4xl font-bold text-ink">
            {Math.round(report.overall_safety_score)}
            <span className="text-lg text-ink-faint"> / 100</span>
          </div>
        </div>
        <div>
          <div className="font-mono text-xs uppercase tracking-wider text-ink-faint">
            Generated
          </div>
          <div className="mt-1 text-sm text-ink-soft">
            {formatDateTime(report.generated_at)}
          </div>
        </div>
      </div>

      <div className="mt-8">
        <h3 className="mb-3 font-display text-sm font-bold text-ink">
          Risk by language
        </h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left font-mono text-[10px] uppercase tracking-wide text-ink-faint">
              <th className="py-2 pr-3">Language</th>
              <th className="py-2 pr-3">English seed</th>
              <th className="py-2 pr-3">Translation baseline</th>
              <th className="py-2 pr-3">Native-adapted</th>
              <th className="py-2 pr-3">Overall</th>
            </tr>
          </thead>
          <tbody>
            {byLanguage.map((row) => (
              <tr key={row.lang.code} className="border-b border-line/70">
                <td className="py-2 pr-3 text-ink-soft">{row.lang.label}</td>
                <td className="py-2 pr-3 font-mono font-tabular text-ink">{row.englishRisk}</td>
                <td className="py-2 pr-3 font-mono font-tabular text-ink">{row.translationRisk}</td>
                <td className="py-2 pr-3 font-mono font-tabular text-ink">{row.nativeRisk}</td>
                <td className="py-2 pr-3 font-mono font-tabular text-ink">{row.avg}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-8 text-sm leading-relaxed text-ink-soft">
        This report includes
        per-language and per-category breakdowns, the translation-vs-native
        delta, and methodology notes on the sanitized prompt dataset.
      </p>
    </article>
  );
}
