import { HARM_CATEGORIES, LANGUAGES } from '@/lib/constants';

const TONES = ['bg-risk-safe', 'bg-risk-review', 'bg-risk-high'];

// Deterministic pseudo-pattern so the grid looks intentional, not random noise.
function toneFor(row: number, col: number) {
  const v = (row * 5 + col * 3) % 7;
  if (v < 4) return TONES[0];
  if (v < 6) return TONES[1];
  return TONES[2];
}

const COVERED_LANGUAGES = [
  { code: 'en', label: 'English' },
  ...LANGUAGES,
];

export default function CoverageGrid() {
  return (
    <div className="relative rounded-lg border-2 border-white bg-paper-raised p-5 shadow-[0_24px_70px_-20px_rgba(226,63,142,0.35),0_10px_36px_-16px_rgba(35,42,92,0.3)]">
      <div className="mb-3 font-mono text-[10px] font-medium uppercase tracking-wider text-ink-soft">
        Coverage matrix — live scan
      </div>
      <div
        className="grid gap-1.5"
        style={{ gridTemplateColumns: `repeat(${HARM_CATEGORIES.length}, minmax(0, 1fr))` }}
      >
        {COVERED_LANGUAGES.map((lang, row) =>
          HARM_CATEGORIES.map((cat, col) => (
            <div
              key={`${lang.code}-${cat.key}`}
              className={`aspect-square rounded-[3px] ring-1 ring-white/50 ${toneFor(row, col)} animate-scan`}
              style={{ animationDelay: `${(row * HARM_CATEGORIES.length + col) * 90}ms` }}
              title={`${lang.label} × ${cat.displayName}`}
            />
          ))
        )}
      </div>
      <div className="mt-4 flex items-center justify-between text-[11px] text-ink-faint">
        <span>5 languages</span>
        <span>×</span>
        <span>5 harm categories</span>
        <span>×</span>
        <span>3 tracks</span>
      </div>
    </div>
  );
}
