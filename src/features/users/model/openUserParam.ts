import { URL_PARAM } from '../constants/urlParams';

/**
 * Which user's detail is open, read from and written to the URL. Pure, so it is testable
 * without rendering anything.
 *
 * Deliberately not part of `UsersQuery`. Opening a user does not change which users are
 * listed, and `UsersQuery` is the data layer's cache key, so folding this into it would
 * refetch the whole list every time somebody opened a row.
 */

/** A URL is user input, so anything that is not a positive integer opens nothing. */
export function parseOpenUserId(params: URLSearchParams): number | null {
  const raw = params.get(URL_PARAM.openUser);
  if (raw === null) {
    return null;
  }

  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

/** Carries the rest of the URL through, so opening a user keeps the current filters. */
export function withOpenUser(
  params: URLSearchParams,
  id: number | null,
): URLSearchParams {
  const next = new URLSearchParams(params);

  if (id === null) {
    next.delete(URL_PARAM.openUser);
  } else {
    next.set(URL_PARAM.openUser, String(id));
  }

  return next;
}
