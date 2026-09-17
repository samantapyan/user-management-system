import { useSyncExternalStore } from 'react';
import { createStorage } from '@/shared/lib/storage';
import { editKey } from './applyEdits';
import { userEditsSchema } from './schemas';
import type { UserEdits } from './types';

/**
 * Every local rename, and the only thing in the app that outlives a reload.
 *
 * A store rather than React state because the overlay is read in two unrelated places -
 * the list query and the detail query - and neither is an ancestor of the other. Context
 * would work and would re-render every consumer of it on every keystroke elsewhere;
 * `useSyncExternalStore` lets React subscribe to exactly this and nothing more.
 */

const EMPTY: UserEdits = {};

const storage = createStorage<UserEdits>({
  key: 'user-management.user-edits',
  version: 1,
  schema: userEditsSchema,
  fallback: EMPTY,
});

/**
 * Read once, on the first question, then kept in memory.
 *
 * Kept, because `getSnapshot` has to return the same reference until the value actually
 * changes: reading from `localStorage` on every call hands back a new object each time,
 * which makes `useSyncExternalStore` see a change on every render and loop until React
 * gives up.
 *
 * Lazy, because reading at module scope would touch `localStorage` on import. Every other
 * file in `model/` can be imported and tested with no browser at all, and one that cannot
 * be is the one nobody writes a test for.
 */
let snapshot: UserEdits | null = null;

const listeners = new Set<() => void>();
let stopListeningToOtherTabs: (() => void) | null = null;

function emit(): void {
  for (const listener of listeners) listener();
}

function subscribe(onStoreChange: () => void): () => void {
  listeners.add(onStoreChange);

  // Attached once for however many components are subscribed, not once per component.
  stopListeningToOtherTabs ??= storage.subscribe(() => {
    snapshot = storage.read();
    emit();
  });

  return () => {
    listeners.delete(onStoreChange);
    if (listeners.size === 0) {
      stopListeningToOtherTabs?.();
      stopListeningToOtherTabs = null;
    }
  };
}

function getSnapshot(): UserEdits {
  snapshot ??= storage.read();
  return snapshot;
}

/**
 * Applies the change in memory first and reports whether it also reached disk.
 *
 * The two are separate on purpose. A full quota or a browser with storage switched off
 * must not swallow the rename the user just made, but it must not be reported as saved
 * either: that is the difference between a change that survives a reload and one that
 * does not, and the user is the only one who can decide what to do about it.
 */
function commit(next: UserEdits): boolean {
  snapshot = next;
  const persisted = storage.write(next);
  emit();
  return persisted;
}

export function saveUserName(id: number, name: string): boolean {
  return commit({ ...getSnapshot(), [editKey(id)]: { name } });
}

export function revertUser(id: number): boolean {
  const { [editKey(id)]: removed, ...rest } = getSnapshot();
  // Nothing to do, and committing would tell every subscriber to re-render for nothing.
  if (removed === undefined) return true;
  return commit(rest);
}

export function useUserEdits(): UserEdits {
  return useSyncExternalStore(subscribe, getSnapshot);
}
