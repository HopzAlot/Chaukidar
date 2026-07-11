import { LANGUAGES } from '@/lib/constants';
import type { LanguageCode } from '@/lib/types';

export default function LanguageSelector({
  selected,
  onChange,
}: {
  selected: LanguageCode[];
  onChange: (next: LanguageCode[]) => void;
}) {
  function toggle(code: LanguageCode) {
    onChange(
      selected.includes(code)
        ? selected.filter((c) => c !== code)
        : [...selected, code]
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {LANGUAGES.map((lang) => {
        const active = selected.includes(lang.code);
        return (
          <button
            key={lang.code}
            type="button"
            onClick={() => toggle(lang.code)}
            aria-pressed={active}
            className={`rounded-md border px-3 py-3 text-left transition ${
              active
                ? 'border-brand bg-brand-tint'
                : 'border-line bg-paper-raised hover:border-ink-faint'
            }`}
          >
            <div className="font-display text-lg leading-none text-ink" dir="rtl">
              {lang.nativeLabel}
            </div>
            <div className="mt-1.5 text-xs text-ink-soft">{lang.label}</div>
          </button>
        );
      })}
    </div>
  );
}
