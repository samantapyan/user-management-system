import { afterEach, describe, expect, it, vi } from 'vitest';
import { getJson, isHttpError } from './http';

const URL = 'https://example.test/users';

/** Ten real seconds is not something a test waits for, so a controller stands in. */
function stubTimeout(): AbortController {
  const controller = new AbortController();
  vi.spyOn(AbortSignal, 'timeout').mockReturnValue(controller.signal);
  return controller;
}

function abortError(): DOMException {
  return new DOMException('The operation was aborted.', 'AbortError');
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('getJson', () => {
  it('tells a request the app cancelled apart from one that timed out', async () => {
    const timeout = stubTimeout();
    const caller = new AbortController();
    const cancelled = abortError();

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        caller.abort();
        throw cancelled;
      }),
    );
    const fromCancelling = await getJson(URL, caller.signal).catch(
      (thrown: unknown) => thrown,
    );

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        timeout.abort();
        throw abortError();
      }),
    );
    const fromTimeout = await getJson(URL).catch((thrown: unknown) => thrown);

    /* Both arrive as the same kind of DOMException, so this reads the signals rather than
       the error. Wrapping a cancelled one puts "could not reach the server" on screen
       while the user is still typing, so it is rethrown as the same object. */
    expect(fromCancelling).toBe(cancelled);
    expect(isHttpError(fromCancelling)).toBe(false);
    expect(isHttpError(fromTimeout) && fromTimeout.kind).toBe('timeout');
  });
});
