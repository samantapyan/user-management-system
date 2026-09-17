import { compareUsersByName } from './sortUsers';
import type { User, UsersQuery, UsersResponse } from './types';

/**
 * The work a server would do: search, filter, sort, then page.
 *
 * It lives here, in plain functions over an array, rather than inside a
 * component or inside the fetch. Two reasons. It is the part worth testing, and
 * it is testable exactly because it needs no rendering and no network. And when
 * the day comes that this moves to a real backend, this file is what gets
 * deleted, not rewritten around.
 *
 * The order of the four steps is not interchangeable. Filtering before sorting
 * is only a performance detail, but paging has to come last, and the local edit
 * overlay has to be merged into `users` before this function is called at all.
 * Rename somebody after this point and the row shows the new name while search
 * and sort still use the old one, which looks like three unrelated bugs.
 */
export function queryUsers(users: readonly User[], query: UsersQuery): UsersResponse {
  /* Normalised once per query rather than once per row. With ten users this is
     invisible; with the list this is written for it is ten thousand redundant
     allocations per keystroke. */
  const term = query.search.trim().toLocaleLowerCase();

  const matched = users.filter(
    (user) => matchesSearch(user, term) && matchesCity(user, query.city),
  );

  /* `sort` mutates, and `users` belongs to the query cache. Sorting it in place
     would reorder what every other consumer of that cache entry sees. */
  const sorted = [...matched].sort((a, b) => compareUsersByName(a, b, query.sort));

  /* A page number can arrive from a URL somebody bookmarked when the data was
     larger. Serving an empty screen for a page that no longer exists reads as
     "no users", which is wrong, so it is clamped to the last real page. */
  const page = Math.min(
    Math.max(query.page, 1),
    pageCount(matched.length, query.pageSize),
  );
  const start = (page - 1) * query.pageSize;

  return {
    data: sorted.slice(start, start + query.pageSize),
    /* The number matching the query before paging, not the number returned.
       That is what the interface needs to say how many pages there are. */
    total: matched.length,
  };
}

/** Always at least one page, so an empty result still has a page to be on. */
export function pageCount(total: number, pageSize: number): number {
  return Math.max(1, Math.ceil(total / pageSize));
}

/**
 * Case-insensitive, matches anywhere in the value, and covers name and email.
 *
 * Nothing in the requirements says which of those it should be, so all three are
 * decisions. Matching anywhere rather than only at the start is what people
 * expect from a search box, and it is the only one that finds a person by their
 * email domain.
 *
 * `toLocaleLowerCase` rather than `toLowerCase`, because the two disagree in
 * Turkish over the letter i, and a search that cannot find Ismail for a Turkish
 * reader is a real failure rather than a curiosity.
 */
function matchesSearch(user: User, normalisedTerm: string): boolean {
  if (normalisedTerm === '') {
    return true;
  }
  return (
    user.name.toLocaleLowerCase().includes(normalisedTerm) ||
    user.email.toLocaleLowerCase().includes(normalisedTerm)
  );
}

/**
 * Exact match, and deliberately not fuzzy. The value does not come from a person
 * typing, it comes from a list built out of this same data, so anything looser
 * would only ever introduce mistakes.
 */
function matchesCity(user: User, city: string | null): boolean {
  return city === null || user.address.city === city;
}
