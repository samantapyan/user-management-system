import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { UsersQuery } from '../model/types';
import { useUserEdits } from '../model/userEdits';
import { listUsers } from './usersApi';
import { usersKeys } from './usersKeys';

/**
 * The whole query object is the cache key, and that is what stops a slow answer for an
 * older view landing on a newer one: they are different cache entries, so it cannot be
 * written to the same place. Narrowing the key would reintroduce the race.
 *
 * The abort signal only stops unwanted work. The state would still be correct without it.
 */
export function useUsersQuery(query: UsersQuery) {
  // Read here rather than passed in, so no component has to remember to thread the
  // overlay through to the one place that is allowed to apply it.
  const edits = useUserEdits();

  return useQuery({
    queryKey: usersKeys.list(query, edits),
    queryFn: ({ signal }) => listUsers(query, edits, signal),
    // Keeps the previous page visible while the next loads, rather than blanking the
    // table on every keystroke. `isPlaceholderData` says the rows are the old ones.
    placeholderData: keepPreviousData,
  });
}
