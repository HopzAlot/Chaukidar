'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Activity, BarChart3, FileText } from 'lucide-react';
import { useParams } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Badge from '@/components/shared/Badge';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { listAuditRuns } from '@/lib/api';
import type { AuditRun } from '@/lib/types';

const STATUS_TONE = {
  completed: 'safe',
  failed: 'high',
  running: 'review',
  pending: 'neutral',
} as const;

function modelLabel(audit: AuditRun) {
  return audit.target_model_name ?? `Model #${audit.target_model_id}`;
}

export default function AuditGroupPage() {
  const params = useParams<{ groupName: string }>();
  const groupName = decodeURIComponent(params.groupName);
  const [audits, setAudits] = useState<AuditRun[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listAuditRuns()
      .then(setAudits)
      .catch((reason) => setError(reason instanceof Error ? reason.message : 'Unable to load audit group.'));
  }, []);

  const runs = useMemo(
    () => (audits ?? [])
      .filter((audit) => audit.name === groupName)
      .sort((a, b) => modelLabel(a).localeCompare(modelLabel(b))),
    [audits, groupName]
  );

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-shell px-6 py-12">
        <div className="mb-8">
          <Link href="/audits" className="mb-5 inline-flex items-center gap-2 text-sm text-ink-soft transition hover:text-ink">
            <ArrowLeft size={15} /> Audit groups
          </Link>
          <span className="block font-mono text-xs uppercase tracking-wider text-brand">Audit group</span>
          <h1 className="mt-2 font-display text-2xl font-bold text-ink">{groupName}</h1>
          <p className="mt-1 text-sm text-ink-soft">
            One run per model, grouped under this experiment name.
          </p>
        </div>

        {error && <p className="rounded-md border border-risk-high bg-risk-high-tint p-4 text-sm text-risk-high">{error}</p>}
        {!error && audits === null && <LoadingSpinner label="Loading model runs" />}
        {audits !== null && runs.length === 0 && (
          <p className="rounded-md border border-line bg-paper-raised p-4 text-sm text-ink-soft">
            No model runs found for this group.
          </p>
        )}

        <div className="space-y-3">
          {runs.map((audit) => (
            <div key={audit.id} className="rounded-lg border border-line bg-paper-raised p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="break-all font-mono text-xs font-semibold text-ink">{modelLabel(audit)}</h2>
                    <Badge tone={STATUS_TONE[audit.status]}>{audit.status}</Badge>
                  </div>
                  <p className="mt-2 text-xs text-ink-faint">
                    Audit #{audit.id} · {audit.progress_current}/{audit.progress_total || '...'} prompts · {new Date(audit.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link href={`/audits/${audit.id}/run`} className="inline-flex items-center gap-2 rounded-sm border border-line px-3 py-2 text-sm font-medium text-ink transition hover:border-brand/40">
                    <Activity size={14} /> Live run
                  </Link>
                  <Link href={`/audits/${audit.id}/results`} className="inline-flex items-center gap-2 rounded-sm border border-line px-3 py-2 text-sm font-medium text-ink transition hover:border-brand/40">
                    <BarChart3 size={14} /> Results
                  </Link>
                  <Link href={`/audits/${audit.id}/report`} className="inline-flex items-center gap-2 rounded-sm bg-brand px-3 py-2 text-sm font-medium text-white transition hover:bg-brand-soft">
                    <FileText size={14} /> Report
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
