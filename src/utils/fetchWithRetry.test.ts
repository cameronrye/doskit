/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * Fetch with Retry Tests
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
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
