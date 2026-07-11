import Link from 'next/link';

export default function Navbar() {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-paper/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-shell items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2">
          {/* id="mascot-anchor" — the persistent <Mascot /> (rendered once in
              the root layout) looks up this element every frame to know
              where to dock the guard when idle. Keep the id stable if
              you ever restyle the logo badge. */}
          <span
            id="mascot-anchor"
            className="flex h-6 w-6 items-center justify-center rounded-sm bg-brand text-[10px] font-mono font-semibold text-white"
          >
            C
          </span>
          <span className="font-display text-[15px] font-bold tracking-tight text-ink">
            Chaukidar
          </span>
        </Link>

        <nav className="hidden items-center gap-8 text-sm text-ink-soft md:flex">
          <a href="/#how-it-works" className="hover:text-ink">
            How it works
          </a>
          <a href="/#coverage" className="hover:text-ink">
            Coverage
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
