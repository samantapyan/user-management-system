import { compareUsersByName } from './sortUsers';
import type { User, UsersPage, UsersQuery } from './types';

/**
 * The work a server would do: search, filter, sort, then page. Local edits must already
 * be merged into `users`, or search and sort run on a name nobody can see.
 */
export function queryUsers(users: readonly User[], query: UsersQuery): UsersPage {
  const term = query.search.trim().toLocaleLowerCase();

  const matched = users.filter(
    (user) => matchesSearch(user, term) && matchesCity(user, query.city),
  );

  // Copied first: `sort` mutates, and `users` belongs to the query cache.
  const sorted = [...matched].sort((a, b) => compareUsersByName(a, b, query.sort));

  // A bookmarked page can outlive the data that made it valid. An empty screen reads as
  // "no users" rather than "no such page", so it clamps.
  const page = Math.min(
    Math.max(query.page, 1),
    pageCount(matched.length, query.pageSize),
  );
  const start = (page - 1) * query.pageSize;

  return {
    items: sorted.slice(start, start + query.pageSize),
    total: matched.length,
  };
}

/** Always at least one, so an empty result still has a page to be on. */
function pageCount(total: number, pageSize: number): number {
  return Math.max(1, Math.ceil(total / pageSize));
}

// toLocaleLowerCase, not toLowerCase: the two disagree over the letter i in Turkish.
function matchesSearch(user: User, normalisedTerm: string): boolean {
  if (normalisedTerm === '') {
    return true;
  }
  return (
    user.name.toLocaleLowerCase().includes(normalisedTerm) ||
    user.email.toLocaleLowerCase().includes(normalisedTerm)
  );
}

function matchesCity(user: User, city: string | null): boolean {
  return city === null || user.address.city === city;
}
