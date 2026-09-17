import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router';
import type { UsersQuery } from './types';
import { DEFAULT_QUERY, parseUsersQuery, usersQueryToParams } from './usersParams';

/**
 * Which changes get their own history entry.
 *
 * Every deliberate decision pushes, so back undoes it. Picking a city, toggling the sort,
 * turning a page and changing the page size are each one choice.
 *
 * Search is the only thing that is not a single choice, and it needs a finer rule than
 * "always" or "never". Pushing on every pause in the typing would put "l", "le" and "lea"
 * in history and take twenty presses of back to leave. Never pushing means a user who
 * searched cannot get back to the full list the way they expect. So the transition is
 * what counts: starting a search and ending one are decisions, changing the term inside
 * one is still typing.
 */
function historyModeFor(
  patch: Partial<UsersQuery>,
  current: UsersQuery,
): { replace: boolean } {
  const isSearchOnly = 'search' in patch && Object.keys(patch).length === 1;
  if (!isSearchOnly) {
    return { replace: false };
  }

  const hadSearch = current.search.trim() !== '';
  const hasSearch = (patch.search ?? '').trim() !== '';
  return { replace: hadSearch === hasSearch };
}

/** The view lives in the URL, so a reload, the back button and a shared link all work. */
export function useUsersParams() {
  const [searchParams, setSearchParams] = useSearchParams();

  // `searchParams` is a new object every render, and the parsed query is the cache key,
  // so without memoising it every render would look like a different view.
  const query = useMemo(() => parseUsersQuery(searchParams), [searchParams]);

  /* `historyModeFor` needs the current query, but depending on it directly would make
     `setQuery` a new function after every change. Consumers hold it in effect dependency
     arrays, so that would re-run those effects on every change and leave correctness
     resting on a guard inside them. Through a ref, `setQuery` is stable for the life of
     the component and those effects run only when their own inputs change. */
  const queryRef = useRef(query);
  useEffect(() => {
    queryRef.current = query;
  }, [query]);

  const setQuery = useCallback(
    (patch: Partial<UsersQuery>) => {
      setSearchParams(
        (current) => {
          const next = { ...parseUsersQuery(current), ...patch };

          // Otherwise a search that now matches four rows leaves the user on page three
          // looking at an empty table. A patch that sets `page` itself wins.
          if (!('page' in patch)) {
            next.page = DEFAULT_QUERY.page;
          }

          return usersQueryToParams(next);
        },
        historyModeFor(patch, queryRef.current),
      );
    },
    [setSearchParams],
  );

  return { query, setQuery };
}
