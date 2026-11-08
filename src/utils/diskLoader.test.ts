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

    it('should reject with the status text when the server returns an error', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(globalThis.fetch).mockResolvedValue(
        new Response(null, { status: 404, statusText: 'Not Found' })
      );

      await expect(loadZipArchive('http://example.com/missing.zip')).rejects.toThrow(
        'Failed to load ZIP: Not Found'
      );
    });

    it('should handle ZIP loading errors', async () => {
      vi.mocked(globalThis.fetch).mockRejectedValue(new Error('Network error'));

      await expect(loadZipArchive('http://example.com/archive.zip')).rejects.toThrow();
    });
  });
});
