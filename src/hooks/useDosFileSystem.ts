/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * useDosFileSystem Hook
 * React hook for DOS filesystem operations
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import type { CommandInterface, FsNode } from '../types/js-dos';
import { FileSystemService } from '../services/FileSystemService';

export interface UseDosFileSystemResult {
  /** Write a text file */
  writeTextFile: (path: string, content: string) => Promise<void>;
  /** Read a text file */
  readTextFile: (path: string) => Promise<string>;
  /** Delete a file */
  deleteFile: (path: string) => Promise<void>;
  /** Check if file exists */
  fileExists: (path: string) => Promise<boolean>;
  /** Get file tree */
  getFileTree: () => Promise<FsNode>;
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: string | null;
  /** Clear error */
  clearError: () => void;
}

/**
 * Hook for DOS filesystem operations
 */
export function useDosFileSystem(ci: CommandInterface | null): UseDosFileSystemResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fsServiceRef = useRef<FileSystemService | null>(null);

  // Initialize FileSystemService when CommandInterface is available
  useEffect(() => {
    if (ci) {
      fsServiceRef.current = new FileSystemService(ci);
    } else {
      fsServiceRef.current = null;
    }
  }, [ci]);

  const writeTextFile = useCallback(async (path: string, content: string) => {
    if (!fsServiceRef.current) {
      throw new Error('FileSystemService not initialized');
    }

    setIsLoading(true);
    setError(null);

    try {
      await fsServiceRef.current.writeTextFile(path, content);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to write file';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const readTextFile = useCallback(async (path: string): Promise<string> => {
    if (!fsServiceRef.current) {
      throw new Error('FileSystemService not initialized');
    }

    setIsLoading(true);
    setError(null);

    try {
      const content = await fsServiceRef.current.readTextFile(path);
      return content;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to read file';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteFile = useCallback(async (path: string) => {
    if (!fsServiceRef.current) {
      throw new Error('FileSystemService not initialized');
    }

    setIsLoading(true);
    setError(null);

    try {
      await fsServiceRef.current.deleteFile(path);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete file';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fileExists = useCallback(async (path: string): Promise<boolean> => {
    if (!fsServiceRef.current) {
      throw new Error('FileSystemService not initialized');
    }

    setIsLoading(true);
    setError(null);

    try {
      const exists = await fsServiceRef.current.fileExists(path);
      return exists;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to check file';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getFileTree = useCallback(async (): Promise<FsNode> => {
    if (!fsServiceRef.current) {
      throw new Error('FileSystemService not initialized');
    }

    setIsLoading(true);
    setError(null);

    try {
      const tree = await fsServiceRef.current.getFileTree();
      return tree;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get file tree';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    writeTextFile,
    readTextFile,
    deleteFile,
    fileExists,
    getFileTree,
    isLoading,
    error,
    clearError,
  };
}

