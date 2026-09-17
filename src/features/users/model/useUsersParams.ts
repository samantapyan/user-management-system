import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useUrlParams } from '@/shared/lib/useUrlParams';
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
 * searched cannot get back to the full list the way they expect.
 *
 * So what counts is whether this is the same term still being written. Typing further
 * into it, or backspacing over it, is one search being composed and replaces. Anything
 * else is a new search and pushes, including the first one and clearing it again.
 *
 * The earlier rule only asked whether a search existed before and after, which made
 * "Leanne" to "Ervin" look like more typing, so three searches collapsed into one entry
 * and one press of back threw away all three.
 */
function historyModeFor(
  patch: Partial<UsersQuery>,
  current: UsersQuery,
): { replace: boolean } {
  const isSearchOnly = 'search' in patch && Object.keys(patch).length === 1;
  if (!isSearchOnly) {
    return { replace: false };
  }

  const before = current.search.trim();
  const after = (patch.search ?? '').trim();

  const isSameTermStillBeingTyped =
    before !== '' &&
    after !== '' &&
    (after.startsWith(before) || before.startsWith(after));

  return { replace: isSameTermStillBeingTyped };
}

/** The view lives in the URL, so a reload, the back button and a shared link all work. */
export function useUsersParams() {
  const [searchParams, setSearchParams] = useUrlParams();

  // `searchParams` is a new object every render, and the parsed query is the cache key,
  // so without memoising it every render would look like a different view.
  const query = useMemo(() => parseUsersQuery(searchParams), [searchParams]);

  /* `historyModeFor` needs the query as it is now, and closing over it would give
     `setQuery` a new identity after every change. Consumers hold it in dependency arrays
     and pass it down as a prop, so that re-runs their effects and defeats their memo.
     Measured before this was fixed: a sort click re-rendered the filters over a prop
     identity for data they do not display. The writer itself is already stable, from
     useUrlParams. */
  const queryRef = useRef(query);
  useEffect(() => {
    queryRef.current = query;
  }, [query]);

  const setQuery = useCallback(
    (patch: Partial<UsersQuery>) => {
      setSearchParams(
        (params) => {
          const next = { ...parseUsersQuery(params), ...patch };

          // Otherwise a search that now matches four rows leaves the user on page three
          // looking at an empty table. A patch that sets `page` itself wins.
          if (!('page' in patch)) {
            next.page = DEFAULT_QUERY.page;
          }

          // `params` is carried through, so anything this query does not own, such as an
          // open user, survives a filter change.
          return usersQueryToParams(next, params);
        },
        historyModeFor(patch, queryRef.current),
      );
    },
    [setSearchParams],
  );

  return { query, setQuery };
}
