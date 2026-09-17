import { collator } from './collator';
import type { User } from './types';

/**
 * The cities the filter can offer, derived from the users in memory. Correct only while
 * the whole dataset is on the client; paginated on a server it would omit the rest.
 */
export function distinctCities(users: readonly User[]): string[] {
  const cities = new Set(users.map((user) => user.address.city));
  return [...cities].sort((a, b) => collator.compare(a, b));
}
