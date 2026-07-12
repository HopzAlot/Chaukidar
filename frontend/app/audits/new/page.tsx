'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Cloud, Upload } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import HarmCategorySelector from '@/components/audit/HarmCategorySelector';
import LanguageSelector from '@/components/audit/LanguageSelector';
import TargetModelForm from '@/components/audit/TargetModelForm';
import { HARM_CATEGORIES, LANGUAGES } from '@/lib/constants';
import { createAuditRun, importAmdAudit, importCustomDataset, registerTargetModel, startAuditRun, validateCustomDataset } from '@/lib/api';
import type { TargetSelection } from '@/components/audit/TargetModelForm';
import type { CustomDatasetImportResult, CustomDatasetPayload, LanguageCode } from '@/lib/types';

export default function NewAuditPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'fireworks' | 'amd_import'>('fireworks');

  const [name, setName] = useState('');
  const [target, setTarget] = useState<TargetSelection | null>(null);
  const [languages, setLanguages] = useState<LanguageCode[]>(LANGUAGES.map((l) => l.code));
  const [categories, setCategories] = useState<string[]>(HARM_CATEGORIES.map((c) => c.key));
  const [includeEnglish, setIncludeEnglish] = useState(true);
  const [includeTranslation, setIncludeTranslation] = useState(true);
  const [includeNative, setIncludeNative] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [customDataset, setCustomDataset] = useState<CustomDatasetPayload | null>(null);
  const [customDatasetFileName, setCustomDatasetFileName] = useState<string | null>(null);
  const [customDatasetStatus, setCustomDatasetStatus] = useState<CustomDatasetImportResult | null>(null);
  const [customDatasetValidating, setCustomDatasetValidating] = useState(false);
  const [customDatasetError, setCustomDatasetError] = useState<string | null>(null);

  const selectedTargetCount = target
    ? 'existing' in target
      ? target.existing.length
      : target.create.name.trim().length > 0
        ? 1
        : 0
    : 0;

  const canSubmit =
    name.trim().length > 0 &&
    selectedTargetCount > 0 &&
    languages.length > 0 &&
    categories.length > 0 &&
    (includeEnglish || includeTranslation || includeNative) &&
    !customDatasetValidating &&
    customDatasetError === null;

  async function handleCustomDatasetFile(file: File | null) {
    setCustomDataset(null);
    setCustomDatasetFileName(file?.name ?? null);
    setCustomDatasetStatus(null);
    setCustomDatasetError(null);
    if (!file) return;
    setCustomDatasetValidating(true);
    try {
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('Custom dataset JSON must be smaller than 5 MB.');
      }
      const parsed: unknown = JSON.parse(await file.text());
      const records = Array.isArray(parsed)
        ? parsed
        : typeof parsed === 'object' && parsed !== null && 'records' in parsed
          ? (parsed as { records: unknown }).records
          : null;
      if (!Array.isArray(records)) {
        throw new Error('Custom dataset must be a JSON array or an object with a records array.');
      }
      const payload = { records } as CustomDatasetPayload;
      const validation = await validateCustomDataset(payload);
      setCustomDataset(payload);
      setCustomDatasetStatus(validation);
    } catch (reason) {
      setCustomDatasetError(reason instanceof Error ? reason.message : 'Invalid custom dataset JSON.');
    } finally {
      setCustomDatasetValidating(false);
    }
  }

  async function handleSubmit() {
    if (!canSubmit || !target) return;
    setSubmitting(true);
    setError(null);
    try {
      if (customDataset) {
        await importCustomDataset(customDataset);
      }

      const selectedModels =
        'existing' in target
          ? target.existing
          : [await registerTargetModel(target.create)];

      const runs = await Promise.all(
        selectedModels.map((model) =>
          createAuditRun({
            target_model_id: model.id,
            name,
            languages,
            harm_categories: categories,
            include_english_track: includeEnglish,
            include_translation_track: includeTranslation,
            include_native_track: includeNative,
          })
        )
      );

      await Promise.all(runs.map((run) => startAuditRun(run.id)));
      router.push(runs.length === 1 ? `/audits/${runs[0].id}/run` : `/audits/groups/${encodeURIComponent(name)}`);
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
                  checked={includeEnglish}
                  onChange={(e) => setIncludeEnglish(e.target.checked)}
                  className="h-4 w-4 accent-brand"
                />
                English seed
              </label>
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

          <section className="rounded-lg border border-line bg-paper-raised p-6">
            <h2 className="mb-3 font-display text-sm font-bold text-ink">Custom dataset</h2>
            <p className="mb-4 text-sm leading-relaxed text-ink-soft">
              Optional JSON upload. Chaukidar validates the format first, then imports it before starting the audit.
              <span className="block text-xs text-ink-faint">seed_id is optional; backend generates one when missing.</span>
            </p>
            <input
              type="file"
              accept="application/json,.json"
              onChange={(event) => handleCustomDatasetFile(event.target.files?.[0] ?? null)}
              className="block w-full text-sm text-ink-soft file:mr-4 file:rounded-sm file:border-0 file:bg-brand-tint file:px-4 file:py-2 file:text-sm file:font-medium file:text-brand"
            />
            <pre className="mt-4 overflow-x-auto rounded-md border border-line bg-paper px-3 py-2 text-xs text-ink-soft">{`[
  {
    "harm_category": "fraud_scams",
    "language": "ur",
    "track": "native_adapted",
    "prompt_text": "...",
    "intent_summary": "...",
    "risk_level_hint": "high"
  }
]`}</pre>
            {customDatasetValidating && <p className="mt-3 text-sm text-ink-faint">Validating dataset...</p>}
            {customDatasetError && (
              <p className="mt-3 rounded-md border border-risk-high bg-risk-high-tint px-4 py-3 text-sm text-risk-high">
                {customDatasetFileName ? `${customDatasetFileName}: ` : ''}{customDatasetError}
              </p>
            )}
            {customDatasetStatus && (
              <p className="mt-3 rounded-md border border-line bg-paper px-4 py-3 text-sm text-ink-soft">
                Valid dataset: {customDatasetStatus.imported} records, {customDatasetStatus.generated_seed_ids} generated seed IDs, languages {customDatasetStatus.languages.join(', ') || 'none'}.
              </p>
            )}
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
              {submitting
                ? selectedTargetCount > 1
                  ? customDataset
                    ? 'Importing dataset and starting audits...'
                    : 'Starting parallel audits...'
                  : customDataset
                    ? 'Importing dataset and starting audit...'
                    : 'Starting audit...'
                : selectedTargetCount > 1
                  ? `Create ${selectedTargetCount} parallel audits`
                  : 'Create Fireworks audit'}
            </button>
          </div>
        </div>
        )}
      </main>
    </>
  );
}
