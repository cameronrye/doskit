/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * Fetch with Retry Tests
 */

import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { fetchWithRetry } from './fetchWithRetry';

// Keep backoff delays at 1ms so retries run on real timers without slowing the suite
const FAST = { initialDelay: 1, maxDelay: 1 };

describe('fetchWithRetry', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('resolves with the final response when a retryable status persists', async () => {
    const fetchMock = vi.fn(
      async () => new Response(null, { status: 503, statusText: 'Service Unavailable' })
    );
    vi.stubGlobal('fetch', fetchMock);

    const response = await fetchWithRetry('/demos/x.zip', undefined, { ...FAST, maxRetries: 2 });

    // Callers rely on response.ok/statusText to build a readable error message
    expect(response.status).toBe(503);
    expect(response.statusText).toBe('Service Unavailable');
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('retries network failures reported with WebKit wording', async () => {
    // Safari and every iOS browser reject network failures with "Load failed"
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new TypeError('Load failed'))
      .mockResolvedValueOnce(new Response('ok', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    const response = await fetchWithRetry('/demos/x.zip', undefined, { ...FAST, maxRetries: 2 });

    expect(response.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('returns non-retryable error responses without retrying', async () => {
    const fetchMock = vi.fn(async () => new Response(null, { status: 404 }));
    vi.stubGlobal('fetch', fetchMock);

    const response = await fetchWithRetry('/missing.zip', undefined, { ...FAST, maxRetries: 3 });

    expect(response.status).toBe(404);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  // Offline, an archive the service worker has not stored fails at once, and every retry
  // would fail the same way. Only offline is reliable: navigator.onLine is true whenever
  // a network interface is up, whether or not the server can be reached.
  describe('when the browser reports being offline', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
      vi.restoreAllMocks();
    });

    it('fails a network error at once instead of retrying it', async () => {
      vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
      const fetchMock = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));
      vi.stubGlobal('fetch', fetchMock);

      const failed = vi.fn();
      // The default retries wait about 1, 2 and 4 seconds
      fetchWithRetry('/demos/x.zip').catch(failed);
      await vi.advanceTimersByTimeAsync(0);

      expect(failed).toHaveBeenCalledWith(expect.objectContaining({ message: 'Failed to fetch' }));
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('stops retrying once the browser goes offline', async () => {
      const onLine = vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
      const fetchMock = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));
      vi.stubGlobal('fetch', fetchMock);

      const failed = vi.fn();
      fetchWithRetry('/demos/x.zip', undefined, { initialDelay: 1000, maxDelay: 1000 }).catch(
        failed
      );
      await vi.advanceTimersByTimeAsync(0);
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(failed).not.toHaveBeenCalled();

      onLine.mockReturnValue(false);
      await vi.advanceTimersByTimeAsync(1000);

      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(failed).toHaveBeenCalledWith(expect.objectContaining({ message: 'Failed to fetch' }));
    });
  });

  describe('retries', () => {
    const serverError = () =>
      vi.fn(async () => new Response(null, { status: 503, statusText: 'Service Unavailable' }));

    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
      vi.restoreAllMocks();
    });

    it.each([408, 429, 500, 502, 503, 504])('retries status %i by default', async (status) => {
      const fetchMock = vi.fn(async () => new Response(null, { status }));
      vi.stubGlobal('fetch', fetchMock);

      const response = fetchWithRetry('/demos/x.zip');
      await vi.runAllTimersAsync();

      expect((await response).status).toBe(status);
      expect(fetchMock).toHaveBeenCalledTimes(4);
    });

    it('tells onRetry the attempt, the error and the delay before each retry', async () => {
      vi.spyOn(Math, 'random').mockReturnValue(0);
      vi.stubGlobal('fetch', serverError());
      const onRetry = vi.fn();

      const response = fetchWithRetry('/demos/x.zip', undefined, { maxRetries: 2, onRetry });
      await vi.runAllTimersAsync();
      await response;

      expect(onRetry.mock.calls).toEqual([
        [1, expect.objectContaining({ message: 'HTTP 503 Service Unavailable' }), 1000],
        [2, expect.objectContaining({ message: 'HTTP 503 Service Unavailable' }), 2000],
      ]);
    });

    it('waits the delay before each retry', async () => {
      vi.spyOn(Math, 'random').mockReturnValue(0);
      const fetchMock = serverError();
      vi.stubGlobal('fetch', fetchMock);

      fetchWithRetry('/demos/x.zip', undefined, { maxRetries: 1 }).catch(() => {});
      await vi.advanceTimersByTimeAsync(999);
      expect(fetchMock).toHaveBeenCalledTimes(1);
      await vi.advanceTimersByTimeAsync(1);

      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('doubles the delay each time, up to maxDelay', async () => {
      vi.spyOn(Math, 'random').mockReturnValue(0);
      vi.stubGlobal('fetch', serverError());
      const onRetry = vi.fn();

      const response = fetchWithRetry('/demos/x.zip', undefined, {
        maxRetries: 4,
        maxDelay: 5000,
        onRetry,
      });
      await vi.runAllTimersAsync();
      await response;

      expect(onRetry.mock.calls.map(([, , delay]) => delay)).toEqual([1000, 2000, 4000, 5000]);
    });

    // So that many clients do not retry in step
    it('adds up to 30% at random to each delay', async () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.99);
      vi.stubGlobal('fetch', serverError());
      const onRetry = vi.fn();

      const response = fetchWithRetry('/demos/x.zip', undefined, { maxRetries: 3, onRetry });
      await vi.runAllTimersAsync();
      await response;

      expect(onRetry.mock.calls.map(([, , delay]) => delay)).toEqual([1297, 2594, 5188]);
    });

    it('rejects at once when aborted during the wait, and tries no more', async () => {
      const fetchMock = serverError();
      vi.stubGlobal('fetch', fetchMock);
      const controller = new AbortController();
      const failed = vi.fn();
      fetchWithRetry('/demos/x.zip', undefined, { signal: controller.signal }).catch(failed);
      await vi.advanceTimersByTimeAsync(0);
      expect(fetchMock).toHaveBeenCalledTimes(1);

      controller.abort();
      await vi.advanceTimersByTimeAsync(0);

      expect(failed).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Operation aborted' })
      );
      await vi.runAllTimersAsync();
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('the signal fetch gets', () => {
    it("is the options' signal", async () => {
      const fetchMock = vi.fn(async () => new Response('ok'));
      vi.stubGlobal('fetch', fetchMock);
      const controller = new AbortController();

      await fetchWithRetry('/demos/x.zip', { method: 'GET' }, { signal: controller.signal });

      expect(fetchMock).toHaveBeenCalledWith('/demos/x.zip', {
        method: 'GET',
        signal: controller.signal,
      });
    });

    it("is the init's signal when the options give none", async () => {
      const fetchMock = vi.fn(async () => new Response('ok'));
      vi.stubGlobal('fetch', fetchMock);
      const controller = new AbortController();

      await fetchWithRetry('/demos/x.zip', { signal: controller.signal });

      expect(fetchMock).toHaveBeenCalledWith('/demos/x.zip', { signal: controller.signal });
    });
  });

  it('does not retry an aborted request', async () => {
    // Browsers reject with a DOMException that inherits from Error. jsdom's
    // DOMException does not, so build the browser-shaped equivalent.
    const abortError = Object.assign(new Error('The operation was aborted.'), {
      name: 'AbortError',
    });
    const fetchMock = vi.fn().mockRejectedValue(abortError);
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      fetchWithRetry('/demos/x.zip', undefined, { ...FAST, maxRetries: 3 })
    ).rejects.toMatchObject({ name: 'AbortError' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
