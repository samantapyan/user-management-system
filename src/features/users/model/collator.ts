/**
 * Built once, not per comparison. Sorting calls a comparator O(n log n) times and
 * constructing a collator is expensive.
 *
 * `undefined` for the locale means the reader's own, so two people in different locales
 * can see two different orders for the same data. That is correct, not a bug.
 */
export const collator = new Intl.Collator(undefined, { numeric: true });
