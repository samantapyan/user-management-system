/**
 * The shape the rest of the app works in.
 *
 * This is deliberately not the shape the API returns. The wire format nests the
 * address and returns a company object with a catchphrase and a marketing
 * string in it, and none of that should travel through the application because
 * once a field is in the type, something eventually renders it. `api/` maps the
 * wire format onto this and nothing above `api/` ever sees the other one.
 */
export type User = {
  id: number;
  name: string;
  username: string;
  email: string;
  phone: string;
  website: string;
  /** The company name only. The wire format also carries a slogan. */
  company: string;
  address: UserAddress;
};

export type UserAddress = {
  street: string;
  suite: string;
  city: string;
  zipcode: string;
};

export type SortDirection = 'asc' | 'desc';

/**
 * Everything that decides which users are on screen.
 *
 * This object is the single description of the current view. It is what the URL
 * is read into, what the data layer is asked for, and what the query cache is
 * keyed by. Keeping it as one value rather than five loose arguments is what
 * makes the cache key correct by construction: if a field is in here it is in
 * the key, so an answer for an older view can never be mistaken for this one.
 *
 * There is no `sortBy`. Only the name is sortable, so a field that can hold one
 * value is a decision nobody made yet dressed up as flexibility.
 */
export type UsersQuery = {
  /** Free text, matched against name and email. Empty means no search. */
  search: string;
  /** Exact city, or null for all cities. */
  city: string | null;
  sort: SortDirection;
  /** One based, because it is shown to a person. */
  page: number;
  pageSize: number;
};

/**
 * What the data layer answers with.
 *
 * `total` is the number of users matching the query before paging, not the
 * number in `data`. That is what a server returns, and it is what the interface
 * needs in order to say how many pages there are.
 */
export type UsersResponse = {
  data: User[];
  total: number;
};
