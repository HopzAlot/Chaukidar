import Link from 'next/link';
import { ArrowRight, Cpu, Database, FileBarChart2, Languages, ListChecks, Scale, ShieldCheck, UploadCloud } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import CoverageGrid from '@/components/shared/CoverageGrid';
import GradientBackgroundLoader from '@/components/shared/GradientBackgroundLoader';

const PIPELINE = [
  {
    n: '01',
    icon: ListChecks,
    title: 'Prompt Builder',
    body: 'Builds English seed, translation-baseline, and native-adapted prompt sets from seeded or uploaded datasets.',
  },
  {
    n: '02',
    icon: Cpu,
    title: 'Execution Agent',
    body: 'Runs prompts through registered Fireworks models, or imports AMD ROCm/vLLM notebook result JSON.',
  },
  {
    n: '03',
    icon: Scale,
    title: 'Judge Agent',
    body: 'Uses a GPT-based multilingual judge with a rule fallback to label refusals, partial compliance, and unsafe completions.',
  },
  {
    n: '04',
    icon: FileBarChart2,
    title: 'Reporting Agent',
    body: 'Stores results in the database, then aggregates safety score, risk heatmaps, and model-level reports.',
  },
];

const FEATURES = [
  {
    icon: Languages,
    accent: 'brand' as const,
    title: 'Three-track comparison',
    body: 'Audits English seed prompts beside translation-baseline and native-adapted South Asian prompts, so regressions are visible by track.',
  },
  {
    icon: UploadCloud,
    accent: 'teal' as const,
    title: 'Bring your own dataset',
    body: 'Upload a validated JSON dataset after deployment; Chaukidar stores it in the database and uses it in future audits.',
  },
  {
    icon: Database,
    accent: 'pink' as const,
    title: 'Production-ready seed path',
    body: 'When the production database is empty, a sanitized demo dataset seeds automatically so the live app starts with real records.',
  },
];

const ACCENT_CLASSES = {
  brand: {
    card: 'bg-brand-tint',
    chip: 'bg-brand text-white',
    bar: 'bg-brand',
    ring: 'hover:border-brand/40',
  },
  teal: {
    card: 'bg-accent-teal-tint',
    chip: 'bg-accent-teal text-white',
    bar: 'bg-accent-teal',
    ring: 'hover:border-accent-teal/40',
  },
  plum: {
    card: 'bg-accent-plum-tint',
    chip: 'bg-accent-plum text-white',
    bar: 'bg-accent-plum',
    ring: 'hover:border-accent-plum/40',
  },
  pink: {
    card: 'bg-accent-pink-tint',
    chip: 'bg-accent-pink text-white',
    bar: 'bg-accent-pink',
    ring: 'hover:border-accent-pink/40',
  },
};

const FEATURE_TILT = ['-rotate-[0.6deg]', 'rotate-0', 'rotate-[0.6deg]'];

const LANGUAGE_COVERAGE = [
  { english: 'English', local: 'English', urdu: 'انگریزی' },
  { english: 'Urdu', local: 'اردو', urdu: 'اردو' },
  { english: 'Punjabi', local: 'پنجابی', urdu: 'پنجابی' },
  { english: 'Pashto', local: 'پښتو', urdu: 'پشتو' },
  { english: 'Sindhi', local: 'سنڌي', urdu: 'سندھی' },
];

export default function LandingPage() {
  return (
    <>
      <Navbar />
      <main className="overflow-x-clip">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-line">
          <GradientBackgroundLoader />
          <div className="relative mx-auto grid max-w-shell gap-10 px-6 py-20 md:grid-cols-2 md:items-center md:py-28">
            <div className="animate-rise">
              <span className="text-legible mb-5 inline-block font-mono text-xs font-medium uppercase tracking-wider text-brand">
                AI Safety Audit Platform
              </span>
              <h1 className="text-legible font-display text-4xl font-bold leading-[1.1] tracking-tight text-ink md:text-5xl">
                Your model refuses harmful requests in English.
                <br />
                <span className="text-brand">Does it refuse them in Urdu?</span>
              </h1>
              <p className="text-legible mt-5 max-w-md text-[15px] leading-relaxed text-ink-soft">
                Chaukidar audits language models across English, Urdu,
                Punjabi, Pashto, and Sindhi — comparing English seed,
                translated baseline, and native-adapted prompts so safety
                gaps outside English don&rsquo;t stay invisible.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/audits/new"
                  className="group inline-flex items-center gap-2 rounded-sm bg-brand px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-soft"
                >
                  Run an audit
                  <ArrowRight size={15} className="transition group-hover:translate-x-0.5" />
                </Link>
                <Link
                  href="/audits"
                  className="rounded-sm border border-ink/20 bg-paper-raised/70 px-5 py-3 text-sm font-semibold text-ink backdrop-blur-sm transition hover:border-ink-faint"
                >
                  View past audits
                </Link>
              </div>
            </div>
            <div className="animate-rise" style={{ animationDelay: '120ms' }}>
              <CoverageGrid />
            </div>
          </div>
        </section>


        {/* Language coverage */}
        <section className="border-b border-line bg-paper">
          <div className="mx-auto max-w-shell px-6 py-16">
            <div className="mb-8 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <span className="font-mono text-xs uppercase tracking-wider text-brand">Language coverage</span>
                <h2 className="mt-2 font-display text-xl font-bold text-ink">Five-language audit surface</h2>
              </div>
              <p className="max-w-xl text-sm leading-relaxed text-ink-soft">
                The seeded demo dataset covers every harm category, while uploaded datasets extend the same database-backed prompt pool for future audits.
              </p>
            </div>
            <div className="grid gap-3 md:grid-cols-5">
              {LANGUAGE_COVERAGE.map((language) => (
                <div key={language.english} className="rounded-lg border border-line bg-paper-raised p-4">
                  <div className="font-display text-sm font-bold text-ink">{language.english}</div>
                  <div className="mt-1 text-sm text-ink-soft">{language.urdu}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why it matters */}
        <section className="relative overflow-hidden border-b border-line">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                'radial-gradient(circle at 12% 15%, var(--color-brand-tint) 0%, transparent 42%), radial-gradient(circle at 88% 12%, var(--color-accent-pink-tint) 0%, transparent 40%), radial-gradient(circle at 50% 95%, var(--color-accent-teal-tint) 0%, transparent 45%)',
            }}
          />
          <div className="dot-pattern absolute inset-0 opacity-[0.06]" />
          <div
            className="bg-blob left-[-6%] top-[-10%] h-72 w-72 animate-float bg-brand/10"
            style={{ animationDelay: '0s' }}
          />
          <div
            className="bg-blob right-[-8%] bottom-[-15%] h-80 w-80 animate-float bg-accent-pink/10"
            style={{ animationDelay: '3s' }}
          />
          <div className="relative mx-auto max-w-shell px-6 py-16">
            <h2 className="mb-8 font-display text-xl font-bold text-ink">
              Why English-only safety testing isn&rsquo;t enough
            </h2>
            <div className="grid gap-6 md:grid-cols-3">
              {FEATURES.map((f, i) => {
                const Icon = f.icon;
                const cls = ACCENT_CLASSES[f.accent];
                return (
                  <div
                    key={f.title}
                    className={`group relative overflow-hidden rounded-lg border border-white/70 p-5 shadow-[0_10px_30px_-18px_rgba(20,21,27,0.3)] transition duration-300 hover:-translate-y-1 hover:rotate-0 hover:shadow-[0_18px_44px_-20px_rgba(20,21,27,0.3)] ${cls.card} ${cls.ring} ${FEATURE_TILT[i]}`}
                  >
                    <div className={`mb-4 inline-flex h-10 w-10 items-center justify-center rounded-md shadow-sm ${cls.chip}`}>
                      <Icon size={18} strokeWidth={2.2} />
                    </div>
                    <h3 className="mb-2 font-display text-[15px] font-bold text-ink">
                      {f.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-ink-soft">{f.body}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Pipeline */}
        <section id="how-it-works" className="relative overflow-hidden border-b border-line">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                'radial-gradient(circle at 85% 20%, var(--color-brand-tint) 0%, transparent 46%), radial-gradient(circle at 10% 85%, var(--color-accent-plum-tint) 0%, transparent 42%)',
            }}
          />
          <div className="dot-pattern absolute inset-0 opacity-[0.06]" />
          <div className="relative mx-auto max-w-shell px-6 py-16">
            <h2 className="mb-8 font-display text-xl font-bold text-ink">
              How an audit runs
            </h2>
            <div className="grid gap-4 md:grid-cols-4">
              {PIPELINE.map((step, i) => {
                const Icon = step.icon;
                return (
                  <div key={step.n} className="relative">
                    <div className="group h-full rounded-lg border border-line bg-paper-raised/95 p-5 shadow-[0_6px_20px_-14px_rgba(20,21,27,0.25)] backdrop-blur-sm transition duration-300 hover:-translate-y-1 hover:border-brand/40 hover:shadow-[0_16px_40px_-20px_rgba(35,42,92,0.3)]">
                      <div className="mb-4 flex items-center justify-between">
                        <span className="font-mono text-xs font-medium text-brand">{step.n}</span>
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-tint text-brand transition duration-300 group-hover:bg-brand group-hover:text-white">
                          <Icon size={15} strokeWidth={2} />
                        </div>
                      </div>
                      <h3 className="font-display text-[15px] font-bold text-ink">
                        {step.title}
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-ink-soft">{step.body}</p>
                    </div>
                    {i < PIPELINE.length - 1 && (
                      <div className="absolute right-[-18px] top-1/2 z-10 hidden -translate-y-1/2 text-ink-faint md:block">
                        <ArrowRight size={16} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <footer className="border-t border-line">
          <div className="h-[3px] w-full bg-gradient-to-r from-brand via-accent-pink to-accent-teal opacity-70" />
          <div className="mx-auto flex max-w-shell flex-col items-center justify-between gap-3 px-6 py-8 text-xs text-ink-faint sm:flex-row">
            <span>Chaukidar — built for the AMD Developer Hackathon.</span>
            <span className="font-mono">AMD ROCm/vLLM imports + Fireworks live audits</span>
          </div>
        </footer>
      </main>
    </>
  );
}
