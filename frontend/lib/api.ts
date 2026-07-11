import {
  MOCK_AUDIT_RUN,
  MOCK_REPORT,
  MOCK_TARGET,
  buildMockResults,
} from './mock-data';
import type {
  AuditResult,
  AuditRun,
  AuditRunCreate,
  Report,
  TargetModel,
  TargetModelCreate,
} from './types';

/**
 * ---------------------------------------------------------------------
 * API INTEGRATION POINT
 * ---------------------------------------------------------------------
 * Every backend call in the app goes through this file. While the
 * FastAPI backend (see Section 4 of the implementation plan) isn't
 * ready, USE_MOCK short-circuits each function to return mock data
 * with a small artificial delay, so loading states are visible.
 *
 * To connect the real backend:
 *   1. Set NEXT_PUBLIC_USE_MOCK_API=false in .env.local
 *   2. Set NEXT_PUBLIC_API_BASE_URL to the FastAPI server URL
 *   3. Nothing else changes — every page already calls these functions.
 * ---------------------------------------------------------------------
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? '/api/proxy';
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_API !== 'false';

/** Exposed so pages can branch UI (e.g. PDF download) on mock vs. live mode. */
export const USE_MOCK_API = USE_MOCK;

const MOCK_DELAY_MS = 350;

function delay<T>(value: T, ms = MOCK_DELAY_MS): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

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
  if (USE_MOCK) return delay([MOCK_TARGET]);
  return request<TargetModel[]>('/api/models');
}

export async function registerTargetModel(
  payload: TargetModelCreate
): Promise<TargetModel> {
  if (USE_MOCK) {
    return delay({
      id: Math.floor(Math.random() * 10000),
      api_key_ref: null,
      is_rag: false,
      created_at: new Date().toISOString(),
      ...payload,
    });
  }
  return request<TargetModel>('/api/models/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// ---------------------------------------------------------------------
// Audits — routers/audits.py
// ---------------------------------------------------------------------

export async function createAuditRun(payload: AuditRunCreate): Promise<AuditRun> {
  if (USE_MOCK) {
    return delay({
      ...MOCK_AUDIT_RUN,
      id: Math.floor(Math.random() * 10000),
      status: 'pending',
      progress_current: 0,
      ...payload,
    });
  }
  return request<AuditRun>('/api/audits/create', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function startAuditRun(auditId: number): Promise<{ status: string }> {
  if (USE_MOCK) return delay({ status: 'started' });
  return request<{ status: string }>(`/api/audits/${auditId}/run`, {
    method: 'POST',
  });
}

/** Poll target for the live-run page — call this on a 2s interval. */
export async function getAuditRun(auditId: number): Promise<AuditRun> {
  if (USE_MOCK) {
    // Simulate progress advancing a little further on every poll.
    const bump = Math.min(200, MOCK_AUDIT_RUN.progress_total);
    return delay({
      ...MOCK_AUDIT_RUN,
      id: auditId,
      status: 'completed',
      progress_current: bump,
    });
  }
  return request<AuditRun>(`/api/audits/${auditId}`);
}

export async function listAuditRuns(): Promise<AuditRun[]> {
  if (USE_MOCK) return delay([MOCK_AUDIT_RUN]);
  return request<AuditRun[]>('/api/audits');
}

export async function getAuditResults(
  auditId: number,
  filters?: { language?: string; category?: string }
): Promise<AuditResult[]> {
  if (USE_MOCK) {
    let results = buildMockResults(auditId);
    if (filters?.language) {
      results = results.filter((r) => r.language === filters.language);
    }
    if (filters?.category) {
      results = results.filter((r) => r.harm_category === filters.category);
    }
    return delay(results);
  }
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
  if (USE_MOCK) return delay({ ...MOCK_REPORT, audit_run_id: auditId });
  return request<Report>(`/api/audits/${auditId}/report`);
}
