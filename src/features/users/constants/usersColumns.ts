import type { User } from '../model/types';

/**
 * The table's columns, defined once.
 *
 * The header, the body and the loading skeleton all read this. Before it existed the
 * labels lived in the header, the values lived in the row component and the count lived
 * in an `Array.from({ length: 4 })`, so adding a column meant three edits in two files
 * and nothing checked that they agreed. A mismatch between the header and the skeleton
 * is only visible while data is loading, which is exactly when nobody is looking.
 *
 * `value` returns a string on purpose. Every column here is text, and a config that can
 * render arbitrary elements stops being configuration and becomes a framework. If one
 * column later needs a link or a chip, give this type an optional `render` then.
 */

type UserColumnId = 'name' | 'email' | 'city' | 'company';

type UserColumn = {
  id: UserColumnId;
  label: string;
  /** Percentages, so the layout holds as the container resizes. They add up to 100. */
  width: string;
  value: (user: User) => string;
  /** Rendered as `th scope="row"`, so a screen reader can name the row it is reading. */
  isRowHeader?: boolean;
};

/**
 * The one column the table can sort by, named here rather than flagged per column.
 *
 * `UsersQuery` carries a direction and no field, so exactly one column can be sortable.
 * A `sortable?: boolean` on every column would say otherwise, and setting it on a second
 * column would render two headers both marked as the active sort, both toggling this
 * one. Adding a second sortable column means adding `sortBy` to `UsersQuery` first.
 */
export const SORTABLE_COLUMN_ID: UserColumnId = 'name';

export const USERS_COLUMNS: readonly UserColumn[] = [
  {
    id: 'name',
    label: 'Name',
    width: '28%',
    value: (user) => user.name,
    isRowHeader: true,
  },
  { id: 'email', label: 'Email', width: '30%', value: (user) => user.email },
  { id: 'city', label: 'City', width: '21%', value: (user) => user.address.city },
  { id: 'company', label: 'Company', width: '21%', value: (user) => user.company },
];
