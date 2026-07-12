import type {
  AuditResult,
  AuditRun,
  AuditRunCreate,
  Report,
  TargetModel,
  TargetModelCreate,
  CustomDatasetPayload,
  CustomDatasetImportResult,
} from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? '/api/proxy';
export const USE_MOCK_API = false;

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (!res.ok) {
    throw new Error(`Chaukidar API error ${res.status}: ${await res.text()}`);
  }
  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------
// Target models — routers/targets.py
// ---------------------------------------------------------------------

export async function listTargetModels(): Promise<TargetModel[]> {
  return request<TargetModel[]>('/api/models');
}

export async function registerTargetModel(
  payload: TargetModelCreate
): Promise<TargetModel> {
  return request<TargetModel>('/api/models/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// ---------------------------------------------------------------------
// Custom datasets — routers/datasets.py
// ---------------------------------------------------------------------

export async function validateCustomDataset(
  payload: CustomDatasetPayload
): Promise<CustomDatasetImportResult> {
  return request<CustomDatasetImportResult>('/api/datasets/custom/validate', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function importCustomDataset(
  payload: CustomDatasetPayload
): Promise<CustomDatasetImportResult> {
  return request<CustomDatasetImportResult>('/api/datasets/custom/import', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// ---------------------------------------------------------------------
// Audits — routers/audits.py
// ---------------------------------------------------------------------

export async function createAuditRun(payload: AuditRunCreate): Promise<AuditRun> {
  return request<AuditRun>('/api/audits/create', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function importAmdAudit(payload: unknown): Promise<AuditRun> {
  return request<AuditRun>('/api/audits/import', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function startAuditRun(auditId: number): Promise<{ status: string }> {
  return request<{ status: string }>(`/api/audits/${auditId}/run`, {
    method: 'POST',
  });
}

/** Poll target for the live-run page — call this on a 2s interval. */
export async function getAuditRun(auditId: number): Promise<AuditRun> {
  return request<AuditRun>(`/api/audits/${auditId}`);
}

export async function listAuditRuns(): Promise<AuditRun[]> {
  return request<AuditRun[]>('/api/audits');
}

export async function getAuditResults(
  auditId: number,
  filters?: { language?: string; category?: string }
): Promise<AuditResult[]> {
  const params = new URLSearchParams();
  if (filters?.language) params.set('language', filters.language);
  if (filters?.category) params.set('category', filters.category);
  const qs = params.toString() ? `?${params.toString()}` : '';
  return request<AuditResult[]>(`/api/audits/${auditId}/results${qs}`);
}

// ---------------------------------------------------------------------
// Reports — routers/reports.py
// ---------------------------------------------------------------------

export async function getReport(auditId: number): Promise<Report> {
  return request<Report>(`/api/audits/${auditId}/report`);
}
