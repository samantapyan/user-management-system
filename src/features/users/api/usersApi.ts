import { getJson, HttpError } from '@/shared/lib/http';
import { queryUsers } from '../model/queryUsers';
import { usersResponseSchema } from '../model/schemas';
import type { UsersQuery, UsersResponse } from '../model/types';

/**
 * The users endpoint, shaped the way a real one would be.
 *
 * `listUsers` takes a query and answers with a page and a total. That contract
 * is the point of this file. Today there is no server that can do any of it, so
 * the whole list is fetched and the query is applied here. None of that is
 * visible from the outside, and when a real backend appears this function turns
 * into a single request with the query in the URL, while every component above
 * it stays exactly as it is.
 *
 * Writing it the other way round, with components filtering an array they
 * fetched themselves, would mean that swap is a rewrite of the screen rather
 * than a rewrite of this file.
 */

const USERS_ENDPOINT = 'https://jsonplaceholder.typicode.com/users';

export async function listUsers(
  query: UsersQuery,
  signal?: AbortSignal,
): Promise<UsersResponse> {
  const payload = await getJson(USERS_ENDPOINT, signal);

  const parsed = usersResponseSchema.safeParse(payload);
  if (!parsed.success) {
    /* A zod error is useful to me and meaningless to a user, so it is kept as
       the cause and replaced with something the interface can show. Letting it
       through would put a field path on screen. */
    throw new HttpError(
      'parse',
      'The server sent user data in a shape this app does not understand.',
      { cause: parsed.error },
    );
  }

  return queryUsers(parsed.data, query);
}
