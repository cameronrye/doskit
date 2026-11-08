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

        await expect(
          loadZipArchive('http://example.com/archive.zip', undefined, controller.signal)
        ).rejects.toThrow('Operation aborted');
        expect(consoleError).not.toHaveBeenCalled();
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
    });
  });
});
