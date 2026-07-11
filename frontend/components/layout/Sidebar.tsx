'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const STEPS = [
  { key: 'run', label: 'Live run', path: (id: string) => `/audits/${id}/run` },
  { key: 'results', label: 'Results', path: (id: string) => `/audits/${id}/results` },
  { key: 'report', label: 'Report', path: (id: string) => `/audits/${id}/report` },
];

export default function Sidebar({ auditId }: { auditId: string }) {
  const pathname = usePathname();

  return (
    <aside className="w-full shrink-0 border-b border-line md:w-52 md:border-b-0 md:border-r md:pr-6">
      <div className="mb-4 hidden font-mono text-xs uppercase tracking-wider text-ink-faint md:block">
        Audit #{auditId}
      </div>
      <nav className="flex gap-1 overflow-x-auto md:flex-col md:overflow-visible">
        {STEPS.map((step) => {
          const href = step.path(auditId);
          const active = pathname === href;
          return (
            <Link
              key={step.key}
              href={href}
              className={`whitespace-nowrap rounded-sm px-3 py-2 text-sm transition ${
                active
                  ? 'bg-brand-tint font-medium text-brand'
                  : 'text-ink-soft hover:bg-ink/5 hover:text-ink'
              }`}
            >
              {step.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
