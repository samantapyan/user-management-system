import { URL_PARAM } from '../constants/urlParams';

/**
 * Which user's detail is open, held in the URL. Deliberately not part of `UsersQuery`:
 * that is the cache key, so folding it in would refetch the list on every row opened.
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
