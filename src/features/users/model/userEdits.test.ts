import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { installFakeLocalStorage } from '@/test/fakeLocalStorage';
import type { UserEdits } from './types';

/**
 * The store holds the edits in memory and on disk, and both tests are about the gap
 * between them. Each loads a fresh copy of the module, which holds state. The
 * useSyncExternalStore wiring needs a renderer, so it is not covered here.
 */

const KEY = 'user-management.user-edits';

let disk: ReturnType<typeof installFakeLocalStorage>;

async function loadStore() {
  vi.resetModules();
  return import('./userEdits');
}

function stored(): UserEdits | undefined {
  const raw = disk.entries.get(KEY);
  return raw === undefined ? undefined : (JSON.parse(raw) as { data: UserEdits }).data;
}

beforeEach(() => {
  disk = installFakeLocalStorage();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('saveUserName', () => {
  it('picks up the edits an earlier session left behind', async () => {
    disk.entries.set(
      KEY,
      JSON.stringify({ v: 1, data: { '1': { name: 'From last week' } } }),
    );

    const store = await loadStore();
    store.saveUserName(2, 'From today');

    // The whole point of the feature. Read too late, or not at all, and the first rename
    // of a session silently wipes every earlier one.
    expect(stored()).toEqual({
      '1': { name: 'From last week' },
      '2': { name: 'From today' },
    });
  });

  it('keeps a rename the browser refused to store, and says it refused', async () => {
    const store = await loadStore();

    disk.failWrites();
    expect(store.saveUserName(1, 'Not on disk')).toBe(false);

    disk.failWrites(false);
    expect(store.saveUserName(2, 'On disk')).toBe(true);

    // The first rename appears in the second write, so it was on screen all along. A full
    // quota must not swallow the change, only stop it surviving a reload, and say so.
    expect(stored()).toEqual({
      '1': { name: 'Not on disk' },
      '2': { name: 'On disk' },
    });
  });
});
