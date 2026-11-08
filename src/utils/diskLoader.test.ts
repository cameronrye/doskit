/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * Disk Loader Tests
 * Unit tests for disk loading utilities
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { loadZipArchive } from './diskLoader';
import { getUserFriendlyError } from './errorMessages';

// Mock fetch globally
globalThis.fetch = vi.fn();

/** A response whose body arrives in these chunks */
const chunkedResponse = (chunks: number[][], headers?: HeadersInit) =>
  new Response(
    new ReadableStream<Uint8Array>({
      start(controller) {
        for (const chunk of chunks) controller.enqueue(new Uint8Array(chunk));
        controller.close();
      },
    }),
    { headers }
  );

/** A response whose body arrives as the test sends it */
const openResponse = (headers?: HeadersInit) => {
  let body!: ReadableStreamDefaultController<Uint8Array>;
  const response = new Response(
    new ReadableStream<Uint8Array>({
      start(controller) {
        body = controller;
      },
    }),
    { headers }
  );
  return {
    response,
    send: (chunk: number[]) => body.enqueue(new Uint8Array(chunk)),
    end: () => body.close(),
  };
};

/** Like fetch, answer only once `answer` is called, and reject once the signal aborts */
const answerLater = () => {
  let answer!: (response: Response) => void;
  vi.mocked(globalThis.fetch).mockImplementation(
    (_input, init) =>
      new Promise<Response>((resolve, reject) => {
        answer = resolve;
        init?.signal?.addEventListener('abort', () => reject(init.signal?.reason));
      })
  );
  return (response: Response) => answer(response);
};

describe('diskLoader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('loadZipArchive', () => {
    it('should load ZIP archive successfully', async () => {
      const mockData = new Uint8Array([80, 75, 3, 4]); // ZIP header

      vi.mocked(globalThis.fetch).mockResolvedValue(new Response(mockData));

      const result = await loadZipArchive('http://example.com/archive.zip');

      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBeGreaterThan(0);
    });

    it('resolves with every chunk of the archive', async () => {
      vi.mocked(globalThis.fetch).mockResolvedValue(
        chunkedResponse([
          [80, 75],
          [3, 4, 9],
        ])
      );

      const result = await loadZipArchive('http://example.com/archive.zip');

      expect(result).toEqual(new Uint8Array([80, 75, 3, 4, 9]));
    });

    describe('progress', () => {
      const progressOf = async (response: Response) => {
        vi.mocked(globalThis.fetch).mockResolvedValue(response);
        const onProgress = vi.fn();
        await loadZipArchive('http://example.com/archive.zip', onProgress);
        return onProgress.mock.calls.map(([progress]) => progress);
      };

      // The download times itself out from its request on, retries included, so a caller
      // that times the steps before it, as the selector does, can stop once it has started
      it('reports its start before any answer arrives', async () => {
        answerLater();
        const controller = new AbortController();
        const onProgress = vi.fn();
        const download = loadZipArchive(
          'http://example.com/archive.zip',
          onProgress,
          controller.signal
        );
        await vi.waitFor(() => expect(globalThis.fetch).toHaveBeenCalled());

        expect(onProgress.mock.calls).toEqual([[{ loadedBytes: 0, totalBytes: null }]]);

        controller.abort();
        await expect(download).rejects.toBe(controller.signal.reason);
      });

      it('reports the bytes received, against the size the response gives', async () => {
        const response = chunkedResponse(
          [
            [80, 75, 3, 4],
            [1, 2, 3, 4, 5, 6],
          ],
          {
            'Content-Length': '10',
          }
        );

        expect(await progressOf(response)).toEqual([
          { loadedBytes: 0, totalBytes: null },
          { loadedBytes: 0, totalBytes: 10 },
          { loadedBytes: 4, totalBytes: 10 },
          { loadedBytes: 10, totalBytes: 10 },
        ]);
      });

      it.each([
        ['gives no size', undefined],
        ['gives a size that is not a number', { 'Content-Length': 'about 10' }],
      ])('reports no total when the response %s', async (_, headers) => {
        const response = chunkedResponse([[80, 75, 3, 4]], headers);

        expect(await progressOf(response)).toEqual([
          { loadedBytes: 0, totalBytes: null },
          { loadedBytes: 0, totalBytes: null },
          { loadedBytes: 4, totalBytes: null },
        ]);
      });

      // As when a server compresses the archive: Content-Length then counts the bytes sent,
      // and the body gives more
      it('stops reporting a total once more bytes arrive than it said', async () => {
        const response = chunkedResponse(
          [
            [80, 75, 3, 4],
            [5, 6],
          ],
          { 'Content-Length': '4' }
        );

        expect(await progressOf(response)).toEqual([
          { loadedBytes: 0, totalBytes: null },
          { loadedBytes: 0, totalBytes: 4 },
          { loadedBytes: 4, totalBytes: 4 },
          { loadedBytes: 6, totalBytes: null },
        ]);
      });
    });

    it('rejects with the status when the server returns an error', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(globalThis.fetch).mockResolvedValue(
        new Response(null, { status: 404, statusText: 'Not Found' })
      );

      await expect(loadZipArchive('http://example.com/missing.zip')).rejects.toHaveProperty(
        'message',
        'Failed to load ZIP: HTTP 404 Not Found'
      );
    });

    // GitHub Pages serves HTTP/2, whose responses carry no status text
    it('names the status code of an error response without status text', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(globalThis.fetch).mockResolvedValue(new Response(null, { status: 404 }));

      await expect(loadZipArchive('http://example.com/missing.zip')).rejects.toHaveProperty(
        'message',
        'Failed to load ZIP: HTTP 404'
      );
    });

    // Vite's dev and preview servers answer a missing archive with 200 and index.html,
    // which js-dos would otherwise start with as an empty C: drive
    describe('a response that is not a ZIP archive', () => {
      const failWith = async (response: Response) => {
        vi.spyOn(console, 'error').mockImplementation(() => {});
        vi.mocked(globalThis.fetch).mockResolvedValue(response);
        return loadZipArchive('http://example.com/missing.zip').catch((error: unknown) => error);
      };

      it('rejects it, naming what came instead', async () => {
        const error = await failWith(
          new Response('<!doctype html><html lang="en"></html>', {
            headers: { 'Content-Type': 'text/html' },
          })
        );

        expect(error).toHaveProperty(
          'message',
          'Failed to load ZIP: not a ZIP archive (text/html)'
        );
        expect(getUserFriendlyError(error).message).toBe('Unable to load the application archive');
      });

      it('rejects an empty one', async () => {
        const error = await failWith(new Response(null));

        expect(error).toHaveProperty('message', 'Failed to load ZIP: not a ZIP archive');
      });
    });

    it('should reject and log when the download fails', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      const error = new Error('Network error');
      vi.mocked(globalThis.fetch).mockRejectedValue(error);

      await expect(loadZipArchive('http://example.com/archive.zip')).rejects.toBe(error);
      expect(consoleError).toHaveBeenCalledWith('[DiskLoader] Error loading ZIP:', error);
    });

    // Callers abort on purpose: the selector's Cancel, or a navigation that supersedes
    // the load. They still need the rejection, but it is no failure worth logging.
    describe('when the caller aborts', () => {
      it('rejects without logging if aborted before the request starts', async () => {
        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
        const controller = new AbortController();
        controller.abort();

        // With the signal's own reason, as fetch rejects
        await expect(
          loadZipArchive('http://example.com/archive.zip', undefined, controller.signal)
        ).rejects.toBe(controller.signal.reason);
        expect(consoleError).not.toHaveBeenCalled();
        expect(globalThis.fetch).not.toHaveBeenCalled();
      });

      it('rejects without logging if aborted during the request', async () => {
        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
        const controller = new AbortController();
        // Like fetch, reject once the signal aborts. Browsers reject with a DOMException
        // that inherits from Error; jsdom's does not, so build the browser-shaped one.
        vi.mocked(globalThis.fetch).mockImplementation(
          (_input, init) =>
            new Promise<Response>((_resolve, reject) => {
              init?.signal?.addEventListener('abort', () =>
                reject(
                  Object.assign(new Error('The operation was aborted.'), { name: 'AbortError' })
                )
              );
            })
        );

        const download = loadZipArchive(
          'http://example.com/archive.zip',
          undefined,
          controller.signal
        );
        controller.abort();

        await expect(download).rejects.toMatchObject({ name: 'AbortError' });
        expect(consoleError).not.toHaveBeenCalled();
      });

      it('stops reading the archive', async () => {
        const controller = new AbortController();
        const cancel = vi.fn();
        vi.mocked(globalThis.fetch).mockResolvedValue(
          new Response(new ReadableStream<Uint8Array>({ cancel }))
        );
        const onProgress = vi.fn();
        const download = loadZipArchive(
          'http://example.com/archive.zip',
          onProgress,
          controller.signal
        );
        // Its start, then its response
        await vi.waitFor(() => expect(onProgress).toHaveBeenCalledTimes(2));

        controller.abort();

        await expect(download).rejects.toBe(controller.signal.reason);
        expect(cancel).toHaveBeenCalled();
      });

      // A caller that has moved on must not see the progress of what it abandoned
      it('reports no progress once aborted, even for a chunk that had already arrived', async () => {
        const controller = new AbortController();
        const { response, send } = openResponse({ 'Content-Length': '4' });
        vi.mocked(globalThis.fetch).mockResolvedValue(response);
        const onProgress = vi.fn();
        const download = loadZipArchive(
          'http://example.com/archive.zip',
          onProgress,
          controller.signal
        );
        // Its start, then its response
        await vi.waitFor(() => expect(onProgress).toHaveBeenCalledTimes(2));

        // The chunk is in, but the loader has not handled it yet when the caller aborts
        send([80, 75, 3, 4]);
        queueMicrotask(() => controller.abort());

        await expect(download).rejects.toBeDefined();
        expect(onProgress).toHaveBeenCalledTimes(2);
      });
    });

    // A connection can stay open and deliver nothing, as after a network handover. Slow
    // downloads that keep receiving data run as long as they need.
    describe('when nothing arrives for 20 seconds', () => {
      const failed = vi.fn();

      beforeEach(() => {
        vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
        vi.spyOn(console, 'error').mockImplementation(() => {});
        failed.mockReset();
      });

      afterEach(() => {
        vi.useRealTimers();
      });

      const expectTimeout = () => {
        expect(failed).toHaveBeenCalledTimes(1);
        const error: unknown = failed.mock.calls[0]?.[0];
        expect(getUserFriendlyError(error).message).toBe('The request took too long to complete');
        return error;
      };

      it('fails with a timeout when no response arrives', async () => {
        answerLater();
        loadZipArchive('http://example.com/archive.zip').catch(failed);

        await vi.advanceTimersByTimeAsync(19_999);
        expect(failed).not.toHaveBeenCalled();
        await vi.advanceTimersByTimeAsync(1);

        expect(expectTimeout()).toHaveProperty(
          'message',
          'Download timed out: no data received for 20 seconds'
        );
        // The request itself is abandoned
        expect(vi.mocked(globalThis.fetch).mock.calls[0]?.[1]?.signal?.aborted).toBe(true);
        expect(console.error).toHaveBeenCalledWith(
          '[DiskLoader] Error loading ZIP:',
          expect.objectContaining({ name: 'TimeoutError' })
        );
      });

      it('counts again from the response, and from each chunk of the archive', async () => {
        const answer = answerLater();
        const { response, send } = openResponse();
        loadZipArchive('http://example.com/archive.zip').catch(failed);

        await vi.advanceTimersByTimeAsync(15_000);
        answer(response);
        await vi.advanceTimersByTimeAsync(15_000);
        send([80, 75]);
        await vi.advanceTimersByTimeAsync(19_999);
        expect(failed).not.toHaveBeenCalled();
        await vi.advanceTimersByTimeAsync(1);

        expectTimeout();
      });

      it('completes a slow download that keeps receiving data', async () => {
        const { response, send, end } = openResponse();
        vi.mocked(globalThis.fetch).mockResolvedValue(response);
        const download = loadZipArchive('http://example.com/archive.zip');

        for (const chunk of [[80, 75], [3, 4], [1], [2]]) {
          await vi.advanceTimersByTimeAsync(15_000);
          send(chunk);
        }
        await vi.advanceTimersByTimeAsync(15_000);
        end();

        await expect(download).resolves.toEqual(new Uint8Array([80, 75, 3, 4, 1, 2]));
      });

      // Each answer is data arriving, even an error that fetchWithRetry tries again: a
      // server that keeps answering slowly fails with what it answered, not as a stall
      it('counts again from each answer that is retried', async () => {
        const slowly = (response: Response) => () =>
          new Promise<Response>((resolve) => setTimeout(() => resolve(response), 15_000));
        vi.mocked(globalThis.fetch)
          .mockImplementationOnce(slowly(new Response(null, { status: 503 })))
          .mockImplementationOnce(slowly(new Response(null, { status: 503 })))
          .mockImplementationOnce(slowly(chunkedResponse([[80, 75, 3, 4]])));
        const download = loadZipArchive('http://example.com/archive.zip');
        download.catch(failed);

        // Three answers 15 s apart, with the waits between the attempts
        await vi.advanceTimersByTimeAsync(60_000);

        expect(failed).not.toHaveBeenCalled();
        await expect(download).resolves.toEqual(new Uint8Array([80, 75, 3, 4]));
      });

      // An abort's reason came in Chrome 98, Firefox 97 and Safari 15.4, after Firefox 94,
      // which the README supports
      it('fails with the timeout in a browser whose aborts have no reason', async () => {
        const reason = Object.getOwnPropertyDescriptor(AbortSignal.prototype, 'reason')!;
        Object.defineProperty(AbortSignal.prototype, 'reason', {
          configurable: true,
          get: () => undefined,
        });
        try {
          answerLater();
          loadZipArchive('http://example.com/archive.zip').catch(failed);

          await vi.advanceTimersByTimeAsync(20_000);

          expect(expectTimeout()).toHaveProperty('name', 'TimeoutError');
        } finally {
          Object.defineProperty(AbortSignal.prototype, 'reason', reason);
        }
      });

      it('still retries a temporary server error first', async () => {
        vi.mocked(globalThis.fetch)
          .mockResolvedValueOnce(new Response(null, { status: 503 }))
          .mockResolvedValueOnce(chunkedResponse([[80, 75, 3, 4]]));
        const download = loadZipArchive('http://example.com/archive.zip');

        await vi.advanceTimersByTimeAsync(2000);

        await expect(download).resolves.toEqual(new Uint8Array([80, 75, 3, 4]));
        expect(globalThis.fetch).toHaveBeenCalledTimes(2);
      });
    });
  });
});
