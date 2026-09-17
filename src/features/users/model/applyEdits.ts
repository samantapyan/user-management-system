import type { User, UserEdit, UserEdits } from './types';

/**
 * Merging local renames into server data.
 *
 * This is the piece the whole edit feature turns on, and the order it runs in is the
 * thing to get right: the overlay goes on **before** search, sort and paging, never
 * after. Apply it after and a renamed row shows its new name while the server-side work
 * still runs on the old one, so searching for the name on screen finds nothing and the
 * row sorts under a value the user cannot see. It reads as three unrelated bugs and it is
 * one mistake. `usersApi` is where that order is enforced.
 *
 * Kept free of anything that touches storage or React, so it can be tested with two plain
 * objects and no browser.
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
