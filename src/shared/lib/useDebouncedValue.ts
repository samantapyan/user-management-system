import { useEffect, useState } from 'react';

/**
 * Used on the write to the URL, never on an input's own value. A text field that lags
 * behind typing is worse than anything debouncing fixes.
 */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
