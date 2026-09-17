import type { UsersQuery } from '../model/types';

/**
 * Every cache key this feature uses, built from one root.
 *
 * Array literals spread through the codebase are how you end up invalidating `['users']`
 * in one file while another caches under something that does not match it, with nothing
 * to tell you. Everything here descends from `all`, so one invalidation reaches all of it.
 */
export const usersKeys = {
  all: ['users'] as const,
  list: (query: UsersQuery) => [...usersKeys.all, 'list', query] as const,
  cities: () => [...usersKeys.all, 'cities'] as const,
};
