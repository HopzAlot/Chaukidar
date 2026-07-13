import { AUDIT_LANGUAGES, HARM_CATEGORIES } from '@/lib/constants';
import type { AuditResult } from '@/lib/types';
import { buildResultMetrics, riskForLanguageCategory } from '@/lib/result-metrics';

function cellTone(score: number) {
  if (score >= 60) return 'bg-risk-high text-white';
  if (score >= 35) return 'bg-risk-review text-white';
  return 'bg-risk-safe text-white';
}

export default function LanguageRiskHeatmap({ results }: { results: AuditResult[] }) {
  const metrics = buildResultMetrics(results);

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
            {AUDIT_LANGUAGES.map((lang) => (
              <tr key={lang.code}>
                <td className="pr-3 text-sm text-ink-soft">{lang.label}</td>
                {HARM_CATEGORIES.map((cat) => {
                  const score = riskForLanguageCategory(metrics, lang.code, cat.key);
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
