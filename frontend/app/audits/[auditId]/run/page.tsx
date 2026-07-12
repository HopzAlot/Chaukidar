'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Sidebar from '@/components/layout/Sidebar';
import AuditProgressBar from '@/components/audit/AuditProgressBar';
import Badge from '@/components/shared/Badge';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { RESULT_LABEL_META } from '@/lib/constants';
import { getAuditResults, getAuditRun, startAuditRun } from '@/lib/api';
import type { AuditResult, AuditRun } from '@/lib/types';

const POLL_INTERVAL_MS = 2000;

export default function AuditRunPage() {
  const params = useParams<{ auditId: string }>();
  const auditId = Number(params.auditId);
  const router = useRouter();

  const [run, setRun] = useState<AuditRun | null>(null);
  const [recent, setRecent] = useState<AuditResult[]>([]);
  const [retrying, setRetrying] = useState(false);
  const [retryError, setRetryError] = useState<string | null>(null);
  const [pollVersion, setPollVersion] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inFlightRef = useRef(false);
  const lastProgressRef = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    lastProgressRef.current = null;

    async function poll() {
      if (inFlightRef.current) return;
      inFlightRef.current = true;
      try {
        const nextRun = await getAuditRun(auditId);
        if (cancelled) return;

        const progressChanged = nextRun.progress_current !== lastProgressRef.current;
        const terminal = nextRun.status === 'completed' || nextRun.status === 'failed';
        setRun(nextRun);

        if (progressChanged || terminal) {
          lastProgressRef.current = nextRun.progress_current;
          const results = await getAuditResults(auditId);
          if (!cancelled) setRecent(results.slice(-3));
        }

        if (terminal && timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      } catch (reason) {
        if (!cancelled) {
          setRetryError(reason instanceof Error ? reason.message : 'Unable to poll audit status.');
        }
      } finally {
        inFlightRef.current = false;
      }
    }

    poll();
    timerRef.current = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [auditId, pollVersion]);

  async function handleRetry() {
    setRetrying(true);
    setRetryError(null);
    try {
      await startAuditRun(auditId);
      setRun((current) => current ? { ...current, status: 'running', progress_current: 0, progress_total: 0 } : current);
      setRecent([]);
      setPollVersion((value) => value + 1);
    } catch (reason) {
      setRetryError(reason instanceof Error ? reason.message : 'Unable to retry audit.');
    } finally {
      setRetrying(false);
    }
  }

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

                {retryError && (
                  <p className="rounded-md border border-risk-high bg-risk-high-tint px-4 py-3 text-sm text-risk-high">
                    {retryError}
                  </p>
                )}

                <div className="flex flex-wrap gap-3">
                  {run.status === 'failed' && (
                    <button
                      type="button"
                      onClick={handleRetry}
                      disabled={retrying}
                      className="rounded-sm bg-brand px-5 py-3 text-sm font-medium text-white transition hover:bg-brand-soft disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {retrying ? 'Retrying...' : 'Retry run'}
                    </button>
                  )}

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
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
