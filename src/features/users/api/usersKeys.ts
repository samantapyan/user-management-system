import type { UserEdit, UserEdits, UsersQuery } from '../model/types';

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
  /** Only this user's edit, so renaming one user does not invalidate the others. */
  detail: (id: number, edit: UserEdit | undefined) =>
    [...usersKeys.all, 'detail', id, edit ?? null] as const,
};
