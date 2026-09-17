import type { User, UserEdit, UserEdits } from './types';

/**
 * Merging local renames into server data. The overlay goes on before search, sort and
 * paging, never after, or a row sorts and matches under a name nobody can see.
 * `usersApi` enforces that order.
 */

/** The one place that knows edits are keyed by the id as a string, as JSON requires. */
export function editKey(id: number): string {
  return String(id);
}

export function findEdit(edits: UserEdits, id: number): UserEdit | undefined {
  return edits[editKey(id)];
}

/** Returns the same user when nothing was edited, so memoised rows do not re-render. */
export function applyEdit(user: User, edit: UserEdit | undefined): User {
  return edit === undefined ? user : { ...user, ...edit };
}

export function applyEdits(users: readonly User[], edits: UserEdits): readonly User[] {
  // Also keeps the array identity, which matters on the common path of no edits at all.
  if (Object.keys(edits).length === 0) return users;
  return users.map((user) => applyEdit(user, findEdit(edits, user.id)));
}
