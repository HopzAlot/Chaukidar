'use client';

import { useEffect, useState } from 'react';
import { listTargetModels } from '@/lib/api';
import type { EndpointType, TargetModel, TargetModelCreate } from '@/lib/types';

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
  const [endpointType, setEndpointType] = useState<EndpointType>('vllm');
  const [endpointUrl, setEndpointUrl] = useState('');
  const executableModels = models.filter((model) =>
    ['fireworks', 'vllm', 'openai_compatible', 'rag'].includes(model.endpoint_type)
  );

  useEffect(() => {
    listTargetModels()
      .then(setModels)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (mode === 'new') {
      onChange({ name, endpoint_type: endpointType, endpoint_url: endpointUrl });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, name, endpointType, endpointUrl]);

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
            <select
              className="w-full rounded-md border border-line bg-paper-raised px-3 py-2.5 text-sm"
              onChange={(e) => onChange({ existingId: Number(e.target.value) })}
              defaultValue=""
            >
              <option value="" disabled>
                Select a target model
              </option>
              {executableModels.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.endpoint_type})
                </option>
              ))}
            </select>
          )}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm sm:col-span-2">
            <span className="mb-1.5 block text-ink-soft">Model name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Llama-3.1-8B-Instruct"
              className="w-full rounded-md border border-line bg-paper-raised px-3 py-2.5"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1.5 block text-ink-soft">Endpoint type</span>
            <select
              value={endpointType}
              onChange={(e) => setEndpointType(e.target.value as EndpointType)}
              className="w-full rounded-md border border-line bg-paper-raised px-3 py-2.5"
            >
              <option value="vllm">vLLM (ROCm)</option>
              <option value="openai_compatible">OpenAI-compatible</option>
              <option value="fireworks">Fireworks</option>
              <option value="rag">RAG endpoint</option>
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1.5 block text-ink-soft">Endpoint URL</span>
            <input
              value={endpointUrl}
              onChange={(e) => setEndpointUrl(e.target.value)}
              placeholder="http://localhost:8001/v1"
              className="w-full rounded-md border border-line bg-paper-raised px-3 py-2.5 font-mono text-xs"
            />
          </label>
        </div>
      )}
    </div>
  );
}
