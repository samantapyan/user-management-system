import { config } from '@/shared/config';
import { getJson, HttpError } from '@/shared/lib/http';
import { distinctCities } from '../model/cityOptions';
import { queryUsers } from '../model/queryUsers';
import { usersResponseSchema } from '../model/schemas';
import type { User, UsersQuery, UsersResponse } from '../model/types';

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

export async function listUsers(
  query: UsersQuery,
  signal?: AbortSignal,
): Promise<UsersResponse> {
  return queryUsers(await fetchAllUsers(signal), query);
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
  return users.find((user) => user.id === id) ?? null;
}
