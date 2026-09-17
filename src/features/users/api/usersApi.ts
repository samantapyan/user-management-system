import { config } from '@/shared/config';
import { getJson, HttpError } from '@/shared/lib/http';
import { applyEdits, findEdit } from '../model/applyEdits';
import { distinctCities } from '../model/cityOptions';
import { queryUsers } from '../model/queryUsers';
import { usersResponseSchema } from '../model/schemas';
import type { User, UserEdits, UsersQuery, UsersResponse } from '../model/types';

/**
 * Query in, page and total out. No server does any of it yet, so the whole list is
 * fetched and queried here, which makes a real backend a change to this file alone.
 */

const USERS_ENDPOINT = `${config.apiBaseUrl}/users`;

async function fetchAllUsers(signal?: AbortSignal): Promise<User[]> {
  const payload = await getJson(USERS_ENDPOINT, signal);

  const parsed = usersResponseSchema.safeParse(payload);
  if (!parsed.success) {
    // A zod error would put a field path on screen.
    throw new HttpError(
      'parse',
      'The server sent user data in a shape this app does not understand.',
      { cause: parsed.error },
    );
  }

  return parsed.data;
}

/**
 * The renames are an input, not a decoration: merged in on the line before the query
 * runs, which is what makes search and sort agree with the screen. See `applyEdits`.
 */
export async function listUsers(
  query: UsersQuery,
  edits: UserEdits,
  signal?: AbortSignal,
): Promise<UsersResponse> {
  const users = applyEdits(await fetchAllUsers(signal), edits);
  const page = queryUsers(users, query);

  // Which of the rows being returned were renamed, reported alongside them rather than
  // left for the screen to work out from a store that may have moved on since.
  return {
    ...page,
    editedIds: page.items
      .filter((user) => findEdit(edits, user.id) !== undefined)
      .map((user) => user.id),
  };
}

/**
 * Its own call on purpose. The filter needs every city and the list returns one page, so
 * a real backend changes this function and nothing else. It costs one cached request.
 */
export async function listCities(signal?: AbortSignal): Promise<string[]> {
  return distinctCities(await fetchAllUsers(signal));
}

/**
 * One user. Null rather than a throw when there is none: a link to a deleted user is an
 * ordinary thing to happen, not a failed request, and they deserve different messages.
 */
export async function getUser(id: number, signal?: AbortSignal): Promise<User | null> {
  const users = await fetchAllUsers(signal);
  return users.find((candidate) => candidate.id === id) ?? null;
}
