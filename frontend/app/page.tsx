import Link from 'next/link';
import { ArrowRight, Cpu, FileBarChart2, Languages, ListChecks, Scale, ShieldCheck, EyeOff } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import CoverageGrid from '@/components/shared/CoverageGrid';
import GradientBackgroundLoader from '@/components/shared/GradientBackgroundLoader';
import { LANGUAGES } from '@/lib/constants';

const PIPELINE = [
  {
    n: '01',
    icon: ListChecks,
    title: 'Prompt Builder',
    body: 'Pulls pre-baked translation and native-adapted prompts for the selected languages and categories.',
  },
  {
    n: '02',
    icon: Cpu,
    title: 'Execution Agent',
    body: 'Sends each prompt to the target model or RAG endpoint, with retries and latency timing.',
  },
  {
    n: '03',
    icon: Scale,
    title: 'Judge Agent',
    body: 'Keyword pre-filter, then an LLM judge labels each response against a fixed rubric.',
  },
  {
    n: '04',
    icon: FileBarChart2,
    title: 'Reporting Agent',
    body: 'Aggregates results into the dashboard metrics and a shareable PDF report.',
  },
];

const FEATURES = [
  {
    icon: Languages,
    accent: 'brand' as const,
    title: 'Dual-track by design',
    body: 'Every prompt is tested both as a machine translation and as a native speaker would actually phrase it — the gap between the two is the finding.',
  },
  {
    icon: ShieldCheck,
    accent: 'teal' as const,
    title: 'Built for RAG, not just chat',
    body: 'Out-of-scope refusals are scored correctly for retrieval-grounded targets instead of being penalized as evasive.',
  },
  {
    icon: EyeOff,
    accent: 'pink' as const,
    title: 'Nothing unsafe rendered by default',
    body: 'Raw model responses are stored for the audit trail but stay behind an explicit internal-only toggle in the UI.',
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
const LANGUAGE_ACCENTS = ['brand', 'teal', 'pink', 'plum'] as const;

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
                Chaukidar audits language models and RAG systems across Urdu,
                Punjabi, Pashto, and Sindhi — comparing a translated
                baseline against native-adapted prompts so safety gaps
                outside English don&rsquo;t stay invisible.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/audits/new"
                  className="group inline-flex items-center gap-2 rounded-sm bg-brand px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-soft"
                >
                  Run a sample audit
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

        {/* Languages */}
        <section id="coverage" className="relative overflow-hidden">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                'radial-gradient(circle at 20% 80%, var(--color-accent-teal-tint) 0%, transparent 42%), radial-gradient(circle at 80% 20%, var(--color-accent-pink-tint) 0%, transparent 40%)',
            }}
          />
          <div className="dot-pattern absolute inset-0 opacity-[0.06]" />
          <div
            className="bg-blob left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 animate-float bg-accent-plum/5"
            style={{ animationDelay: '1.5s' }}
          />
          <div className="relative mx-auto max-w-shell px-6 py-16">
            <h2 className="mb-8 font-display text-xl font-bold text-ink">
              Languages covered
            </h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {LANGUAGES.map((lang, i) => {
                const cls = ACCENT_CLASSES[LANGUAGE_ACCENTS[i % LANGUAGE_ACCENTS.length]];
                return (
                  <div
                    key={lang.code}
                    className={`group rounded-lg border border-line bg-paper-raised/95 p-6 text-center shadow-[0_6px_20px_-16px_rgba(20,21,27,0.25)] backdrop-blur-sm transition duration-300 hover:-translate-y-1 hover:shadow-[0_16px_40px_-20px_rgba(20,21,27,0.25)] ${cls.ring}`}
                  >
                    <div className="font-display text-3xl text-ink" dir="rtl">
                      {lang.nativeLabel}
                    </div>
                    <div className="mt-2 text-xs text-ink-soft">{lang.label}</div>
                    <div className={`mx-auto mt-3 h-[3px] w-8 rounded-full ${cls.bar} opacity-80 transition group-hover:w-12`} />
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
            <span className="font-mono">Inference on AMD ROCm / MI300X</span>
          </div>
        </footer>
      </main>
    </>
  );
}
