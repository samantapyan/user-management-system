/** The only place in the app that calls fetch. Everything above it sees HttpError. */

const REQUEST_TIMEOUT_MS = 10_000;

type HttpErrorKind = 'network' | 'timeout' | 'status' | 'parse';

type HttpErrorOptions = {
  status?: number;
  cause?: unknown;
};

export class HttpError extends Error {
  readonly kind: HttpErrorKind;
  /** Only set when a server answered, so when `kind` is `status`. */
  readonly status: number | undefined;

  constructor(kind: HttpErrorKind, message: string, options: HttpErrorOptions = {}) {
    // exactOptionalPropertyTypes: `{ cause: undefined }` is not the same as passing nothing.
    super(message, options.cause === undefined ? undefined : { cause: options.cause });
    this.name = 'HttpError';
    this.kind = kind;
    this.status = options.status;
  }
}

export function isHttpError(error: unknown): error is HttpError {
  return error instanceof HttpError;
}

/** What to put on screen. Anything unrecognised gets a message, never a stack trace. */
export function errorMessage(error: unknown): string {
  return isHttpError(error) ? error.message : 'Something went wrong.';
}

/**
 * Whether offering "try again" is honest. A malformed response will be malformed the
 * second time too, so a retry button there is a button that does nothing.
 */
export function isRetryable(error: unknown): boolean {
  return !isHttpError(error) || error.kind !== 'parse';
}

/** Returns the body unvalidated. The caller owns the schema. */
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
    // A cancelled request is not a failed one. Rethrown untouched so the query layer can
    // tell them apart, otherwise every superseded keystroke puts an error on screen.
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
