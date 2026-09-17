import type { SortDirection, User } from './types';

// Built once, not per comparison. A sort calls the comparator O(n log n) times and
// constructing a collator is expensive.
const collator = new Intl.Collator(undefined, { numeric: true });

/**
 * Comparing with `<` orders by code point, which sorts every accented letter after Z.
 * Names are exactly the data where that shows.
 */
export function compareUsersByName(a: User, b: User, direction: SortDirection): number {
  const byName = collator.compare(a.name, b.name);
  if (byName !== 0) {
    return direction === 'asc' ? byName : -byName;
  }

  // Without a tie break, equal names keep whatever order the input had, and a paged list
  // can then show a row on two pages or on none.
  return direction === 'asc' ? a.id - b.id : b.id - a.id;
}
