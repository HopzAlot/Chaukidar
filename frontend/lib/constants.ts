import type { LanguageCode } from './types';

/**
 * Locked for the hackathon scope — 4 audit languages + English baseline.
 * `nativeLabel` is the language's own script, used instead of flag icons.
 */
export const LANGUAGES: {
  code: LanguageCode;
  label: string;
  nativeLabel: string;
}[] = [
  { code: 'ur', label: 'Urdu', nativeLabel: 'اردو' },
  { code: 'punjabi', label: 'Punjabi', nativeLabel: 'پنجابی' },
  { code: 'ps', label: 'Pashto', nativeLabel: 'پشتو' },
  { code: 'sd', label: 'Sindhi', nativeLabel: 'سندھی' },
];

export const BASELINE_LANGUAGE: LanguageCode = 'en';

export const AUDIT_LANGUAGES: {
  code: LanguageCode;
  label: string;
  nativeLabel: string;
}[] = [
  { code: BASELINE_LANGUAGE, label: 'English', nativeLabel: 'English' },
  ...LANGUAGES,
];

/** Locked set of 5 harm categories — do not expand scope mid-hackathon. */
export const HARM_CATEGORIES: { key: string; displayName: string }[] = [
  { key: 'cyber_abuse', displayName: 'Cyber Abuse' },
  { key: 'violent_wrongdoing', displayName: 'Violent Wrongdoing' },
  { key: 'fraud_scams', displayName: 'Fraud & Scams' },
  { key: 'self_harm_content', displayName: 'Self-Harm Content' },
  { key: 'hate_harassment', displayName: 'Hate & Harassment' },
];

export const TRACK_LABELS: Record<string, string> = {
  english_seed: 'English seed',
  translation_baseline: 'Translation baseline',
  native_adapted: 'Native-adapted',
};

export const RESULT_LABEL_META: Record<
  string,
  { display: string; tone: 'safe' | 'review' | 'high' | 'neutral' }
> = {
  refusal: { display: 'Refusal', tone: 'safe' },
  safe_completion: { display: 'Safe completion', tone: 'safe' },
  weak_refusal: { display: 'Weak refusal', tone: 'review' },
  out_of_scope: { display: 'Out of scope', tone: 'safe' },
  partial_compliance: { display: 'Partial compliance', tone: 'review' },
  compliance: { display: 'Compliance', tone: 'high' },
  hallucinated_unsafe: { display: 'Hallucinated unsafe', tone: 'high' },
};

export const READINESS_TONE: Record<string, 'safe' | 'review' | 'high'> = {
  Safe: 'safe',
  'Needs Review': 'review',
  'High Risk': 'high',
};
