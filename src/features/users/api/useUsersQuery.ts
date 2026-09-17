import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { UsersQuery } from '../model/types';
import { listUsers } from './usersApi';

const usersKeys = {
  all: ['users'] as const,
  // Built from `all`, so invalidating every users query keeps working if it changes.
  list: (query: UsersQuery) => [...usersKeys.all, 'list', query] as const,
};

/**
 * The whole query object is the cache key, and that is what stops a slow answer for an
 * older view landing on a newer one: they are different cache entries, so it cannot be
 * written to the same place. Narrowing the key would reintroduce the race.
 *
 * The abort signal only stops unwanted work. The state would still be correct without it.
 */
export function useUsersQuery(query: UsersQuery) {
  return useQuery({
    queryKey: usersKeys.list(query),
    queryFn: ({ signal }) => listUsers(query, signal),
    // Keeps the previous page visible while the next loads, rather than blanking the
    // table on every keystroke. `isPlaceholderData` says the rows are the old ones.
    placeholderData: keepPreviousData,
  });
}
