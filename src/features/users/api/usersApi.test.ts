import { afterEach, describe, expect, it, vi } from 'vitest';
import { isHttpError, isRetryable } from '@/shared/lib/http';
import { idsOf, namesOf } from '@/test/makeUser';
import { DEFAULT_QUERY } from '../model/usersParams';
import type { UserEdits, UsersQuery } from '../model/types';
import { listUsers } from './usersApi';

/**
 * Renames are merged in before the search, the sort and the paging run. Merged in after,
 * the new name is on screen while all three still work on the old one.
 */

/** The wire shape, which is not the shape the app works in. That mapping is the point. */
function apiUser(id: number, patch: { name?: string } = {}) {
  return {
    id,
    name: patch.name ?? `User ${id}`,
    username: `user${id}`,
    email: `user${id}@example.com`,
    phone: `555-000-${id}`,
    website: `user${id}.example.com`,
    address: {
      street: `Street ${id}`,
      suite: `Suite ${id}`,
      city: `City ${id}`,
      zipcode: `1000${id}`,
      geo: { lat: '0', lng: '0' },
    },
    company: { name: `Company ${id}`, catchPhrase: 'Ignored', bs: 'Ignored' },
  };
}

function serverHas(...rows: unknown[]) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response(JSON.stringify(rows))),
  );
}

function query(patch: Partial<UsersQuery> = {}): UsersQuery {
  return { ...DEFAULT_QUERY, ...patch };
}

const NO_EDITS: UserEdits = {};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('listUsers', () => {
  it('finds a renamed user by the name on screen, not the one the server has', async () => {
    serverHas(apiUser(1, { name: 'Aaron' }), apiUser(2, { name: 'Bob' }));

    const found = await listUsers(query({ search: 'Zebedee' }), {
      '1': { name: 'Zebedee' },
    });
    const byOldName = await listUsers(query({ search: 'Aaron' }), {
      '1': { name: 'Zebedee' },
    });

    // Searching for the name on the row finds nothing, and searching for a name nobody
    // can see returns a row that does not contain the term.
    expect(idsOf(found.items)).toEqual([1]);
    expect(byOldName.total).toBe(0);
  });

  it('pages a renamed user by the name on screen', async () => {
    serverHas(...'ABCDEF'.split('').map((name, index) => apiUser(index + 1, { name })));

    const page = await listUsers(query({ pageSize: 5, sort: 'asc' }), {
      '1': { name: 'Zoe' },
    });

    // A is Zoe here, so they belong on page two. A first page still holding them was
    // worked out from the server's names.
    expect(namesOf(page.items)).toEqual(['B', 'C', 'D', 'E', 'F']);
  });

  it('marks the renamed rows it is returning, and no others', async () => {
    serverHas(...'ABCDEF'.split('').map((name, index) => apiUser(index + 1, { name })));

    const page = await listUsers(query({ pageSize: 5, sort: 'asc' }), {
      '1': { name: 'Amelia' },
      '6': { name: 'Frances' },
      '99': { name: 'Long gone' },
    });

    // Read off the store at render time instead, the markers would describe a different
    // overlay than the names beside them, and mark a row that is not on screen.
    expect(page.editedIds).toEqual([1]);
  });

  it('refuses data in a shape it does not understand, without saying how', async () => {
    serverHas({ id: 'not a number' });

    const error = await listUsers(query(), NO_EDITS).catch((thrown: unknown) => thrown);

    // A zod message would put a field path on screen. It stays as the cause, where it is
    // worth something, and a parse failure gets no retry because it cannot go differently.
    expect(isHttpError(error) && error.kind).toBe('parse');
    expect(isHttpError(error) && error.message).toBe(
      'The server sent user data in a shape this app does not understand.',
    );
    expect(isRetryable(error)).toBe(false);
  });
});
