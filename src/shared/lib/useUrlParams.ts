import { useCallback, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router';

type SetParams = ReturnType<typeof useSearchParams>[1];

/**
 * `useSearchParams`, with a writer that keeps its identity. React Router returns a new
 * `setSearchParams` on every location change, which re-runs the effects of everything
 * holding it and defeats the memos below. Through a ref it is stable.
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
