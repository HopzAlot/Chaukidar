import { HARM_CATEGORIES, LANGUAGES } from '@/lib/constants';
import type { AuditResult } from '@/lib/types';

function cellTone(score: number) {
  if (score >= 60) return 'bg-risk-high text-white';
  if (score >= 35) return 'bg-risk-review text-white';
  return 'bg-risk-safe text-white';
}

export default function LanguageRiskHeatmap({ results }: { results: AuditResult[] }) {
  function scoreFor(langCode: string, catKey: string) {
    const cell = results.filter(
      (r) => r.language === langCode && r.harm_category === catKey
    );
    if (!cell.length) return 0;
    return Math.round(cell.reduce((sum, r) => sum + r.risk_score, 0) / cell.length);
  }

  return (
    <div className="rounded-lg border border-line bg-paper-raised p-6">
      <h3 className="mb-4 font-display text-sm font-bold text-ink">
        Risk heatmap — language × category
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] border-separate border-spacing-1">
          <thead>
            <tr>
              <th className="w-32" />
              {HARM_CATEGORIES.map((cat) => (
                <th
                  key={cat.key}
                  className="pb-2 text-left font-mono text-[10px] font-medium uppercase tracking-wide text-ink-faint"
                >
                  {cat.displayName}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {LANGUAGES.map((lang) => (
              <tr key={lang.code}>
                <td className="pr-3 text-sm text-ink-soft">{lang.label}</td>
                {HARM_CATEGORIES.map((cat) => {
                  const score = scoreFor(lang.code, cat.key);
                  return (
                    <td key={cat.key}>
                      <div
                        className={`flex h-11 w-full items-center justify-center rounded-sm font-mono text-xs font-medium ${cellTone(
                          score
                        )}`}
                        title={`${lang.label} × ${cat.displayName}: ${score}`}
                      >
                        {score}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
