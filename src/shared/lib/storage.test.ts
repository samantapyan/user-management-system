import { afterEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { installFakeLocalStorage } from '@/test/fakeLocalStorage';
import { createStorage } from './storage';

const KEY = 'test.value';
const FALLBACK = { name: 'fallback' };

function makeStorage(version = 1) {
  return createStorage({
    key: KEY,
    version,
    schema: z.object({ name: z.string() }),
    fallback: FALLBACK,
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('createStorage', () => {
  it('reads anything it cannot trust as the fallback, rather than throwing', () => {
    const cases: [string, (disk: ReturnType<typeof installFakeLocalStorage>) => void][] =
      [
        [
          'a version this build does not understand',
          (disk) =>
            disk.entries.set(KEY, JSON.stringify({ v: 0, data: { name: 'Leanne' } })),
        ],
        [
          'a shape the schema rejects',
          (disk) => disk.entries.set(KEY, JSON.stringify({ v: 1, data: { name: 42 } })),
        ],
        ['a half written value', (disk) => disk.entries.set(KEY, '{"v":1,"data":{"nam')],
        [
          'the literal null, which has no version to read',
          (disk) => disk.entries.set(KEY, 'null'),
        ],
        ['a browser that refuses to read', (disk) => disk.failReads()],
        [
          'a browser that will not hand over the store at all',
          (disk) => disk.denyAccess(),
        ],
      ];

    /* A deploy that changed the shape, a user in devtools, a write cut off by a closing
       tab, Safari in private mode, cookies blocked. A bare JSON.parse of getItem throws on
       most of these, during a render, so one stale key takes the screen down. */
    for (const [label, breakIt] of cases) {
      const disk = installFakeLocalStorage();
      breakIt(disk);

      expect(() => makeStorage().read(), label).not.toThrow();
      expect(makeStorage().read(), label).toBe(FALLBACK);
    }
  });

  it('reports a refused write instead of reporting success', () => {
    const disk = installFakeLocalStorage();
    const storage = makeStorage();

    expect(storage.write({ name: 'Leanne' })).toBe(true);
    // Pinned because a key or version changed by accident is every user's edits gone on
    // the next deploy, with nothing on screen to say so.
    expect(disk.entries.get(KEY)).toBe('{"v":1,"data":{"name":"Leanne"}}');

    disk.failWrites();

    // Neither thrown, which loses the change, nor swallowed, which promises it was saved.
    // Only the user can decide what to do about a rename that will not survive a reload.
    expect(storage.write({ name: 'Ervin' })).toBe(false);
  });
});
