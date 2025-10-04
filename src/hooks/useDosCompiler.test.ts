/**
 * DosKit - useDosCompiler Hook Tests
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useDosCompiler } from './useDosCompiler';
import type { CommandInterface } from '../types/js-dos';
import type { CompileResult } from '../types/compiler';

// Mock the CompilerService
vi.mock('../services/CompilerService', () => {
  return {
    CompilerService: vi.fn().mockImplementation(() => ({
      compile: vi.fn(),
      getBuildMessages: vi.fn().mockReturnValue([]),
      clearBuildMessages: vi.fn(),
    })),
  };
});

// Mock the compiler config
vi.mock('../config/compiler.config', () => ({
  mockCompilerEnabled: true,
  mockCompilationDelay: 100,
}));

describe('useDosCompiler', () => {
  let mockCI: CommandInterface;

  beforeEach(() => {
    vi.clearAllMocks();

    // Create mock CommandInterface
    mockCI = {
      fsWriteFile: vi.fn().mockResolvedValue(undefined),
      fsReadFile: vi.fn().mockResolvedValue(new Uint8Array([72, 101, 108, 108, 111])),
      fsDeleteFile: vi.fn().mockResolvedValue(undefined),
      fsTree: vi.fn().mockResolvedValue({ nodes: {} }),
    } as unknown as CommandInterface;
  });

  describe('initialization', () => {
    it('should initialize with null CI', () => {
      const { result } = renderHook(() => useDosCompiler(null));

      expect(result.current.buildStatus).toBe('idle');
      expect(result.current.buildMessages).toEqual([]);
      expect(result.current.lastResult).toBeNull();
      expect(result.current.error).toBeNull();
    });

    it('should initialize with valid CI', () => {
      const { result } = renderHook(() => useDosCompiler(mockCI));

      expect(result.current.buildStatus).toBe('idle');
      expect(result.current.buildMessages).toEqual([]);
      expect(result.current.lastResult).toBeNull();
      expect(result.current.error).toBeNull();
    });

    it('should update when CI changes', () => {
      const { result, rerender } = renderHook(
        ({ ci }) => useDosCompiler(ci),
        { initialProps: { ci: null as CommandInterface | null } }
      );

      expect(result.current.buildStatus).toBe('idle');

      rerender({ ci: mockCI });

      expect(result.current.buildStatus).toBe('idle');
    });
  });

  describe('compile', () => {
    it('should compile successfully', async () => {
      renderHook(() => useDosCompiler(mockCI));

      const mockResult: CompileResult = {
        success: true,
        errors: [],
        warnings: [],
        outputFile: 'test.exe',
        rawOutput: 'Compilation successful',
        compilationTime: 100,
      };

      // Mock the compile method
      const CompilerService = (await import('../services/CompilerService')).CompilerService;
      const mockCompile = vi.fn().mockResolvedValue(mockResult);
      const mockGetBuildMessages = vi.fn().mockReturnValue([
        {
          type: 'success',
          message: 'Compilation successful',
          timestamp: new Date(),
        },
      ]);

      (CompilerService as any).mockImplementation(() => ({
        compile: mockCompile,
        getBuildMessages: mockGetBuildMessages,
        clearBuildMessages: vi.fn(),
      }));

      // Re-render to get new instance
      const { result: newResult } = renderHook(() => useDosCompiler(mockCI));

      const compileResult = await newResult.current.compile('test.c', 'test.exe');

      expect(compileResult.success).toBe(true);
      await waitFor(() => {
        expect(newResult.current.buildStatus).toBe('success');
      });
    });

    it('should handle compilation errors', async () => {
      renderHook(() => useDosCompiler(mockCI));

      const mockResult: CompileResult = {
        success: false,
        errors: ['Syntax error on line 5'],
        warnings: [],
        outputFile: 'test.exe',
        rawOutput: 'Compilation failed',
        compilationTime: 50,
      };

      const CompilerService = (await import('../services/CompilerService')).CompilerService;
      const mockCompile = vi.fn().mockResolvedValue(mockResult);
      const mockGetBuildMessages = vi.fn().mockReturnValue([
        {
          type: 'error',
          message: 'Syntax error on line 5',
          timestamp: new Date(),
        },
      ]);

      (CompilerService as any).mockImplementation(() => ({
        compile: mockCompile,
        getBuildMessages: mockGetBuildMessages,
        clearBuildMessages: vi.fn(),
      }));

      const { result: newResult } = renderHook(() => useDosCompiler(mockCI));

      const compileResult = await newResult.current.compile('test.c', 'test.exe');

      expect(compileResult.success).toBe(false);
      await waitFor(() => {
        expect(newResult.current.buildStatus).toBe('error');
      });
    });

    it('should set building status during compilation', async () => {
      renderHook(() => useDosCompiler(mockCI));

      const mockResult: CompileResult = {
        success: true,
        errors: [],
        warnings: [],
        outputFile: 'test.exe',
        rawOutput: 'Success',
      };

      const CompilerService = (await import('../services/CompilerService')).CompilerService;
      let resolveCompile: (value: CompileResult) => void;
      const compilePromise = new Promise<CompileResult>((resolve) => {
        resolveCompile = resolve;
      });

      const mockCompile = vi.fn().mockReturnValue(compilePromise);
      const mockGetBuildMessages = vi.fn().mockReturnValue([]);

      (CompilerService as any).mockImplementation(() => ({
        compile: mockCompile,
        getBuildMessages: mockGetBuildMessages,
        clearBuildMessages: vi.fn(),
      }));

      const { result: newResult } = renderHook(() => useDosCompiler(mockCI));

      const compileCall = newResult.current.compile('test.c', 'test.exe');

      // Should be building
      await waitFor(() => {
        expect(newResult.current.buildStatus).toBe('building');
      });

      // Resolve the compilation
      resolveCompile!(mockResult);
      await compileCall;

      // Should be success
      await waitFor(() => {
        expect(newResult.current.buildStatus).toBe('success');
      });
    });

    it('should throw error when CI not initialized', async () => {
      const { result } = renderHook(() => useDosCompiler(null));

      await expect(
        result.current.compile('test.c', 'test.exe')
      ).rejects.toThrow('CompilerService not initialized');
    });

    it('should update build messages after compilation', async () => {
      const mockMessages = [
        {
          type: 'info' as const,
          message: 'Starting compilation',
          timestamp: new Date(),
        },
        {
          type: 'success' as const,
          message: 'Compilation successful',
          timestamp: new Date(),
        },
      ];

      const mockResult: CompileResult = {
        success: true,
        errors: [],
        warnings: [],
        outputFile: 'test.exe',
        rawOutput: 'Success',
      };

      const CompilerService = (await import('../services/CompilerService')).CompilerService;
      const mockCompile = vi.fn().mockResolvedValue(mockResult);
      const mockGetBuildMessages = vi.fn().mockReturnValue(mockMessages);

      (CompilerService as any).mockImplementation(() => ({
        compile: mockCompile,
        getBuildMessages: mockGetBuildMessages,
        clearBuildMessages: vi.fn(),
      }));

      const { result } = renderHook(() => useDosCompiler(mockCI));

      await result.current.compile('test.c', 'test.exe');

      await waitFor(() => {
        expect(result.current.buildMessages.length).toBeGreaterThan(0);
      });
    });

    it('should store last compile result', async () => {
      const mockResult: CompileResult = {
        success: true,
        errors: [],
        warnings: [],
        outputFile: 'test.exe',
        rawOutput: 'Success',
        compilationTime: 123,
      };

      const CompilerService = (await import('../services/CompilerService')).CompilerService;
      const mockCompile = vi.fn().mockResolvedValue(mockResult);
      const mockGetBuildMessages = vi.fn().mockReturnValue([]);

      (CompilerService as any).mockImplementation(() => ({
        compile: mockCompile,
        getBuildMessages: mockGetBuildMessages,
        clearBuildMessages: vi.fn(),
      }));

      const { result } = renderHook(() => useDosCompiler(mockCI));

      await result.current.compile('test.c', 'test.exe');

      await waitFor(() => {
        expect(result.current.lastResult).toBeDefined();
        expect(result.current.lastResult?.success).toBe(true);
        expect(result.current.lastResult?.outputFile).toBe('test.exe');
      });
    });
  });

  describe('clearBuildMessages', () => {
    it('should clear build messages', () => {
      const { result } = renderHook(() => useDosCompiler(mockCI));

      // clearBuildMessages just clears the local state
      result.current.clearBuildMessages();

      expect(result.current.buildMessages).toEqual([]);
    });
  });

  describe('clearError', () => {
    it('should clear error', () => {
      const { result } = renderHook(() => useDosCompiler(mockCI));

      // clearError just clears the local error state
      result.current.clearError();

      expect(result.current.error).toBeNull();
    });
  });
});

