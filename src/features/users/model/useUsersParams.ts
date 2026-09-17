import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router';
import type { UsersQuery } from './types';
import { DEFAULT_QUERY, parseUsersQuery, usersQueryToParams } from './usersParams';

/**
 * Refining what you are looking at replaces the history entry, moving somewhere else
 * pushes one. Without this a debounced search adds an entry for every pause in typing,
 * and leaving the screen takes twenty presses of back.
 */
function historyModeFor(patch: Partial<UsersQuery>): { replace: boolean } {
  const isPagingOnly = 'page' in patch && Object.keys(patch).length === 1;
  return { replace: !isPagingOnly };
}

/** The view lives in the URL, so a reload, the back button and a shared link all work. */
export function useUsersParams() {
  const [searchParams, setSearchParams] = useSearchParams();

  // `searchParams` is a new object every render, and the parsed query is the cache key,
  // so without memoising it every render would look like a different view.
  const query = useMemo(() => parseUsersQuery(searchParams), [searchParams]);

  const setQuery = useCallback(
    (patch: Partial<UsersQuery>) => {
      setSearchParams((current) => {
        const next = { ...parseUsersQuery(current), ...patch };

        // Otherwise a search that now matches four rows leaves the user on page three
        // looking at an empty table. A patch that sets `page` itself wins.
        if (!('page' in patch)) {
          next.page = DEFAULT_QUERY.page;
        }

        return usersQueryToParams(next);
      }, historyModeFor(patch));
    },
    [setSearchParams],
  );

  return { query, setQuery };
}
