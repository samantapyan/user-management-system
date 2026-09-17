import { useSyncExternalStore } from 'react';
import { createStorage } from '@/shared/lib/storage';
import { editKey } from './applyEdits';
import { userEditsSchema } from './schemas';
import type { UserEdits } from './types';

/**
 * Every local rename, and the only thing that outlives a reload. A store rather than
 * context, because the two readers are not ancestors of each other and context would
 * re-render every consumer on a keystroke elsewhere.
 */

const EMPTY: UserEdits = {};

const storage = createStorage<UserEdits>({
  key: 'user-management.user-edits',
  version: 1,
  schema: userEditsSchema,
  fallback: EMPTY,
});

/**
 * Kept, because `getSnapshot` must return the same reference until the value changes, or
 * `useSyncExternalStore` sees a new object every render and loops. Lazy, because reading
 * at module scope would touch `localStorage` on import and make this untestable.
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
 * In memory first, then reports whether it reached disk. A full quota must not swallow
 * the rename, and must not be reported as saved either. Only the user can act on that.
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
