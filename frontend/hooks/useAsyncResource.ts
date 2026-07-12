'use client';

import { useEffect, useState } from 'react';

type AsyncState<T> = {
  data: T | null;
  error: string | null;
  loading: boolean;
};

export function useAsyncResource<T>(loader: () => Promise<T>, deps: readonly unknown[]): AsyncState<T> {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    error: null,
    loading: true,
  });

  useEffect(() => {
    let active = true;
    setState((current) => ({ ...current, error: null, loading: true }));

    loader()
      .then((data) => {
        if (active) setState({ data, error: null, loading: false });
      })
      .catch((reason) => {
        if (!active) return;
        setState({
          data: null,
          error: reason instanceof Error ? reason.message : 'Unable to load data.',
          loading: false,
        });
      });

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return state;
}
