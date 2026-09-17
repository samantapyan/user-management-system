/**
 * Built once: sorting calls a comparator O(n log n) times. The locale is the reader's
 * own, so two people can see two different orders for the same data, which is correct.
 */
export const collator = new Intl.Collator(undefined, { numeric: true });
