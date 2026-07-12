'use client';

import { useEffect, useMemo, useState } from 'react';
import { listTargetModels } from '@/lib/api';
import type { TargetModel, TargetModelCreate } from '@/lib/types';

const FIREWORKS_ENDPOINT = 'https://api.fireworks.ai/inference/v1';

export type TargetSelection =
  | { existing: Pick<TargetModel, 'id' | 'name'>[] }
  | { create: TargetModelCreate };

export default function TargetModelForm({
  value,
  onChange,
}: {
  value: TargetSelection | null;
  onChange: (next: TargetSelection) => void;
}) {
  const [mode, setMode] = useState<'existing' | 'new'>('existing');
  const [models, setModels] = useState<TargetModel[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState('');
  const executableModels = useMemo(
    () => models.filter((model) => model.endpoint_type === 'fireworks'),
    [models]
  );
  const selectedModels = useMemo(
    () => executableModels.filter((model) => selectedIds.includes(model.id)),
    [executableModels, selectedIds]
  );

  useEffect(() => {
    listTargetModels()
      .then(setModels)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (mode === 'existing') {
      onChange({ existing: selectedModels.map(({ id, name }) => ({ id, name })) });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, selectedModels]);

  useEffect(() => {
    if (mode === 'new') {
      onChange({
        create: {
          name,
          endpoint_type: 'fireworks',
          endpoint_url: FIREWORKS_ENDPOINT,
        },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, name]);

  function toggleModel(modelId: number) {
    setSelectedIds((current) =>
      current.includes(modelId)
        ? current.filter((id) => id !== modelId)
        : [...current, modelId]
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setMode('existing')}
          className={`rounded-sm px-3 py-1.5 text-sm font-medium ${
            mode === 'existing' ? 'bg-brand text-white' : 'bg-ink/5 text-ink-soft'
          }`}
        >
          Use registered models
        </button>
        <button
          type="button"
          onClick={() => setMode('new')}
          className={`rounded-sm px-3 py-1.5 text-sm font-medium ${
            mode === 'new' ? 'bg-brand text-white' : 'bg-ink/5 text-ink-soft'
          }`}
        >
          Register one new
        </button>
      </div>

      {mode === 'existing' ? (
        <div>
          {loading ? (
            <p className="text-sm text-ink-faint">Loading registered models...</p>
          ) : (
            executableModels.length === 0 ? (
              <p className="text-sm text-ink-faint">No Fireworks models registered.</p>
            ) : (
              <div className="space-y-2">
                {executableModels.map((model) => (
                  <label
                    key={model.id}
                    className="flex items-start gap-3 rounded-md border border-line bg-paper-raised px-3 py-2.5 text-sm text-ink-soft transition hover:border-brand/40"
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(model.id)}
                      onChange={() => toggleModel(model.id)}
                      className="mt-0.5 h-4 w-4 accent-brand"
                    />
                    <span className="min-w-0 break-all font-mono text-xs text-ink">
                      {model.name}
                    </span>
                  </label>
                ))}
              </div>
            )
          )}
          {value && 'existing' in value && value.existing.length > 1 && (
            <p className="mt-2 text-xs text-ink-faint">
              {value.existing.length} models selected. Chaukidar will create parallel audit runs.
            </p>
          )}
        </div>
      ) : (
        <div>
          <label className="block text-sm">
            <span className="mb-1.5 block text-ink-soft">Fireworks model ID</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="accounts/fireworks/models/..."
              className="w-full rounded-md border border-line bg-paper-raised px-3 py-2.5"
            />
          </label>
          <p className="mt-2 text-xs text-ink-faint">
            Registering manually creates one audit run. Use registered models for multi-model runs.
          </p>
        </div>
      )}
    </div>
  );
}
