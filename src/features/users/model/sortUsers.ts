import type { SortDirection, User } from './types';

/**
 * Sorting by name, which is less obvious than it looks.
 *
 * The API returns `name` as one string ("Leanne Graham") with no separate family
 * name, so sorting by name is really sorting by first name. That is worth
 * knowing before somebody reports it as a bug. Splitting the string to guess a
 * surname would be worse: names do not reliably have two parts, and the guess
 * would be wrong for a large share of the world.
 */

/**
 * Built once at module load, not per comparison. Constructing a collator is
 * expensive, and a sort calls the comparator O(n log n) times. With ten users
 * nobody would notice. With the larger list this is written for, it is the
 * difference between a sort and a freeze.
 *
 * `undefined` for the locale means the reader's own locale, which is the order
 * they expect to see. Two people in different locales can therefore see two
 * different orders for the same data, which is correct rather than a bug.
 */
const collator = new Intl.Collator(undefined, { numeric: true });

/**
 * Comparing with `<` would be wrong here, and quietly so. A plain comparison
 * orders by code point, which puts every accented letter after Z and sorts
 * "Ödegaard" after "Zulu". Names are exactly the data where that shows up.
 */
export function compareUsersByName(a: User, b: User, direction: SortDirection): number {
  const byName = collator.compare(a.name, b.name);
  if (byName !== 0) {
    return direction === 'asc' ? byName : -byName;
  }

  /* Two people can share a name. With no tie break their relative order is
     whatever the input happened to be, and once the list is paged that means a
     row can show up on two pages or on none. The id is stable, so it settles
     it. */
  return direction === 'asc' ? a.id - b.id : b.id - a.id;
}
