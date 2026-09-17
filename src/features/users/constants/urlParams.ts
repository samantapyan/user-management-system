/**
 * Every URL parameter this feature owns. They become a contract the moment somebody
 * shares a link, and two modules read them, so the names are spelled out once.
 */
export const URL_PARAM = {
  search: 'q',
  city: 'city',
  sort: 'sort',
  page: 'page',
  pageSize: 'size',
  openUser: 'user',
} as const;
