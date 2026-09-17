import { collator } from './collator';
import type { SortDirection, User } from './types';

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
