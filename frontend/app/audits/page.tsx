'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { ArrowRight, Folder, Plus } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Badge from '@/components/shared/Badge';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { listAuditRuns } from '@/lib/api';
import { useAsyncResource } from '@/hooks/useAsyncResource';
import { displayModelName } from '@/lib/model-label';
import type { AuditRun } from '@/lib/types';

const STATUS_TONE = {
  completed: 'safe',
  failed: 'high',
  running: 'review',
  pending: 'neutral',
} as const;

function groupStatus(audits: AuditRun[]): AuditRun['status'] {
  if (audits.some((audit) => audit.status === 'running')) return 'running';
  if (audits.some((audit) => audit.status === 'pending')) return 'pending';
  if (audits.some((audit) => audit.status === 'failed')) return 'failed';
  return 'completed';
}

export default function AuditsPage() {
  const { data: audits, error, loading } = useAsyncResource(listAuditRuns, []);

  const groups = useMemo(() => {
    if (!audits) return [];
    const byName = new Map<string, AuditRun[]>();
    for (const audit of audits) {
      byName.set(audit.name, [...(byName.get(audit.name) ?? []), audit]);
    }
    return Array.from(byName.entries()).map(([name, runs]) => ({
      name,
      runs,
      status: groupStatus(runs),
      createdAt: runs.reduce((latest, audit) => audit.created_at > latest ? audit.created_at : latest, runs[0].created_at),
    })).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [audits]);

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-shell px-6 py-12">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <span className="font-mono text-xs uppercase text-brand">Audit history</span>
            <h1 className="mt-2 font-display text-2xl font-bold text-ink">Past audit groups</h1>
          </div>
          <Link href="/audits/new" className="inline-flex items-center gap-2 rounded-sm bg-brand px-4 py-2.5 text-sm font-medium text-white">
            <Plus size={15} /> New audit
          </Link>
        </div>

        {error && <p className="rounded-md border border-risk-high bg-risk-high-tint p-4 text-sm text-risk-high">{error}</p>}
        {!error && loading && <LoadingSpinner label="Loading audit groups" />}
        {groups.length === 0 && audits !== null && <p className="text-sm text-ink-soft">No audits yet.</p>}

        <div className="space-y-3">
          {groups.map((group) => (
            <Link
              key={group.name}
              href={`/audits/groups/${encodeURIComponent(group.name)}`}
              className="flex items-center justify-between gap-4 rounded-lg border border-line bg-paper-raised p-5 transition hover:border-brand/40"
            >
              <div className="flex min-w-0 items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-brand-tint text-brand">
                  <Folder size={18} />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="truncate font-display text-sm font-bold text-ink">{displayModelName(group.name)}</h2>
                    <Badge tone={STATUS_TONE[group.status]}>{group.status}</Badge>
                  </div>
                  <p className="mt-2 text-xs text-ink-faint">
                    {group.runs.length} model {group.runs.length === 1 ? 'run' : 'runs'} · {new Date(group.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
              <ArrowRight className="shrink-0 text-brand" size={17} />
            </Link>
          ))}
        </div>
      </main>
    </>
  );
}
