import { describe, expect, it } from 'vitest';
import { HttpError } from '@/shared/lib/http';
import { makeUser } from '@/test/makeUser';
import { DEFAULT_QUERY } from './usersParams';
import { resolveUsersViewState } from './usersViewState';
import type { UsersResponse } from './types';

type Result = Parameters<typeof resolveUsersViewState>[0];

const page: UsersResponse = {
  items: [makeUser(1, { name: 'Leanne' })],
  total: 1,
  editedIds: [1],
};

const empty: UsersResponse = { items: [], total: 0, editedIds: [] };

function result(patch: Partial<Result> = {}): Result {
  return {
    data: undefined,
    error: null,
    isPending: false,
    isFetching: false,
    isPlaceholderData: false,
    ...patch,
  };
}

describe('resolveUsersViewState', () => {
  it('only keeps rows through a failure when they answer the current query', () => {
    const error = new HttpError('network', 'Could not reach the server.');

    const borrowed = resolveUsersViewState(
      result({ error, data: page, isPlaceholderData: true }),
      DEFAULT_QUERY,
    );
    const itsOwn = resolveUsersViewState(result({ error, data: page }), DEFAULT_QUERY);
    const stillTrying = resolveUsersViewState(
      result({ error, data: page, isFetching: true }),
      DEFAULT_QUERY,
    );

    /* The same error and rows three times, with a different right answer each time.
       Placeholder rows answer the previous query. Rows that answer this one are merely
       old. A retry still running is not yet a failure to warn about. */
    expect(borrowed.status).toBe('error');
    expect(itsOwn).toMatchObject({ status: 'ready', refreshFailed: true });
    expect(stillTrying).toMatchObject({ status: 'ready', refreshFailed: false });
  });

  it('tells a list with nothing in it apart from filters that hid everything', () => {
    const noUsers = resolveUsersViewState(result({ data: empty }), DEFAULT_QUERY);
    const noMatches = resolveUsersViewState(result({ data: empty }), {
      ...DEFAULT_QUERY,
      search: 'nobody',
    });
    const onlySpaces = resolveUsersViewState(result({ data: empty }), {
      ...DEFAULT_QUERY,
      search: '   ',
    });

    // The same empty table, and only one has a way out. A search of spaces matches
    // everything, so it is not a filter and there is nothing to offer to clear.
    expect(noUsers).toEqual({ status: 'empty' });
    expect(noMatches).toEqual({ status: 'no-results' });
    expect(onlySpaces).toEqual({ status: 'empty' });
  });
});
