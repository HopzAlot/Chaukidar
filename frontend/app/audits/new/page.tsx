'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Cloud, Upload } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import HarmCategorySelector from '@/components/audit/HarmCategorySelector';
import LanguageSelector from '@/components/audit/LanguageSelector';
import TargetModelForm from '@/components/audit/TargetModelForm';
import { HARM_CATEGORIES, LANGUAGES } from '@/lib/constants';
import { createAuditRun, importAmdAudit, registerTargetModel, startAuditRun } from '@/lib/api';
import type { LanguageCode, TargetModelCreate } from '@/lib/types';

export default function NewAuditPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'fireworks' | 'amd_import'>('fireworks');

  const [name, setName] = useState('');
  const [target, setTarget] = useState<TargetModelCreate | { existingId: number } | null>(null);
  const [languages, setLanguages] = useState<LanguageCode[]>(LANGUAGES.map((l) => l.code));
  const [categories, setCategories] = useState<string[]>(HARM_CATEGORIES.map((c) => c.key));
  const [includeTranslation, setIncludeTranslation] = useState(true);
  const [includeNative, setIncludeNative] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);

  const canSubmit =
    name.trim().length > 0 &&
    target !== null &&
    languages.length > 0 &&
    categories.length > 0 &&
    (includeTranslation || includeNative);

  async function handleSubmit() {
    if (!canSubmit || !target) return;
    setSubmitting(true);
    setError(null);
    try {
      const targetModelId =
        'existingId' in target
          ? target.existingId
          : (await registerTargetModel(target)).id;

      const run = await createAuditRun({
        target_model_id: targetModelId,
        name,
        languages,
        harm_categories: categories,
        include_translation_track: includeTranslation,
        include_native_track: includeNative,
      });

      await startAuditRun(run.id);
      router.push(`/audits/${run.id}/run`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
      setSubmitting(false);
    }
  }

  async function handleImport() {
    if (!importFile) return;
    setImporting(true);
    setError(null);
    try {
      if (importFile.size > 20 * 1024 * 1024) {
        throw new Error('JSON file must be smaller than 20 MB.');
      }
      const payload: unknown = JSON.parse(await importFile.text());
      const run = await importAmdAudit(payload);
      router.push(`/audits/${run.id}/results`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to import audit JSON.');
      setImporting(false);
    }
  }

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-shell px-6 py-12">
        <div className="mb-8">
          <span className="font-mono text-xs uppercase tracking-wider text-brand">
            New audit
          </span>
          <h1 className="mt-2 font-display text-2xl font-bold text-ink">
            Configure an audit run
          </h1>
          <p className="mt-1 text-sm text-ink-soft">
            Run directly with Fireworks or import results produced on AMD ROCm.
          </p>
        </div>

        <div className="mb-8 flex gap-2">
          <button
            type="button"
            onClick={() => setMode('fireworks')}
            className={`inline-flex items-center gap-2 rounded-sm px-4 py-2.5 text-sm font-medium ${mode === 'fireworks' ? 'bg-brand text-white' : 'bg-ink/5 text-ink-soft'}`}
          >
            <Cloud size={15} /> Run with Fireworks
          </button>
          <button
            type="button"
            onClick={() => setMode('amd_import')}
            className={`inline-flex items-center gap-2 rounded-sm px-4 py-2.5 text-sm font-medium ${mode === 'amd_import' ? 'bg-brand text-white' : 'bg-ink/5 text-ink-soft'}`}
          >
            <Upload size={15} /> Import AMD results
          </button>
        </div>

        {mode === 'amd_import' ? (
          <div className="space-y-6">
            <section className="rounded-lg border border-line bg-paper-raised p-6">
              <h2 className="mb-3 font-display text-sm font-bold text-ink">AMD notebook result</h2>
              <input
                type="file"
                accept="application/json,.json"
                onChange={(event) => setImportFile(event.target.files?.[0] ?? null)}
                className="block w-full text-sm text-ink-soft file:mr-4 file:rounded-sm file:border-0 file:bg-brand-tint file:px-4 file:py-2 file:text-sm file:font-medium file:text-brand"
              />
            </section>
            {error && (
              <p className="rounded-md border border-risk-high bg-risk-high-tint px-4 py-3 text-sm text-risk-high">{error}</p>
            )}
            <div className="flex justify-end">
              <button
                type="button"
                disabled={!importFile || importing}
                onClick={handleImport}
                className="inline-flex items-center gap-2 rounded-sm bg-brand px-5 py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Upload size={15} /> {importing ? 'Importing…' : 'Import results'}
              </button>
            </div>
          </div>
        ) : (
        <div className="space-y-8">
          <section className="rounded-lg border border-line bg-paper-raised p-6">
            <h2 className="mb-3 font-display text-sm font-bold text-ink">
              Audit name
            </h2>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Pre-launch safety audit — v0.3"
              className="w-full rounded-md border border-line bg-paper px-3 py-2.5 text-sm"
            />
          </section>

          <section className="rounded-lg border border-line bg-paper-raised p-6">
            <h2 className="mb-3 font-display text-sm font-bold text-ink">
              Target model
            </h2>
            <TargetModelForm value={target} onChange={setTarget} />
          </section>

          <section className="rounded-lg border border-line bg-paper-raised p-6">
            <h2 className="mb-3 font-display text-sm font-bold text-ink">Languages</h2>
            <LanguageSelector selected={languages} onChange={setLanguages} />
          </section>

          <section className="rounded-lg border border-line bg-paper-raised p-6">
            <h2 className="mb-3 font-display text-sm font-bold text-ink">
              Harm categories
            </h2>
            <HarmCategorySelector selected={categories} onChange={setCategories} />
          </section>

          <section className="rounded-lg border border-line bg-paper-raised p-6">
            <h2 className="mb-3 font-display text-sm font-bold text-ink">Tracks</h2>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-sm text-ink-soft">
                <input
                  type="checkbox"
                  checked={includeTranslation}
                  onChange={(e) => setIncludeTranslation(e.target.checked)}
                  className="h-4 w-4 accent-brand"
                />
                Translation baseline
              </label>
              <label className="flex items-center gap-2 text-sm text-ink-soft">
                <input
                  type="checkbox"
                  checked={includeNative}
                  onChange={(e) => setIncludeNative(e.target.checked)}
                  className="h-4 w-4 accent-brand"
                />
                Native-adapted
              </label>
            </div>
          </section>

          {error && (
            <p className="rounded-md border border-risk-high bg-risk-high-tint px-4 py-3 text-sm text-risk-high">
              {error}
            </p>
          )}

          <div className="flex justify-end">
            <button
              type="button"
              disabled={!canSubmit || submitting}
              onClick={handleSubmit}
              className="rounded-sm bg-brand px-5 py-3 text-sm font-medium text-white transition hover:bg-brand-soft disabled:cursor-not-allowed disabled:opacity-40"
            >
              {submitting ? 'Starting audit…' : 'Create Fireworks audit'}
            </button>
          </div>
        </div>
        )}
      </main>
    </>
  );
}
