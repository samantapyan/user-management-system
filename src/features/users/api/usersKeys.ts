import type { UserEdits, UsersQuery } from '../model/types';

/**
 * Every cache key this feature uses, all descended from `all`, so one invalidation
 * reaches them. Loose array literals are how two files end up caching under keys that
 * do not match, with nothing to say so.
 */
export const usersKeys = {
  all: ['users'] as const,
  /** The edits belong in the key: merged in before search and sort, a different overlay
   * is a different answer, and undoing a rename lands back on a cached key. */
  list: (query: UsersQuery, edits: UserEdits) =>
    [...usersKeys.all, 'list', query, edits] as const,
  cities: () => [...usersKeys.all, 'cities'] as const,
  /** No overlay here, unlike the list: one user's detail does not search or sort, so it
   * goes on after the cache. Keyed by it, a rename refetched a user to change a string. */
  detail: (id: number) => [...usersKeys.all, 'detail', id] as const,
};
