import { z } from 'zod';
import {
  DEFAULT_PAGE_SIZE,
  PAGE_SIZE_OPTIONS,
  type PageSize,
} from '../constants/pagination';
import type { UsersQuery } from './types';

/** URL to query and back. Pure, so it is testable without rendering anything. */

export const DEFAULT_QUERY: UsersQuery = {
  search: '',
  city: null,
  sort: 'asc',
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
};

// These stop being a detail the moment somebody bookmarks one, so they live in one place.
const PARAM = {
  search: 'q',
  city: 'city',
  sort: 'sort',
  page: 'page',
  pageSize: 'size',
} as const;

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
  const city = params.get(PARAM.city);

  return {
    search: params.get(PARAM.search) ?? DEFAULT_QUERY.search,
    city: city === null || city === '' ? null : city,
    sort: sortSchema.parse(params.get(PARAM.sort)),
    page: pageSchema.parse(params.get(PARAM.page)),
    pageSize: toPageSize(params.get(PARAM.pageSize)),
  };
}

/** Anything at its default is left out, so a first load is a bare path. */
export function usersQueryToParams(query: UsersQuery): URLSearchParams {
  const params = new URLSearchParams();

  if (query.search.trim() !== '') {
    params.set(PARAM.search, query.search);
  }
  if (query.city !== null) {
    params.set(PARAM.city, query.city);
  }
  if (query.sort !== DEFAULT_QUERY.sort) {
    params.set(PARAM.sort, query.sort);
  }
  if (query.page !== DEFAULT_QUERY.page) {
    params.set(PARAM.page, String(query.page));
  }
  if (query.pageSize !== DEFAULT_QUERY.pageSize) {
    params.set(PARAM.pageSize, String(query.pageSize));
  }

  return params;
}

/** True when anything is narrowing the list, which decides which empty state to show. */
export function isFiltered(query: UsersQuery): boolean {
  return query.search.trim() !== '' || query.city !== null;
}
