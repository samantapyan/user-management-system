import type { PageSize } from '../constants/pagination';

/** The shape the app works in. Not the wire format: `api/` maps one onto the other. */
export type User = {
  id: number;
  name: string;
  username: string;
  email: string;
  phone: string;
  website: string;
  company: string;
  address: UserAddress;
};

type UserAddress = {
  street: string;
  suite: string;
  city: string;
  zipcode: string;
};

export type SortDirection = 'asc' | 'desc';

/** One object because it is also the query cache key. See `useUsersQuery`. */
export type UsersQuery = {
  search: string;
  /** null means every city. */
  city: string | null;
  sort: SortDirection;
  /** One based. */
  page: number;
  pageSize: PageSize;
};

/** What the table can ask to change. Search and city belong to the filters, not to it. */
export type UsersTableQueryPatch = Partial<
  Pick<UsersQuery, 'sort' | 'page' | 'pageSize'>
>;

/** And the mirror of it: the filters cannot reach sorting or paging. */
export type UsersFiltersQueryPatch = Partial<Pick<UsersQuery, 'search' | 'city'>>;

/**
 * Only the fields that were edited, never a whole user. A stored copy of the record would
 * pin the email and the city to whatever the API said on the day of the rename.
 */
export type UserEdit = {
  name: string;
};

/** Keyed by user id as a string, because that is what a JSON object key is. */
export type UserEdits = Record<string, UserEdit>;

/** What the search, sort and paging work produces. */
export type UsersPage = {
  items: User[];
  /** Matching the query before paging, not the number of rows in `items`. */
  total: number;
};

/**
 * What `api/` answers with. `editedIds` travels with the rows: read live from the store
 * instead, a marker would describe a different overlay than the names beside it.
 */
export type UsersResponse = UsersPage & {
  editedIds: number[];
};
