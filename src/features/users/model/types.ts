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
 * One user's local changes: only the fields that were edited, never a whole user.
 *
 * A stored copy of the whole record would freeze every other field at the moment of the
 * edit, so a name change would also pin the email and the city to whatever the API said
 * that day. Storing the changed field alone keeps the rest fresh on every fetch.
 */
export type UserEdit = {
  name: string;
};

/** Keyed by user id as a string, because that is what a JSON object key is. */
export type UserEdits = Record<string, UserEdit>;

export type UsersResponse = {
  items: User[];
  /** Matching the query before paging, not the number of rows in `items`. */
  total: number;
};
