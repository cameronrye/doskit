/**
 * DosKit - useDosFileSystem Hook Tests
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useDosFileSystem } from './useDosFileSystem';
import type { CommandInterface } from '../types/js-dos';

describe('useDosFileSystem', () => {
  let mockCI: CommandInterface;

  beforeEach(() => {
    vi.clearAllMocks();

    // Create mock CommandInterface
    mockCI = {
      fsWriteFile: vi.fn().mockResolvedValue(undefined),
      fsReadFile: vi.fn().mockResolvedValue(new Uint8Array([72, 101, 108, 108, 111])), // "Hello"
      fsDeleteFile: vi.fn().mockResolvedValue(undefined),
      fsTree: vi.fn().mockResolvedValue({
        nodes: {
          C: {
            nodes: {
              PROJECT: {
                nodes: {
                  'test.c': { size: 100 },
                },
              },
            },
          },
        },
      }),
    } as unknown as CommandInterface;
  });

  describe('initialization', () => {
    it('should initialize with null CI', () => {
      const { result } = renderHook(() => useDosFileSystem(null));

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should initialize with valid CI', () => {
      const { result } = renderHook(() => useDosFileSystem(mockCI));

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should update when CI changes', () => {
      const { result, rerender } = renderHook(
        ({ ci }) => useDosFileSystem(ci),
        { initialProps: { ci: null as CommandInterface | null } }
      );

      expect(result.current.isLoading).toBe(false);

      rerender({ ci: mockCI });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('writeTextFile', () => {
    it('should write text file successfully', async () => {
      const { result } = renderHook(() => useDosFileSystem(mockCI));

      await result.current.writeTextFile('/C/test.txt', 'Hello, DOS!');

      expect(mockCI.fsWriteFile).toHaveBeenCalled();
      expect(result.current.error).toBeNull();
    });

    it('should set loading state during write', async () => {
      const { result } = renderHook(() => useDosFileSystem(mockCI));

      const writePromise = result.current.writeTextFile('/C/test.txt', 'Hello');

      // Note: In a real scenario, we'd check isLoading during the operation
      // but since the mock resolves immediately, we just verify it completes
      await writePromise;

      expect(result.current.isLoading).toBe(false);
    });

    it('should handle write errors', async () => {
      (mockCI.fsWriteFile as any).mockRejectedValueOnce(new Error('Write failed'));

      const { result } = renderHook(() => useDosFileSystem(mockCI));

      await expect(
        result.current.writeTextFile('/C/test.txt', 'Hello')
      ).rejects.toThrow();

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });
    });

    it('should throw error when CI not initialized', async () => {
      const { result } = renderHook(() => useDosFileSystem(null));

      await expect(
        result.current.writeTextFile('/C/test.txt', 'Hello')
      ).rejects.toThrow('FileSystemService not initialized');
    });
  });

  describe('readTextFile', () => {
    it('should read text file successfully', async () => {
      const { result } = renderHook(() => useDosFileSystem(mockCI));

      const content = await result.current.readTextFile('/C/test.txt');

      expect(content).toBe('Hello');
      expect(mockCI.fsReadFile).toHaveBeenCalledWith('/C/test.txt');
      expect(result.current.error).toBeNull();
    });

    it('should handle read errors', async () => {
      (mockCI.fsReadFile as any).mockRejectedValueOnce(new Error('Read failed'));

      const { result } = renderHook(() => useDosFileSystem(mockCI));

      await expect(
        result.current.readTextFile('/C/missing.txt')
      ).rejects.toThrow();

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });
    });

    it('should throw error when CI not initialized', async () => {
      const { result } = renderHook(() => useDosFileSystem(null));

      await expect(
        result.current.readTextFile('/C/test.txt')
      ).rejects.toThrow('FileSystemService not initialized');
    });
  });

  describe('deleteFile', () => {
    it('should delete file successfully', async () => {
      const { result } = renderHook(() => useDosFileSystem(mockCI));

      await result.current.deleteFile('/C/test.txt');

      expect(mockCI.fsDeleteFile).toHaveBeenCalledWith('/C/test.txt');
      expect(result.current.error).toBeNull();
    });

    it('should handle delete errors', async () => {
      (mockCI.fsDeleteFile as any).mockRejectedValueOnce(new Error('Delete failed'));

      const { result } = renderHook(() => useDosFileSystem(mockCI));

      await expect(
        result.current.deleteFile('/C/test.txt')
      ).rejects.toThrow();

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });
    });

    it('should throw error when CI not initialized', async () => {
      const { result } = renderHook(() => useDosFileSystem(null));

      await expect(
        result.current.deleteFile('/C/test.txt')
      ).rejects.toThrow('FileSystemService not initialized');
    });
  });

  describe('fileExists', () => {
    it('should return true when file exists', async () => {
      const { result } = renderHook(() => useDosFileSystem(mockCI));

      const exists = await result.current.fileExists('/C/test.txt');

      expect(exists).toBe(true);
      expect(result.current.error).toBeNull();
    });

    it('should return false when file does not exist', async () => {
      (mockCI.fsReadFile as any).mockRejectedValueOnce(new Error('Not found'));

      const { result } = renderHook(() => useDosFileSystem(mockCI));

      const exists = await result.current.fileExists('/C/missing.txt');

      expect(exists).toBe(false);
    });

    it('should throw error when CI not initialized', async () => {
      const { result } = renderHook(() => useDosFileSystem(null));

      await expect(
        result.current.fileExists('/C/test.txt')
      ).rejects.toThrow('FileSystemService not initialized');
    });
  });

  describe('getFileTree', () => {
    it('should return file tree successfully', async () => {
      const { result } = renderHook(() => useDosFileSystem(mockCI));

      const tree = await result.current.getFileTree();

      expect(tree).toBeDefined();
      expect(tree.nodes).toBeDefined();
      expect(tree.nodes.C).toBeDefined();
      expect(result.current.error).toBeNull();
    });

    it('should handle tree retrieval errors', async () => {
      (mockCI.fsTree as any).mockRejectedValueOnce(new Error('Tree failed'));

      const { result } = renderHook(() => useDosFileSystem(mockCI));

      await expect(result.current.getFileTree()).rejects.toThrow();

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });
    });

    it('should throw error when CI not initialized', async () => {
      const { result } = renderHook(() => useDosFileSystem(null));

      await expect(
        result.current.getFileTree()
      ).rejects.toThrow('FileSystemService not initialized');
    });
  });

  describe('error handling', () => {
    it('should clear error', async () => {
      (mockCI.fsReadFile as any).mockRejectedValueOnce(new Error('Read failed'));

      const { result } = renderHook(() => useDosFileSystem(mockCI));

      await expect(
        result.current.readTextFile('/C/missing.txt')
      ).rejects.toThrow();

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });

      result.current.clearError();

      await waitFor(() => {
        expect(result.current.error).toBeNull();
      });
    });

    it('should clear error before new operation', async () => {
      (mockCI.fsReadFile as any).mockRejectedValueOnce(new Error('First error'));

      const { result } = renderHook(() => useDosFileSystem(mockCI));

      // First operation fails
      await expect(
        result.current.readTextFile('/C/missing.txt')
      ).rejects.toThrow();

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });

      // Second operation succeeds
      (mockCI.fsReadFile as any).mockResolvedValueOnce(new Uint8Array([72, 105])); // "Hi"
      await result.current.readTextFile('/C/test.txt');

      await waitFor(() => {
        expect(result.current.error).toBeNull();
      });
    });
  });

  describe('loading state', () => {
    it('should manage loading state correctly', async () => {
      const { result } = renderHook(() => useDosFileSystem(mockCI));

      expect(result.current.isLoading).toBe(false);

      const writePromise = result.current.writeTextFile('/C/test.txt', 'Hello');
      await writePromise;

      expect(result.current.isLoading).toBe(false);
    });
  });
});

