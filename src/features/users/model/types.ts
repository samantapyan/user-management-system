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

export type UsersResponse = {
  items: User[];
  /** Matching the query before paging, not the number of rows in `items`. */
  total: number;
};
