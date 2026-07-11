import { HARM_CATEGORIES } from '@/lib/constants';

export default function HarmCategorySelector({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  function toggle(key: string) {
    onChange(
      selected.includes(key)
        ? selected.filter((k) => k !== key)
        : [...selected, key]
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {HARM_CATEGORIES.map((cat) => {
        const active = selected.includes(cat.key);
        return (
          <button
            key={cat.key}
            type="button"
            onClick={() => toggle(cat.key)}
            aria-pressed={active}
            className={`rounded-full border px-3.5 py-1.5 text-sm transition ${
              active
                ? 'border-brand bg-brand text-white'
                : 'border-line bg-paper-raised text-ink-soft hover:border-ink-faint'
            }`}
          >
            {cat.displayName}
          </button>
        );
      })}
    </div>
  );
}
