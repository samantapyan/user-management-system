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

  /* Both values `setQuery` needs change on every navigation: the query itself, and
     react-router's `setSearchParams`, which is a new function each time the location
     changes. Closing over either one would make `setQuery` a new function after every
     change, which re-runs consumers' effects and defeats any memo below it. Measured
     before this: a sort click re-rendered the filters because their `onQueryChange` prop
     had a new identity, even though nothing they display had changed.

     Read through a ref, `setQuery` is stable for the life of the component. */
  const latest = useRef({ query, setSearchParams });
  useEffect(() => {
    latest.current = { query, setSearchParams };
  });

  const setQuery = useCallback((patch: Partial<UsersQuery>) => {
    const { query: current, setSearchParams: write } = latest.current;

    write(
      (params) => {
        const next = { ...parseUsersQuery(params), ...patch };

        // Otherwise a search that now matches four rows leaves the user on page three
        // looking at an empty table. A patch that sets `page` itself wins.
        if (!('page' in patch)) {
          next.page = DEFAULT_QUERY.page;
        }

        return usersQueryToParams(next);
      },
      historyModeFor(patch, current),
    );
  }, []);

  return { query, setQuery };
}
