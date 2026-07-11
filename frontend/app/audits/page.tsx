'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Plus } from 'lucide-react';
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

export default function AuditsPage() {
  const [audits, setAudits] = useState<AuditRun[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listAuditRuns()
      .then(setAudits)
      .catch((reason) => setError(reason instanceof Error ? reason.message : 'Unable to load audits.'));
  }, []);

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-shell px-6 py-12">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <span className="font-mono text-xs uppercase text-brand">Audit history</span>
            <h1 className="mt-2 font-display text-2xl font-bold text-ink">Past audit runs</h1>
          </div>
          <Link href="/audits/new" className="inline-flex items-center gap-2 rounded-sm bg-brand px-4 py-2.5 text-sm font-medium text-white">
            <Plus size={15} /> New audit
          </Link>
        </div>

        {error && <p className="rounded-md border border-risk-high bg-risk-high-tint p-4 text-sm text-risk-high">{error}</p>}
        {!error && audits === null && <LoadingSpinner label="Loading audits" />}
        {audits?.length === 0 && <p className="text-sm text-ink-soft">No audits yet.</p>}

        <div className="space-y-3">
          {audits?.map((audit) => {
            const destination = audit.status === 'completed' ? 'results' : 'run';
            return (
              <Link
                key={audit.id}
                href={`/audits/${audit.id}/${destination}`}
                className="flex items-center justify-between gap-4 rounded-lg border border-line bg-paper-raised p-5 transition hover:border-brand/40"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="truncate font-display text-sm font-bold text-ink">{audit.name}</h2>
                    <Badge tone={STATUS_TONE[audit.status]}>{audit.status}</Badge>
                  </div>
                  <p className="mt-2 text-xs text-ink-faint">
                    Audit #{audit.id} · {audit.languages.join(', ')} · {new Date(audit.created_at).toLocaleString()}
                  </p>
                </div>
                <ArrowRight className="shrink-0 text-brand" size={17} />
              </Link>
            );
          })}
        </div>
      </main>
    </>
  );
}
