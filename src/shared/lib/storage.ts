import type { ZodType } from 'zod';

/**
 * Typed, versioned, validated access to one `localStorage` key. It survives deploys, the
 * user can edit it by hand, and the browser can refuse a read or a write outright, so a
 * bare `JSON.parse(getItem(key))` fails three ways. Anything that does not survive the
 * version and the schema is treated as absent rather than thrown.
 */

type Envelope = {
  v: number;
  data: unknown;
};

type Storage<T> = {
  read: () => T;
  /** False when the browser refused the write, so the caller can say so on screen. */
  write: (value: T) => boolean;
  /** Fires when another tab writes this key. The browser never fires it for our own. */
  subscribe: (onChange: () => void) => () => void;
};

export function createStorage<T>(options: {
  key: string;
  /** Bump when the stored shape changes. Anything written under an older one is dropped. */
  version: number;
  schema: ZodType<T>;
  fallback: T;
}): Storage<T> {
  const { key, version, schema, fallback } = options;

  return {
    read: () => {
      let raw: string | null;
      try {
        raw = window.localStorage.getItem(key);
      } catch {
        // Storage disabled entirely. The app works, it just does not remember.
        return fallback;
      }
      if (raw === null) return fallback;

      let envelope: Envelope;
      try {
        envelope = JSON.parse(raw) as Envelope;
      } catch {
        return fallback;
      }

      if (envelope?.v !== version) return fallback;

      // Not thrown: a shape this version does not understand is old data, not a bug.
      const parsed = schema.safeParse(envelope.data);
      return parsed.success ? parsed.data : fallback;
    },

    write: (value) => {
      const envelope: Envelope = { v: version, data: value };
      try {
        window.localStorage.setItem(key, JSON.stringify(envelope));
        return true;
      } catch {
        return false;
      }
    },

    subscribe: (onChange) => {
      const handle = (event: StorageEvent) => {
        // null key means the whole store was cleared, which also concerns us.
        if (event.key === null || event.key === key) onChange();
      };
      window.addEventListener('storage', handle);
      return () => window.removeEventListener('storage', handle);
    },
  };
}
