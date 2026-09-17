/**
 * The only place in this app that calls `fetch`.
 *
 * Everything above this file deals with `HttpError`, never with a `Response`, a
 * status code or a network exception. That is what lets a component show a
 * useful message without knowing anything about transport, and it is why the
 * rule is that nothing outside `api/` may call `fetch` directly.
 */

/**
 * How long a request may take before we stop waiting.
 *
 * Without this, a slow network gives a spinner that never resolves and no way
 * back. Ten seconds is long enough that a slow connection still succeeds, and
 * short enough that a dead one does not hold the screen hostage.
 */
const REQUEST_TIMEOUT_MS = 10_000;

/**
 * Why a request failed, in terms the interface can act on.
 *
 * - `network`   the request never reached a server. Offline, DNS, CORS.
 * - `timeout`   a server was reached but did not answer in time.
 * - `status`    a server answered, and refused.
 * - `parse`     a server answered with something that is not usable JSON.
 */
export type HttpErrorKind = 'network' | 'timeout' | 'status' | 'parse';

type HttpErrorOptions = {
  status?: number;
  cause?: unknown;
};

export class HttpError extends Error {
  readonly kind: HttpErrorKind;
  /** Only set when a server actually answered, so `kind` is `status`. */
  readonly status: number | undefined;

  constructor(kind: HttpErrorKind, message: string, options: HttpErrorOptions = {}) {
    /* `exactOptionalPropertyTypes` means passing `{ cause: undefined }` is not
       the same as passing nothing, and only the second one is allowed here. */
    super(message, options.cause === undefined ? undefined : { cause: options.cause });
    this.name = 'HttpError';
    this.kind = kind;
    this.status = options.status;
  }
}

export function isHttpError(error: unknown): error is HttpError {
  return error instanceof HttpError;
}

/**
 * GET a URL and hand back the parsed JSON body, unvalidated.
 *
 * The return type is `unknown` on purpose. This function knows how to talk to a
 * server, not what a server is supposed to say, so the caller validates the
 * body against a schema before anything treats it as data.
 *
 * `signal` is the caller's cancellation. If the caller aborts, the underlying
 * error is rethrown untouched rather than wrapped, because a cancelled request
 * is not a failed one and the query layer has to be able to tell them apart. A
 * cancellation turned into an error state would put "something went wrong" on
 * screen every time somebody types.
 */
export async function getJson(url: string, signal?: AbortSignal): Promise<unknown> {
  const timeout = AbortSignal.timeout(REQUEST_TIMEOUT_MS);
  const combined = signal ? AbortSignal.any([signal, timeout]) : timeout;

  let response: Response;
  try {
    response = await fetch(url, {
      signal: combined,
      headers: { Accept: 'application/json' },
    });
  } catch (error) {
    if (timeout.aborted) {
      throw new HttpError(
        'timeout',
        `The server did not answer within ${REQUEST_TIMEOUT_MS / 1000} seconds.`,
        { cause: error },
      );
    }
    if (signal?.aborted) {
      throw error;
    }
    throw new HttpError('network', 'Could not reach the server.', { cause: error });
  }

  if (!response.ok) {
    throw new HttpError('status', `The server answered with ${response.status}.`, {
      status: response.status,
    });
  }

  try {
    return await response.json();
  } catch (error) {
    throw new HttpError('parse', 'The server answered with something that is not JSON.', {
      cause: error,
    });
  }
}
