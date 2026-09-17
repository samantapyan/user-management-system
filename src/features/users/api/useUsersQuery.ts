import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { UsersQuery } from '../model/types';
import { listUsers } from './usersApi';

/**
 * Cache keys for this feature, in one place.
 *
 * Scattering array literals through the codebase is how you end up invalidating
 * `['users']` in one file and caching under `['user-list']` in another, and
 * nothing tells you. `all` exists so that one call can invalidate every users
 * query without knowing what any of them are keyed by.
 */
export const usersKeys = {
  all: ['users'] as const,
  list: (query: UsersQuery) => ['users', 'list', query] as const,
};

/**
 * The list query.
 *
 * **This is the answer to "typing quickly must not let a stale response
 * overwrite a newer one".** The whole query object is in the key, so two
 * different views are two different cache entries. A slow answer for the older
 * one cannot land on the newer one, because it is not written to the same
 * place. It is prevented by the shape of the cache rather than by a check that
 * somebody has to remember to write, and it stays true for a race nobody
 * predicted.
 *
 * The abort signal is passed through as well, but it is an optimisation and not
 * the fix. It stops work that nobody wants any more. Even without it the state
 * would still be correct.
 *
 * `keepPreviousData` keeps the previous page on screen while the next one
 * loads, instead of blanking the table to a skeleton on every keystroke.
 * `isPlaceholderData` on the result says the rows are the old ones, which is
 * what the interface uses to dim them rather than replace them.
 */
export function useUsersQuery(query: UsersQuery) {
  return useQuery({
    queryKey: usersKeys.list(query),
    queryFn: ({ signal }) => listUsers(query, signal),
    placeholderData: keepPreviousData,
  });
}
