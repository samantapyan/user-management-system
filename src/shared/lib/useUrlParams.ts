import { useCallback, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router';

type SetParams = ReturnType<typeof useSearchParams>[1];

/**
 * `useSearchParams`, with a writer that keeps its identity.
 *
 * React Router returns a new `setSearchParams` on every location change. Consumers hold
 * the writer in dependency arrays and pass it down as a prop, so a fresh function each
 * time re-runs their effects and defeats every memo below them. Read through a ref, it is
 * stable for the life of the component.
 */
export function useUrlParams(): [URLSearchParams, SetParams] {
  const [params, setParams] = useSearchParams();

  const latest = useRef(setParams);
  useEffect(() => {
    latest.current = setParams;
  });

  const write = useCallback<SetParams>((update, options) => {
    latest.current(update, options);
  }, []);

  return [params, write];
}
