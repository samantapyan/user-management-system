import type { ZodType } from 'zod';

/**
 * Typed, versioned, validated access to one `localStorage` key.
 *
 * Everything here exists because `localStorage` is the least trustworthy input the app
 * has. It is a string map that survives deploys, so today's code reads what last month's
 * code wrote; the user can edit it by hand; and the browser can refuse both reads and
 * writes outright, which Safari does in private mode and which any browser does once the
 * quota is full. A bare `JSON.parse(localStorage.getItem(key)!)` fails at all three.
 *
 * So: the value is wrapped in a version, the parsed value is checked against a schema,
 * and anything that does not survive both is treated as absent rather than thrown. Old
 * or damaged data degrades to the fallback instead of taking the screen down with it.
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
