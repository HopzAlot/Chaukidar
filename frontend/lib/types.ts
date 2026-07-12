/**
 * Shared types, mirroring the FastAPI Pydantic schemas 1:1.
 * Keep this file in sync with backend/app/schemas/*.py so lib/api.ts
 * stays a drop-in swap from mock data to the real backend.
 */

export type LanguageCode = 'en' | 'ur' | 'punjabi' | 'ps' | 'sd';

export type Track = 'english_seed' | 'translation_baseline' | 'native_adapted';

export type EndpointType =
  | 'fireworks'
  | 'mock'
  | 'amd_notebook';

export type AuditStatus = 'pending' | 'running' | 'completed' | 'failed';

export type ResultLabel =
  | 'refusal'
  | 'safe_completion'
  | 'weak_refusal'
  | 'compliance'
  | 'partial_compliance'
  | 'out_of_scope'
  | 'hallucinated_unsafe';

export type ReadinessLabel = 'Safe' | 'Needs Review' | 'High Risk';

export interface TargetModel {
  id: number;
  name: string;
  endpoint_type: EndpointType;
  endpoint_url: string;
  api_key_ref: string | null;
  is_rag: boolean;
  created_at: string;
}

export interface TargetModelCreate {
  name: string;
  endpoint_type: EndpointType;
  endpoint_url: string;
  api_key_ref?: string | null;
  is_rag?: boolean;
}

export interface RagTarget {
  id: number;
  target_model_id: number;
  context_scope_note: string;
  supports_out_of_scope_refusal: boolean;
}

export interface HarmCategory {
  id: number;
  key: string;
  display_name: string;
}

export interface AuditRun {
  id: number;
  target_model_id: number;
  target_model_name?: string | null;
  name: string;
  languages: LanguageCode[];
  harm_categories: string[];
  include_english_track: boolean;
  include_translation_track: boolean;
  include_native_track: boolean;
  status: AuditStatus;
  progress_current: number;
  progress_total: number;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface AuditRunCreate {
  target_model_id: number;
  name: string;
  languages: LanguageCode[];
  harm_categories: string[];
  include_english_track: boolean;
  include_translation_track: boolean;
  include_native_track: boolean;
}

export interface AuditResult {
  id: number;
  audit_run_id: number;
  prompt_id: number;
  language: LanguageCode;
  track: Track;
  harm_category: string;
  raw_response_text: string | null;
  label: ResultLabel;
  confidence: number;
  judge_explanation: string;
  risk_score: number;
  latency_ms: number;
  created_at: string;
}

export interface Report {
  id: number;
  audit_run_id: number;
  overall_safety_score: number;
  readiness_label: ReadinessLabel;
  summary: {
    total_results: number;
    label_counts: Record<string, number>;
    overall_safety_score: number;
    readiness_label: ReadinessLabel;
  };
  generated_at: string;
}

/** Derived, frontend-only aggregate shapes used by the dashboard charts. */
export interface RefusalRatePoint {
  language: LanguageCode;
  refusalRate: number;
}

export interface CategoryRiskPoint {
  category: string;
  riskScore: number;
}

export interface HeatmapCell {
  language: LanguageCode;
  category: string;
  riskScore: number;
}

export interface TranslationVsNativePoint {
  language: LanguageCode;
  translationRisk: number;
  nativeRisk: number;
}

export interface CustomPromptRecord {
  seed_id?: string | null;
  harm_category: string;
  language: string;
  track: Track;
  prompt_text: string;
  intent_summary: string;
  risk_level_hint?: 'low' | 'medium' | 'high';
}

export interface CustomDatasetPayload {
  records: CustomPromptRecord[];
}

export interface CustomDatasetImportResult {
  imported: number;
  updated: number;
  generated_seed_ids: number;
  languages: string[];
  harm_categories: string[];
  tracks: string[];
}
