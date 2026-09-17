import { QueryClient } from '@tanstack/react-query';
import { isHttpError } from '@/shared/lib/http';

/**
 * A factory rather than a shared instance, because a test that reuses one cache
 * across cases is a test that passes for the wrong reason.
 *
 * The API this runs against never fails and answers instantly. Every setting
 * here is for the one it will meet instead.
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        /* Thirty seconds. A list of people does not change from one second to
           the next, and refetching on every mount and every window focus makes
           the screen flicker to show the same rows. Short enough that a real
           change still appears without a reload. */
        staleTime: 30_000,

        retry: (failureCount, error) => {
          /* Retrying a 404 or a 403 is asking the same question again and
             waiting longer for the same answer. 408 and 429 are the exceptions:
             those are the server saying "not now" rather than "no". */
          if (isHttpError(error) && error.kind === 'status') {
            const status = error.status ?? 0;
            const worthRetrying = status === 408 || status === 429 || status >= 500;
            if (!worthRetrying) {
              return false;
            }
          }
          return failureCount < 2;
        },

        /* Backs off so that a struggling server is not hit three times in a
           second by every open tab. */
        retryDelay: (attempt) => Math.min(1_000 * 2 ** attempt, 8_000),
      },
    },
  });
}
