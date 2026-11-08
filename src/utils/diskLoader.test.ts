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

    it('should report progress before and after the download', async () => {
      vi.mocked(globalThis.fetch).mockResolvedValue(new Response(new Uint8Array([80, 75, 3, 4])));
      const onProgress = vi.fn();

      await loadZipArchive('http://example.com/archive.zip', onProgress);

      expect(onProgress.mock.calls).toEqual([
        [{ loaded: 0, total: 1, currentFile: 'Downloading ZIP archive...' }],
        [{ loaded: 1, total: 1, currentFile: 'ZIP archive loaded' }],
      ]);
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
