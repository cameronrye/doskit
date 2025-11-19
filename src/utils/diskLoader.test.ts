/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * Disk Loader Tests
 * Unit tests for disk loading utilities
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  loadFilesFromUrls,
  loadZipArchive,
  loadDiskImage,
  validateFileSize,
  type DosFile,
  type LoadProgress,
} from "./diskLoader";

// Mock fetch globally
global.fetch = vi.fn();

describe("diskLoader", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("validateFileSize", () => {
    it("should accept files under the size limit", async () => {
      const size = 10 * 1024 * 1024; // 10 MB
      const mockResponse = {
        ok: true,
        headers: new Headers({ "content-length": size.toString() }),
      };
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockResponse,
      );

      const result = await validateFileSize("https://example.com/file.zip", 50);
      expect(result).toBe(true);
    });

    it("should reject files over the size limit", async () => {
      const size = 60 * 1024 * 1024; // 60 MB
      const mockResponse = {
        ok: true,
        headers: new Headers({ "content-length": size.toString() }),
      };
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockResponse,
      );

      const result = await validateFileSize("https://example.com/file.zip", 50);
      expect(result).toBe(false);
    });

    it("should use default limit of 50MB", async () => {
      const size = 55 * 1024 * 1024; // 55 MB
      const mockResponse = {
        ok: true,
        headers: new Headers({ "content-length": size.toString() }),
      };
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockResponse,
      );

      const result = await validateFileSize("https://example.com/file.zip");
      expect(result).toBe(false);
    });

    it("should return true when content-length is not available", async () => {
      const mockResponse = {
        ok: true,
        headers: new Headers(),
      };
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockResponse,
      );

      const result = await validateFileSize("https://example.com/file.zip");
      expect(result).toBe(true);
    });

    it("should return true on fetch error", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error("Network error"),
      );

      const result = await validateFileSize("https://example.com/file.zip");
      expect(result).toBe(true);
    });
  });

  describe("loadFilesFromUrls", () => {
    it("should load files successfully", async () => {
      const mockData = new Uint8Array([1, 2, 3, 4]);
      const mockResponse = {
        ok: true,
        arrayBuffer: vi.fn().mockResolvedValue(mockData.buffer),
        headers: new Headers({ "content-length": "4" }),
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockResponse,
      );

      const files: DosFile[] = [
        { path: "/test.txt", url: "http://example.com/test.txt" },
      ];

      const result = await loadFilesFromUrls(files);

      expect(result).toHaveLength(1);
      expect(result[0].path).toBe("/test.txt");
      expect(result[0].contents).toBeInstanceOf(Uint8Array);
    });

    it("should call progress callback", async () => {
      const mockData = new Uint8Array([1, 2, 3, 4]);
      const mockResponse = {
        ok: true,
        arrayBuffer: vi.fn().mockResolvedValue(mockData.buffer),
        headers: new Headers({ "content-length": "4" }),
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockResponse,
      );

      const files: DosFile[] = [
        { path: "/test.txt", url: "http://example.com/test.txt" },
      ];

      const onProgress = vi.fn();
      await loadFilesFromUrls(files, onProgress);

      expect(onProgress).toHaveBeenCalled();
      const lastCall = onProgress.mock.calls[
        onProgress.mock.calls.length - 1
      ][0] as LoadProgress;
      expect(lastCall.loaded).toBe(1);
      expect(lastCall.total).toBe(1);
    });

    it("should handle fetch errors", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error("Network error"),
      );

      const files: DosFile[] = [
        { path: "/test.txt", url: "http://example.com/test.txt" },
      ];

      await expect(loadFilesFromUrls(files)).rejects.toThrow();
    });

    it("should handle abort signal", async () => {
      const controller = new AbortController();
      controller.abort();

      const files: DosFile[] = [
        { path: "/test.txt", url: "http://example.com/test.txt" },
      ];

      await expect(
        loadFilesFromUrls(files, undefined, controller.signal),
      ).rejects.toThrow("Operation aborted");
    });

    it("should handle non-ok responses", async () => {
      const mockResponse = {
        ok: false,
        statusText: "Not Found",
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockResponse,
      );

      const files: DosFile[] = [
        { path: "/test.txt", url: "http://example.com/test.txt" },
      ];

      await expect(loadFilesFromUrls(files)).rejects.toThrow("Failed to load");
    });
  });

  describe("loadZipArchive", () => {
    it("should load ZIP archive successfully", async () => {
      const mockData = new Uint8Array([80, 75, 3, 4]); // ZIP header
      const mockResponse = {
        ok: true,
        arrayBuffer: vi.fn().mockResolvedValue(mockData.buffer),
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockResponse,
      );

      const result = await loadZipArchive("http://example.com/archive.zip");

      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBeGreaterThan(0);
    });

    it("should handle ZIP loading errors", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error("Network error"),
      );

      await expect(
        loadZipArchive("http://example.com/archive.zip"),
      ).rejects.toThrow();
    });
  });

  describe("loadDiskImage", () => {
    it("should load disk image successfully", async () => {
      const mockData = new Uint8Array([0, 1, 2, 3]);
      const mockResponse = {
        ok: true,
        arrayBuffer: vi.fn().mockResolvedValue(mockData.buffer),
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockResponse,
      );

      const result = await loadDiskImage("http://example.com/disk.img");

      expect(result).toHaveProperty("path", "/disk.img");
      expect(result).toHaveProperty("contents");
      expect(result.contents).toBeInstanceOf(Uint8Array);
    });
  });
});
