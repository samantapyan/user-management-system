import { errorMessage, isRetryable } from '@/shared/lib/http';
import type { User, UsersQuery, UsersResponse } from './types';
import { isFiltered } from './usersParams';

/**
 * What the screen is showing, as one value rather than four booleans. Derived from loose
 * flags, loading and empty can both be true and the winner is whichever the component
 * checks first. Here they cannot both exist, and deciding needs no rendering.
 */
export type UsersViewState =
  | { status: 'loading' }
  | { status: 'error'; message: string; canRetry: boolean }
  /** No users exist at all. */
  | { status: 'empty' }
  /** Users exist, but none match the current filters. */
  | { status: 'no-results' }
  | {
      status: 'ready';
      users: User[];
      /** Of `users`, the ones showing a locally renamed value. */
      editedIds: number[];
      total: number;
      /** A newer query is in flight and the rows below belong to the previous one. */
      isRefreshing: boolean;
      /** The last refresh failed, so the rows are real but older than they look. */
      refreshFailed: boolean;
    };

/**
 * Structural on purpose, so this file does not know TanStack Query exists and a test can
 * hand it a plain object.
 */
type UsersQueryResult = {
  data: UsersResponse | undefined;
  error: unknown;
  isPending: boolean;
  isFetching: boolean;
  isPlaceholderData: boolean;
};

export function resolveUsersViewState(
  result: UsersQueryResult,
  query: UsersQuery,
): UsersViewState {
  if (result.isPending) {
    return { status: 'loading' };
  }

  /* Data that belongs to this query, rather than the previous query's rows being held on
     screen while this one loads. The distinction is what decides whether a failure is
     worth showing as an error.

     A failed refetch still carries the data it already had, and blanking the screen for
     rows that are merely a little old is worse than showing them. But a placeholder
     belongs to a different query, so keeping it after a failure would show rows that do
     not match what the user asked for, which is worse than saying nothing worked. */
  const hasOwnData = result.data !== undefined && !result.isPlaceholderData;

  if (result.error != null && !hasOwnData) {
    return {
      status: 'error',
      message: errorMessage(result.error),
      canRetry: isRetryable(result.error),
    };
  }

  const total = result.data?.total ?? 0;
  if (total === 0) {
    /* The same empty table for two different situations. Only one of them has a way out,
       and offering to clear filters that are not set is worse than offering nothing. */
    return isFiltered(query) ? { status: 'no-results' } : { status: 'empty' };
  }

  return {
    status: 'ready',
    users: result.data?.items ?? [],
    editedIds: result.data?.editedIds ?? [],
    total,
    isRefreshing: result.isPlaceholderData,
    // Still retrying is not yet a failure, so it only counts once fetching has stopped.
    refreshFailed: result.error != null && !result.isFetching,
  };
}
