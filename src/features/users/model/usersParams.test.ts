import { describe, expect, it } from 'vitest';
import { DEFAULT_PAGE_SIZE } from '../constants/pagination';
import { DEFAULT_QUERY, parseUsersQuery, usersQueryToParams } from './usersParams';
import type { UsersQuery } from './types';

/**
 * The whole view lives in the URL, so this is all that stands between a link somebody
 * pasted into Slack and the data layer.
 */

describe('usersQueryToParams and parseUsersQuery', () => {
  it('survives being written to the URL and read back', () => {
    const queries: [string, UsersQuery][] = [
      ['the default view', DEFAULT_QUERY],
      ['a search', { ...DEFAULT_QUERY, search: 'leanne' }],
      ['a search with a space in it', { ...DEFAULT_QUERY, search: 'leanne g' }],
      ['a city', { ...DEFAULT_QUERY, city: 'Gwenborough' }],
      [
        'a city with characters a URL cares about',
        { ...DEFAULT_QUERY, city: 'Lake & Co' },
      ],
      ['the far sort', { ...DEFAULT_QUERY, sort: 'desc' }],
      ['a later page', { ...DEFAULT_QUERY, page: 7 }],
      ['a page size that is not the default', { ...DEFAULT_QUERY, pageSize: 50 }],
      [
        'all of it at once',
        { search: 'ervin', city: 'Wisokyburgh', sort: 'desc', page: 4, pageSize: 25 },
      ],
    ];

    // A field that survives one direction but not the other is a view that quietly resets
    // itself on reload. Checked as a round trip, so renaming a parameter stays free.
    for (const [label, query] of queries) {
      expect(parseUsersQuery(usersQueryToParams(query)), label).toEqual(query);
    }

    // And nothing at its default is written down, so a first load is a bare path.
    expect(usersQueryToParams(DEFAULT_QUERY).toString()).toBe('');
  });

  it('falls back instead of throwing on a URL nobody should have typed', () => {
    const hostile: [string, string, Partial<UsersQuery>][] = [
      ['a word where a number goes', '?page=abc', { page: 1 }],
      ['a page before the first', '?page=0', { page: 1 }],
      ['a negative page', '?page=-3', { page: 1 }],
      ['half a page', '?page=1.5', { page: 1 }],
      ['a page past what a number can count', '?page=9007199254740993', { page: 1 }],
      ['a sort that is not one', '?sort=sideways', { sort: 'asc' }],
      ['the right sort in the wrong case', '?sort=ASC', { sort: 'asc' }],
      ['a page size nobody offered', '?size=100000', { pageSize: DEFAULT_PAGE_SIZE }],
      ['a page size between two options', '?size=15', { pageSize: DEFAULT_PAGE_SIZE }],
      ['an empty city, which is every city', '?city=', { city: null }],
      ['every parameter left blank', '?q=&city=&sort=&page=&size=', DEFAULT_QUERY],
    ];

    // None may throw and none may reach the data layer as they are. `?size=100000` is the
    // one that matters: admitted, it becomes a request for ten thousand rows.
    for (const [label, search, expected] of hostile) {
      expect(parseUsersQuery(new URLSearchParams(search)), label).toEqual({
        ...DEFAULT_QUERY,
        ...expected,
      });
    }
  });

  it('carries through parameters it does not own', () => {
    const params = usersQueryToParams(
      { ...DEFAULT_QUERY, sort: 'desc', page: 2 },
      new URLSearchParams('?user=3&utm_source=slack'),
    );

    // Building a fresh URLSearchParams here drops `?user=`, so sorting the table closes
    // the dialog somebody is typing in. Every parameter added later falls into it too.
    expect(params.get('user')).toBe('3');
    expect(params.get('utm_source')).toBe('slack');
    expect(params.get('sort')).toBe('desc');

    // And a parameter back at its default is removed, not written out, or `page=1` piles
    // up in every shared link.
    expect(
      usersQueryToParams(DEFAULT_QUERY, new URLSearchParams('?page=3&q=old')).toString(),
    ).toBe('');
  });
});
