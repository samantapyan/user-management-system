import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { UsersQuery } from '../model/types';
import { useUserEdits } from '../model/userEdits';
import { listUsers } from './usersApi';
import { usersKeys } from './usersKeys';

/**
 * The whole query object is the cache key, which is what stops a slow answer for an older
 * view landing on a newer one. Narrowing it would bring the race back. The abort signal
 * only saves work; the state would be correct without it.
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
