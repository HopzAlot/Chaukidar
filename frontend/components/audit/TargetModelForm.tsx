'use client';

import { useEffect, useState } from 'react';
import { listTargetModels } from '@/lib/api';
import type { TargetModel, TargetModelCreate } from '@/lib/types';

const FIREWORKS_ENDPOINT = 'https://api.fireworks.ai/inference/v1';

export default function TargetModelForm({
  value,
  onChange,
}: {
  value: TargetModelCreate | { existingId: number } | null;
  onChange: (next: TargetModelCreate | { existingId: number }) => void;
}) {
  const [mode, setMode] = useState<'existing' | 'new'>('existing');
  const [models, setModels] = useState<TargetModel[]>([]);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState('');
  const executableModels = models.filter((model) => model.endpoint_type === 'fireworks');

  useEffect(() => {
    listTargetModels()
      .then(setModels)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (mode === 'new') {
      onChange({
        name,
        endpoint_type: 'fireworks',
        endpoint_url: FIREWORKS_ENDPOINT,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, name]);

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
          Use registered model
        </button>
        <button
          type="button"
          onClick={() => setMode('new')}
          className={`rounded-sm px-3 py-1.5 text-sm font-medium ${
            mode === 'new' ? 'bg-brand text-white' : 'bg-ink/5 text-ink-soft'
          }`}
        >
          Register new
        </button>
      </div>

      {mode === 'existing' ? (
        <div>
          {loading ? (
            <p className="text-sm text-ink-faint">Loading registered models…</p>
          ) : (
            executableModels.length === 0 ? (
              <p className="text-sm text-ink-faint">No Fireworks models registered.</p>
            ) : (
              <select
                className="w-full rounded-md border border-line bg-paper-raised px-3 py-2.5 text-sm"
                onChange={(e) => onChange({ existingId: Number(e.target.value) })}
                defaultValue=""
              >
                <option value="" disabled>
                  Select a Fireworks model
                </option>
                {executableModels.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            )
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
        </div>
      )}
    </div>
  );
}
