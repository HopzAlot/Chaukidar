import { HARM_CATEGORIES, LANGUAGES } from './constants';
import type { AuditResult, LanguageCode, Track } from './types';

type RunningStat = {
  count: number;
  riskTotal: number;
  refusalCount: number;
};

export type ResultMetrics = {
  byLanguage: Record<string, RunningStat>;
  byCategory: Record<string, RunningStat>;
  byLanguageCategory: Record<string, RunningStat>;
  byLanguageTrack: Record<string, RunningStat>;
};

function emptyStat(): RunningStat {
  return { count: 0, riskTotal: 0, refusalCount: 0 };
}

function key(...parts: string[]) {
  return parts.join('::');
}

function addStat(bucket: Record<string, RunningStat>, bucketKey: string, result: AuditResult) {
  const stat = bucket[bucketKey] ?? emptyStat();
  stat.count += 1;
  stat.riskTotal += result.risk_score;
  if (result.label === 'refusal' || result.label === 'out_of_scope') {
    stat.refusalCount += 1;
  }
  bucket[bucketKey] = stat;
}

export function buildResultMetrics(results: AuditResult[]): ResultMetrics {
  const metrics: ResultMetrics = {
    byLanguage: {},
    byCategory: {},
    byLanguageCategory: {},
    byLanguageTrack: {},
  };

  for (const result of results) {
    addStat(metrics.byLanguage, result.language, result);
    addStat(metrics.byCategory, result.harm_category, result);
    addStat(metrics.byLanguageCategory, key(result.language, result.harm_category), result);
    addStat(metrics.byLanguageTrack, key(result.language, result.track), result);
  }

  return metrics;
}

export function averageRisk(stat?: RunningStat) {
  return stat?.count ? Math.round(stat.riskTotal / stat.count) : 0;
}

export function refusalRate(stat?: RunningStat) {
  return stat?.count ? Math.round((stat.refusalCount / stat.count) * 100) : 0;
}

export function languageCategoryKey(language: string, category: string) {
  return key(language, category);
}

export function languageTrackKey(language: string, track: Track) {
  return key(language, track);
}

export function getRefusalRateData(metrics: ResultMetrics) {
  return LANGUAGES.map((lang) => ({
    language: lang.label,
    rate: refusalRate(metrics.byLanguage[lang.code]),
  }));
}

export function getCategoryRiskData(metrics: ResultMetrics) {
  return HARM_CATEGORIES.map((cat) => ({
    category: cat.displayName,
    risk: averageRisk(metrics.byCategory[cat.key]),
  }));
}

export function getTranslationNativeData(metrics: ResultMetrics) {
  return LANGUAGES.map((lang) => {
    const translationRisk = averageRisk(metrics.byLanguageTrack[languageTrackKey(lang.code, 'translation_baseline')]);
    const nativeRisk = averageRisk(metrics.byLanguageTrack[languageTrackKey(lang.code, 'native_adapted')]);
    return {
      language: lang.label,
      translationRisk,
      nativeRisk,
      delta: nativeRisk - translationRisk,
    };
  });
}

export function getLanguageReportRows(metrics: ResultMetrics) {
  return LANGUAGES.map((lang) => ({
    lang,
    avg: averageRisk(metrics.byLanguage[lang.code]),
    translationRisk: averageRisk(metrics.byLanguageTrack[languageTrackKey(lang.code, 'translation_baseline')]),
    nativeRisk: averageRisk(metrics.byLanguageTrack[languageTrackKey(lang.code, 'native_adapted')]),
  }));
}

export function riskForLanguageCategory(metrics: ResultMetrics, language: LanguageCode | string, category: string) {
  return averageRisk(metrics.byLanguageCategory[languageCategoryKey(language, category)]);
}
