import { vi } from 'vitest';

/**
 * A localStorage that can be made to misbehave on purpose, because a real one will not do
 * it on demand. Also why this suite needs no DOM: it is the only browser API the app uses.
 */

type FakeLocalStorage = {
  /** What is on disk, as the browser holds it: strings. */
  readonly entries: Map<string, string>;
  /** Safari in private mode: the store is there, and reading from it throws. */
  failReads: (fail?: boolean) => void;
  /** A full quota: the store is there, and writing to it throws. */
  failWrites: (fail?: boolean) => void;
  /** Cookies blocked: reaching `window.localStorage` at all throws. */
  denyAccess: (deny?: boolean) => void;
};

export function installFakeLocalStorage(): FakeLocalStorage {
  const entries = new Map<string, string>();

  let readsFail = false;
  let writesFail = false;
  let accessDenied = false;

  const localStorage = {
    getItem: (key: string): string | null => {
      if (readsFail) throw new Error('Read denied.');
      return entries.get(key) ?? null;
    },
    setItem: (key: string, value: string): void => {
      if (writesFail) throw new Error('Quota exceeded.');
      entries.set(key, value);
    },
    removeItem: (key: string): void => {
      entries.delete(key);
    },
  };

  // Undone by vi.unstubAllGlobals(), which every file using this calls in afterEach.
  vi.stubGlobal('window', {
    get localStorage() {
      if (accessDenied) throw new Error('Storage access denied.');
      return localStorage;
    },
  });

  return {
    entries,
    failReads: (fail = true) => {
      readsFail = fail;
    },
    failWrites: (fail = true) => {
      writesFail = fail;
    },
    denyAccess: (deny = true) => {
      accessDenied = deny;
    },
  };
}
