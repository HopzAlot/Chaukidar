'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Sidebar from '@/components/layout/Sidebar';
import AuditProgressBar from '@/components/audit/AuditProgressBar';
import Badge from '@/components/shared/Badge';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { RESULT_LABEL_META } from '@/lib/constants';
import { getAuditResults, getAuditRun } from '@/lib/api';
import type { AuditResult, AuditRun } from '@/lib/types';

const POLL_INTERVAL_MS = 2000;

export default function AuditRunPage() {
  const params = useParams<{ auditId: string }>();
  const auditId = Number(params.auditId);
  const router = useRouter();

  const [run, setRun] = useState<AuditRun | null>(null);
  const [recent, setRecent] = useState<AuditResult[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // The guard patrols (jumps off the logo, paces the top of the screen)
  // for as long as this run is in flight, then heads back to the logo.
  useEffect(() => {
    window.dispatchEvent(new Event('chaukidar:patrol-start'));
    return () => {
      window.dispatchEvent(new Event('chaukidar:patrol-end'));
    };
  }, [auditId]);

  useEffect(() => {
    if (run?.status === 'completed' || run?.status === 'failed') {
      window.dispatchEvent(new Event('chaukidar:patrol-end'));
    }
  }, [run?.status]);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      const [nextRun, results] = await Promise.all([
        getAuditRun(auditId),
        getAuditResults(auditId),
      ]);
      if (cancelled) return;
      setRun(nextRun);
      setRecent(results.slice(-3));

      if (nextRun.status === 'completed' || nextRun.status === 'failed') {
        if (timerRef.current) clearInterval(timerRef.current);
      }
    }

    poll();
    timerRef.current = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [auditId]);

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-shell px-6 py-12">
        <div className="flex flex-col gap-8 md:flex-row">
          <Sidebar auditId={params.auditId} />

          <div className="flex-1">
            <div className="mb-8">
              <span className="font-mono text-xs uppercase tracking-wider text-brand">
                Live run
              </span>
              <h1 className="mt-2 font-display text-2xl font-bold text-ink">
                {run?.name ?? 'Loading audit…'}
              </h1>
            </div>

            {!run ? (
              <LoadingSpinner label="Fetching audit status" />
            ) : (
              <div className="space-y-6">
                <div className="rounded-lg border border-line bg-paper-raised p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <LoadingSpinner
                      label={
                        run.status === 'completed'
                          ? 'Run complete'
                          : run.status === 'failed'
                          ? 'Run failed'
                          : 'Running — polling every 2s'
                      }
                    />
                    <span className="font-mono text-xs uppercase tracking-wider text-ink-faint">
                      {run.status}
                    </span>
                  </div>
                  <AuditProgressBar current={run.progress_current} total={run.progress_total} />
                </div>

                <div className="rounded-lg border border-line bg-paper-raised p-6">
                  <h3 className="mb-3 font-display text-sm font-bold text-ink">
                    Last labeled prompts
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {recent.length === 0 && (
                      <p className="text-sm text-ink-faint">Waiting for first results…</p>
                    )}
                    {recent.map((r) => (
                      <Badge key={r.id} tone={RESULT_LABEL_META[r.label]?.tone ?? 'neutral'}>
                        {RESULT_LABEL_META[r.label]?.display ?? r.label}
                      </Badge>
                    ))}
                  </div>
                  <p className="mt-3 text-xs text-ink-faint">
                    Raw response text is never shown on this page — only the
                    judged label.
                  </p>
                </div>

                {run.status === 'completed' && (
                  <button
                    type="button"
                    onClick={() => router.push(`/audits/${auditId}/results`)}
                    className="rounded-sm bg-brand px-5 py-3 text-sm font-medium text-white transition hover:bg-brand-soft"
                  >
                    View results dashboard
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
