import { collator } from './collator';
import type { User } from './types';

/**
 * The cities the filter can offer.
 *
 * Derived from the users, which is correct only while the whole dataset is on the client.
 * The moment the list is paginated on a server this would offer the cities of one page
 * and quietly omit the rest, and the filter would need a real endpoint behind it. The
 * separate `listCities` call in `api/` exists so that change is one module, not a screen.
 */
export function distinctCities(users: readonly User[]): string[] {
  const cities = new Set(users.map((user) => user.address.city));
  return [...cities].sort((a, b) => collator.compare(a, b));
}
