import { config } from '@/shared/config';
import { getJson, HttpError } from '@/shared/lib/http';
import { queryUsers } from '../model/queryUsers';
import { usersResponseSchema } from '../model/schemas';
import type { UsersQuery, UsersResponse } from '../model/types';

/**
 * Query in, page and total out. There is no server that can do any of it yet, so the
 * whole list is fetched and the query applied here. Keeping that inside this module is
 * what makes a real backend a change to this file rather than to the screen.
 */

const USERS_ENDPOINT = `${config.apiBaseUrl}/users`;

export async function listUsers(
  query: UsersQuery,
  signal?: AbortSignal,
): Promise<UsersResponse> {
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

  return queryUsers(parsed.data, query);
}
