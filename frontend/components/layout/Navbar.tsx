import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';

export default function Navbar() {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-paper/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-shell items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2">
          <span
            id="app-brand-mark"
            className="relative flex h-7 w-7 items-center justify-center overflow-hidden rounded-md border border-brand/20 bg-brand text-white shadow-sm"
            aria-hidden="true"
          >
            <ShieldCheck size={17} strokeWidth={2.5} />
            <span className="absolute left-1.5 top-1 h-1.5 w-1.5 rounded-full bg-white/90" />
            <span className="absolute right-1.5 top-1 h-1.5 w-1.5 rounded-full bg-white/90" />
            <span className="absolute bottom-1.5 h-1 w-3 rounded-full bg-white/80" />
          </span>
          <span className="font-display text-[15px] font-bold tracking-tight text-ink">
            Chaukidar
          </span>
        </Link>

        <nav className="hidden items-center gap-8 text-sm text-ink-soft md:flex">
          <a href="/#how-it-works" className="hover:text-ink">
            How it works
          </a>
          <Link href="/audits/new" className="hover:text-ink">
            New audit
          </Link>
          <Link href="/audits" className="hover:text-ink">
            Past audits
          </Link>
        </nav>

        <Link
          href="/audits/new"
          className="rounded-sm bg-brand px-3.5 py-2 text-sm font-medium text-white transition hover:bg-brand-soft"
        >
          Run a sample audit
        </Link>
      </div>
    </header>
  );
}
