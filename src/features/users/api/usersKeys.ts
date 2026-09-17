import type { UserEdits, UsersQuery } from '../model/types';

/**
 * Every cache key this feature uses, built from one root.
 *
 * Array literals spread through the codebase are how you end up invalidating `['users']`
 * in one file while another caches under something that does not match it, with nothing
 * to tell you. Everything here descends from `all`, so one invalidation reaches all of it.
 */
export const usersKeys = {
  all: ['users'] as const,
  /**
   * The edits are part of the key because they are part of the answer: they are merged in
   * before the search and the sort run, so a different overlay is a different result. It
   * also means undoing a rename lands back on a key that is already cached.
   */
  list: (query: UsersQuery, edits: UserEdits) =>
    [...usersKeys.all, 'list', query, edits] as const,
  cities: () => [...usersKeys.all, 'cities'] as const,
  /**
   * No overlay here, unlike the list. The list's answer depends on it, because the search
   * and the sort run over renamed values; one user's detail does not, so the overlay goes
   * on after the cache rather than inside its key. Keyed by it, every rename threw away a
   * cached user and fetched it again to change one string.
   */
  detail: (id: number) => [...usersKeys.all, 'detail', id] as const,
};
