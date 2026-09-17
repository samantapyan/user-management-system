/**
 * Every URL parameter this feature owns, in one place.
 *
 * These stop being an implementation detail the moment somebody bookmarks or shares a
 * link, so they are a contract. Two modules read and write them, and a name defined in
 * both is a name that will eventually disagree with itself.
 */
export const URL_PARAM = {
  search: 'q',
  city: 'city',
  sort: 'sort',
  page: 'page',
  pageSize: 'size',
  openUser: 'user',
} as const;
