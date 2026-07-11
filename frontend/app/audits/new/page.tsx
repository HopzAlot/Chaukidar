'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import HarmCategorySelector from '@/components/audit/HarmCategorySelector';
import LanguageSelector from '@/components/audit/LanguageSelector';
import TargetModelForm from '@/components/audit/TargetModelForm';
import { HARM_CATEGORIES, LANGUAGES } from '@/lib/constants';
import { createAuditRun, registerTargetModel, startAuditRun } from '@/lib/api';
import type { LanguageCode, TargetModelCreate } from '@/lib/types';

export default function NewAuditPage() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [target, setTarget] = useState<TargetModelCreate | { existingId: number } | null>(null);
  const [languages, setLanguages] = useState<LanguageCode[]>(LANGUAGES.map((l) => l.code));
  const [categories, setCategories] = useState<string[]>(HARM_CATEGORIES.map((c) => c.key));
  const [includeTranslation, setIncludeTranslation] = useState(true);
  const [includeNative, setIncludeNative] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
            Pick a target, languages, and harm categories. Prompts are pulled
            from the pre-baked dataset — nothing is generated live.
          </p>
        </div>

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
              {submitting ? 'Starting audit…' : 'Create audit & start run'}
            </button>
          </div>
        </div>
      </main>
    </>
  );
}
