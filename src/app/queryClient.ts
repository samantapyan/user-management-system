import { QueryClient } from '@tanstack/react-query';
import { isHttpError } from '@/shared/lib/http';

/** A factory, not a shared instance, so a test starts with an empty cache. */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // A list of people does not change second to second, and refetching on every
        // mount and focus makes the screen flicker to show the same rows.
        staleTime: 30_000,

        retry: (failureCount, error) => {
          // Asking a 404 again gets the same answer more slowly. 408 and 429 are the
          // server saying "not now" rather than "no".
          if (isHttpError(error) && error.kind === 'status') {
            const status = error.status ?? 0;
            const worthRetrying = status === 408 || status === 429 || status >= 500;
            if (!worthRetrying) {
              return false;
            }
          }
          return failureCount < 2;
        },

        retryDelay: (attempt) => Math.min(1_000 * 2 ** attempt, 8_000),
      },
    },
  });
}
