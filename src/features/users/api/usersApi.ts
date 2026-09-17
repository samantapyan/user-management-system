import { config } from '@/shared/config';
import { getJson, HttpError } from '@/shared/lib/http';
import { applyEdits, findEdit } from '../model/applyEdits';
import { distinctCities } from '../model/cityOptions';
import { queryUsers } from '../model/queryUsers';
import { usersResponseSchema } from '../model/schemas';
import type { User, UserEdits, UsersQuery, UsersResponse } from '../model/types';

/**
 * Query in, page and total out. There is no server that can do any of it yet, so the
 * whole list is fetched and the query applied here. Keeping that inside this module is
 * what makes a real backend a change to this file rather than to the screen.
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
 * The local renames are an input, not a decoration applied afterwards, and they are
 * merged in on the line before the query runs. That single ordering is what makes search
 * and sort agree with what is on screen. See `applyEdits`.
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
 * Its own call on purpose, even though today it fetches the same thing as the list.
 *
 * The filter needs every city, and the list only ever returns one page, so the dropdown
 * cannot be built from it. A real backend would answer this from its own endpoint, and
 * writing it as a separate call now means that day changes this function and nothing
 * else. Against the fixture it costs a second request that the browser cache usually
 * serves.
 */
export async function listCities(signal?: AbortSignal): Promise<string[]> {
  return distinctCities(await fetchAllUsers(signal));
}

/**
 * One user. Today it filters the same full fetch; a real backend answers this from
 * `/users/:id`, and only this function changes.
 *
 * Returns null rather than throwing when there is no such user. A link to a user who has
 * been deleted is an ordinary thing to happen, not a failure of the request, and the two
 * deserve different messages on screen.
 */
export async function getUser(id: number, signal?: AbortSignal): Promise<User | null> {
  const users = await fetchAllUsers(signal);
  return users.find((candidate) => candidate.id === id) ?? null;
}
