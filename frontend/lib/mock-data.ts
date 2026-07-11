import { HARM_CATEGORIES, LANGUAGES } from './constants';
import type {
  AuditResult,
  AuditRun,
  Report,
  ResultLabel,
  TargetModel,
} from './types';

/**
 * Deterministic mock data so the UI is fully explorable before the
 * FastAPI backend is wired up. None of this is real model output —
 * it exists purely to give charts and tables realistic shapes.
 */

export const MOCK_TARGET: TargetModel = {
  id: 1,
  name: 'Llama-3.1-8B-Instruct (vLLM / MI300X)',
  endpoint_type: 'vllm',
  endpoint_url: 'http://localhost:8001/v1',
  api_key_ref: null,
  is_rag: false,
  created_at: new Date().toISOString(),
};

export const MOCK_AUDIT_RUN: AuditRun = {
  id: 1001,
  target_model_id: 1,
  name: 'Sample audit — Llama-3.1-8B baseline',
  languages: ['ur', 'punjabi', 'ps', 'sd'],
  harm_categories: HARM_CATEGORIES.map((c) => c.key),
  include_translation_track: true,
  include_native_track: true,
  status: 'completed',
  progress_current: 200,
  progress_total: 200,
  started_at: new Date(Date.now() - 1000 * 60 * 6).toISOString(),
  completed_at: new Date().toISOString(),
  created_at: new Date(Date.now() - 1000 * 60 * 7).toISOString(),
};

const LABELS: ResultLabel[] = [
  'refusal',
  'compliance',
  'partial_compliance',
  'out_of_scope',
  'hallucinated_unsafe',
];

// Simple seeded pseudo-random so mock numbers are stable across renders.
function seeded(n: number) {
  const x = Math.sin(n) * 10000;
  return x - Math.floor(x);
}

export function buildMockResults(auditRunId: number): AuditResult[] {
  const results: AuditResult[] = [];
  let i = 0;
  for (const lang of LANGUAGES) {
    for (const track of ['translation_baseline', 'native_adapted'] as const) {
      for (const cat of HARM_CATEGORIES) {
        i += 1;
        // Native-adapted prompts are deliberately modeled as higher-risk
        // than translation-baseline — that gap is the product's thesis.
        const base = track === 'native_adapted' ? 0.42 : 0.2;
        const roll = seeded(i * 7.13 + auditRunId);
        const riskScore = Math.round((base + roll * 0.5) * 100);
        const label =
          riskScore > 62
            ? 'compliance'
            : riskScore > 45
            ? 'partial_compliance'
            : LABELS[Math.floor(seeded(i * 3.1) * LABELS.length)];

        results.push({
          id: i,
          audit_run_id: auditRunId,
          prompt_id: i,
          language: lang.code,
          track,
          harm_category: cat.key,
          raw_response_text:
            '[Raw model response — hidden by default, toggle "show raw" to inspect]',
          label,
          confidence: Math.round((0.6 + roll * 0.4) * 100) / 100,
          judge_explanation:
            label === 'compliance'
              ? 'Model provided actionable content instead of declining.'
              : label === 'partial_compliance'
              ? 'Model hedged but leaked partial actionable detail.'
              : label === 'hallucinated_unsafe'
              ? 'Model invented unsafe content not grounded in context.'
              : 'Model declined or correctly stayed out of scope.',
          risk_score: riskScore,
          latency_ms: Math.round(300 + roll * 900),
          created_at: new Date().toISOString(),
        });
      }
    }
  }
  return results;
}

export const MOCK_REPORT: Report = {
  id: 1,
  audit_run_id: MOCK_AUDIT_RUN.id,
  overall_safety_score: 71,
  readiness_label: 'Needs Review',
  summary: {
    total_results: 40,
    label_counts: {},
    overall_safety_score: 71,
    readiness_label: 'Needs Review',
  },
  generated_at: new Date().toISOString(),
};
