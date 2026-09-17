import { describe, expect, it } from 'vitest';
import { idsOf, makeUser } from '@/test/makeUser';
import type { PageSize } from '../constants/pagination';
import { queryUsers } from './queryUsers';
import { DEFAULT_QUERY } from './usersParams';
import type { User, UsersQuery } from './types';

function query(patch: Partial<UsersQuery> = {}): UsersQuery {
  return { ...DEFAULT_QUERY, ...patch };
}

/** Every page of a result, end to end, as the ids that were shown. */
function walkEveryPage(users: readonly User[], pageSize: PageSize): number[] {
  const { total } = queryUsers(users, query({ pageSize }));

  const seen: number[] = [];
  for (let page = 1; page <= Math.ceil(total / pageSize); page += 1) {
    seen.push(...idsOf(queryUsers(users, query({ page, pageSize })).items));
  }
  return seen;
}

describe('queryUsers', () => {
  it('searches the name and the email, and nothing else', () => {
    const user = makeUser(1, {
      name: 'Nobody',
      email: 'nobody@example.com',
      username: 'needle',
      phone: 'needle',
      website: 'needle',
      company: 'needle',
      address: { city: 'needle', street: 'needle', suite: 'needle', zipcode: 'needle' },
    });

    // Matching a hidden field puts rows on screen that contain the term nowhere the user
    // can see, and makes the search and the city filter disagree about what a city is.
    expect(queryUsers([user], query({ search: 'needle' })).total).toBe(0);
    expect(queryUsers([user], query({ search: 'NOBODY' })).total).toBe(1);
    expect(queryUsers([user], query({ search: '  nobody@  ' })).total).toBe(1);
  });

  it('clamps a bookmarked page that has outlived its data', () => {
    const users = Array.from({ length: 23 }, (_, index) => makeUser(index + 1));

    const far = queryUsers(users, query({ page: 99, pageSize: 5 }));
    const before = queryUsers(users, query({ page: 0, pageSize: 5 }));

    // An empty table reads as "there are no users" rather than "there is no page 99", and
    // there is no obvious way out of it. `total` still describes the whole result.
    expect(idsOf(far.items)).toEqual([21, 22, 23]);
    expect(far.total).toBe(23);
    expect(idsOf(before.items)).toEqual([1, 2, 3, 4, 5]);
  });

  it('pages tied rows the same way whatever order the server sent them in', () => {
    const tied = Array.from({ length: 17 }, (_, index) =>
      makeUser(index + 1, { name: 'Same Name' }),
    );

    const asSent = walkEveryPage(tied, 5);
    const reordered = walkEveryPage([...tied].reverse(), 5);

    /* Sorting is stable, so without the tie break on id the order the API returned is the
       order on screen: one fetch puts a row on page one, the next on page two, and the row
       it displaced is on neither. One fixture order cannot catch that, so this walks two. */
    expect(reordered).toEqual(asSent);
    expect(new Set(asSent).size).toBe(tied.length);
  });
});
