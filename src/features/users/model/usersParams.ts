import { z } from 'zod';
import {
  DEFAULT_PAGE_SIZE,
  PAGE_SIZE_OPTIONS,
  type PageSize,
} from '../constants/pagination';
import { URL_PARAM } from '../constants/urlParams';
import type { UsersQuery } from './types';

/** URL to query and back. Pure, so it is testable without rendering anything. */

export const DEFAULT_QUERY: UsersQuery = {
  search: '',
  city: null,
  sort: 'asc',
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
};

// A URL is user input: `?page=abc` and an outdated bookmark must not reach the data
// layer or break the screen, so every field falls back rather than throwing.
const sortSchema = z.enum(['asc', 'desc']).catch(DEFAULT_QUERY.sort);
const pageSchema = z.coerce.number().int().min(1).catch(DEFAULT_QUERY.page);

/**
 * The one place a page size is admitted into the app, from the URL or from the select.
 * `find` rather than a cast, so the union is proved rather than asserted.
 */
export function toPageSize(value: unknown): PageSize {
  return (
    PAGE_SIZE_OPTIONS.find((option) => option === Number(value)) ?? DEFAULT_PAGE_SIZE
  );
}

export function parseUsersQuery(params: URLSearchParams): UsersQuery {
  const city = params.get(URL_PARAM.city);

  return {
    search: params.get(URL_PARAM.search) ?? DEFAULT_QUERY.search,
    city: city === null || city === '' ? null : city,
    sort: sortSchema.parse(params.get(URL_PARAM.sort)),
    page: pageSchema.parse(params.get(URL_PARAM.page)),
    pageSize: toPageSize(params.get(URL_PARAM.pageSize)),
  };
}

/**
 * Anything at its default is removed, so a first load is a bare path.
 *
 * `existing` is carried through rather than replaced. This function owns five parameters
 * and must not discard the rest: building a fresh URLSearchParams means that opening a
 * user and then sorting drops `?user=` and closes the dialog, and every parameter added
 * later walks into the same trap.
 */
export function usersQueryToParams(
  query: UsersQuery,
  existing?: URLSearchParams,
): URLSearchParams {
  const params = new URLSearchParams(existing);

  setOrDelete(params, URL_PARAM.search, query.search.trim() === '' ? null : query.search);
  setOrDelete(params, URL_PARAM.city, query.city);
  setOrDelete(
    params,
    URL_PARAM.sort,
    query.sort === DEFAULT_QUERY.sort ? null : query.sort,
  );
  setOrDelete(
    params,
    URL_PARAM.page,
    query.page === DEFAULT_QUERY.page ? null : String(query.page),
  );
  setOrDelete(
    params,
    URL_PARAM.pageSize,
    query.pageSize === DEFAULT_QUERY.pageSize ? null : String(query.pageSize),
  );

  return params;
}

function setOrDelete(params: URLSearchParams, key: string, value: string | null): void {
  if (value === null) {
    params.delete(key);
  } else {
    params.set(key, value);
  }
}

/** True when anything is narrowing the list, which decides which empty state to show. */
export function isFiltered(query: UsersQuery): boolean {
  return query.search.trim() !== '' || query.city !== null;
}
