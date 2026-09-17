import type { User } from '../model/types';

/**
 * The table's columns, defined once: the header, the body and the skeleton all read this
 * array, so adding a column is one entry rather than three edits that have to agree. Two
 * kinds, because the actions column has no value to read, and leaving it out of the array
 * is how the skeleton's count drifts from the table's.
 */

type UserColumnId = 'name' | 'email' | 'city' | 'company';

type DataColumn = {
  kind: 'data';
  id: UserColumnId;
  label: string;
  /**
   * The table sets `table-layout: fixed`, so this is what the browser uses rather than a
   * hint it weighs against the content. The five widths have to account for the whole
   * table between them, because whatever is left over the browser hands to one column.
   */
  width: string;
  /**
   * Returns a string on purpose. A config that can render arbitrary elements stops being
   * configuration and becomes a framework.
   */
  value: (user: User) => string;
  /** Rendered as `th scope="row"`, so a screen reader can name the row it is reading. */
  isRowHeader?: boolean;
};

type ActionsColumn = {
  kind: 'actions';
  id: 'actions';
  /** Visually hidden. A column of buttons needs a name, not a visible heading. */
  label: string;
  width: string;
};

export const USERS_COLUMNS: readonly (DataColumn | ActionsColumn)[] = [
  {
    kind: 'data',
    id: 'name',
    label: 'Name',
    width: '25%',
    value: (user) => user.name,
    isRowHeader: true,
  },
  {
    kind: 'data',
    id: 'email',
    label: 'Email',
    width: '27%',
    value: (user) => user.email,
  },
  {
    kind: 'data',
    id: 'city',
    label: 'City',
    width: '19%',
    value: (user) => user.address.city,
  },
  {
    kind: 'data',
    id: 'company',
    label: 'Company',
    width: '19%',
    value: (user) => user.company,
  },
  // Pixels, not a percentage. This column holds one button, so what it needs is a fixed
  // amount of room rather than a share of the table that shrinks under the button.
  { kind: 'actions', id: 'actions', label: 'Actions', width: '64px' },
];

/**
 * The one sortable column. `UsersQuery` carries a direction and no field, so a `sortable`
 * flag per column would let two headers both claim to be the active sort. A second one
 * means adding `sortBy` to `UsersQuery` first.
 */
export const SORTABLE_COLUMN_ID: UserColumnId = 'name';
