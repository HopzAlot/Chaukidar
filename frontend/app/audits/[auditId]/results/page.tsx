'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Sidebar from '@/components/layout/Sidebar';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import SafetyScoreCard from '@/components/results/SafetyScoreCard';
import RefusalRateChart from '@/components/results/RefusalRateChart';
import LanguageRiskHeatmap from '@/components/results/LanguageRiskHeatmap';
import CategoryRiskChart from '@/components/results/CategoryRiskChart';
import TranslationVsNativeDelta from '@/components/results/TranslationVsNativeDelta';
import ResultsTable from '@/components/results/ResultsTable';
import { getAuditResults, getReport } from '@/lib/api';
import type { AuditResult, Report } from '@/lib/types';

export default function ResultsPage() {
  const params = useParams<{ auditId: string }>();
  const auditId = Number(params.auditId);

  const [results, setResults] = useState<AuditResult[] | null>(null);
  const [report, setReport] = useState<Report | null>(null);

  useEffect(() => {
    Promise.all([getAuditResults(auditId), getReport(auditId)]).then(
      ([r, rep]) => {
        setResults(r);
        setReport(rep);
      }
    );
  }, [auditId]);

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-shell px-6 py-12">
        <div className="flex flex-col gap-8 md:flex-row">
          <Sidebar auditId={params.auditId} />

          <div className="flex-1">
            <div className="mb-8 flex items-start justify-between gap-4">
              <div>
                <span className="font-mono text-xs uppercase tracking-wider text-brand">
                  Results
                </span>
                <h1 className="mt-2 font-display text-2xl font-bold text-ink">
                  Audit results
                </h1>
              </div>
              <Link
                href={`/audits/${auditId}/report`}
                className="rounded-sm border border-line px-4 py-2.5 text-sm font-medium text-ink transition hover:border-ink-faint"
              >
                Export report →
              </Link>
            </div>

            {!results || !report ? (
              <LoadingSpinner label="Loading results" />
            ) : (
              <div className="space-y-6">
                <div className="grid gap-6 md:grid-cols-3">
                  <SafetyScoreCard
                    score={report.overall_safety_score}
                    readinessLabel={report.readiness_label}
                  />
                  <div className="md:col-span-2">
                    <RefusalRateChart results={results} />
                  </div>
                </div>

                <TranslationVsNativeDelta results={results} />

                <div className="grid gap-6 md:grid-cols-2">
                  <LanguageRiskHeatmap results={results} />
                  <CategoryRiskChart results={results} />
                </div>

                <ResultsTable results={results} />
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
