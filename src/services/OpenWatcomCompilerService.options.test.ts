/**
 * DosKit - OpenWatcomCompilerService Compiler Options Tests
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * Comprehensive tests for Open Watcom compiler options
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OpenWatcomCompilerService } from './OpenWatcomCompilerService';
import type { CommandInterface } from '../types/js-dos';
import { createMockCommandInterface } from './__test-helpers__/mockCommandInterface';

describe('OpenWatcomCompilerService - Compiler Options', () => {
  let mockCI: CommandInterface;
  let service: OpenWatcomCompilerService;
  const validCode = 'int main(void) { return 0; }';

  beforeEach(() => {
    vi.clearAllMocks();

    mockCI = createMockCommandInterface();
    service = new OpenWatcomCompilerService(mockCI);
  });

  describe('Memory Models', () => {
    it('should compile with tiny memory model', async () => {
      const result = await service.compile(validCode, 'test.c', 'test.exe', {
        memoryModel: 'tiny',
      });

      expect(result.success).toBe(true);
      expect(result.outputFile).toBe('test.exe');
    });

    it('should compile with small memory model', async () => {
      const result = await service.compile(validCode, 'test.c', 'test.exe', {
        memoryModel: 'small',
      });

      expect(result.success).toBe(true);
    });

    it('should compile with compact memory model', async () => {
      const result = await service.compile(validCode, 'test.c', 'test.exe', {
        memoryModel: 'compact',
      });

      expect(result.success).toBe(true);
    });

    it('should compile with medium memory model', async () => {
      const result = await service.compile(validCode, 'test.c', 'test.exe', {
        memoryModel: 'medium',
      });

      expect(result.success).toBe(true);
    });

    it('should compile with large memory model', async () => {
      const result = await service.compile(validCode, 'test.c', 'test.exe', {
        memoryModel: 'large',
      });

      expect(result.success).toBe(true);
    });

    it('should compile with huge memory model', async () => {
      const result = await service.compile(validCode, 'test.c', 'test.exe', {
        memoryModel: 'huge',
      });

      expect(result.success).toBe(true);
    });

    it('should use default memory model when not specified', async () => {
      const result = await service.compile(validCode, 'test.c', 'test.exe');

      expect(result.success).toBe(true);
      // Default should be 'small' based on config
    });
  });

  describe('Optimization Levels', () => {
    it('should compile with O0 (no optimization)', async () => {
      const result = await service.compile(validCode, 'test.c', 'test.exe', {
        optimization: 'O0',
      });

      expect(result.success).toBe(true);
    });

    it('should compile with O1 (basic optimization)', async () => {
      const result = await service.compile(validCode, 'test.c', 'test.exe', {
        optimization: 'O1',
      });

      expect(result.success).toBe(true);
    });

    it('should compile with O2 (moderate optimization)', async () => {
      const result = await service.compile(validCode, 'test.c', 'test.exe', {
        optimization: 'O2',
      });

      expect(result.success).toBe(true);
    });

    it('should compile with O3 (aggressive optimization)', async () => {
      const result = await service.compile(validCode, 'test.c', 'test.exe', {
        optimization: 'O3',
      });

      expect(result.success).toBe(true);
    });

    it('should compile with Os (size optimization)', async () => {
      const result = await service.compile(validCode, 'test.c', 'test.exe', {
        optimization: 'Os',
      });

      expect(result.success).toBe(true);
    });
  });

  describe('Warning Levels', () => {
    it('should compile with warning level 0 (no warnings)', async () => {
      const result = await service.compile(validCode, 'test.c', 'test.exe', {
        warningLevel: 0,
      });

      expect(result.success).toBe(true);
    });

    it('should compile with warning level 1', async () => {
      const result = await service.compile(validCode, 'test.c', 'test.exe', {
        warningLevel: 1,
      });

      expect(result.success).toBe(true);
    });

    it('should compile with warning level 2', async () => {
      const result = await service.compile(validCode, 'test.c', 'test.exe', {
        warningLevel: 2,
      });

      expect(result.success).toBe(true);
    });

    it('should compile with warning level 3', async () => {
      const result = await service.compile(validCode, 'test.c', 'test.exe', {
        warningLevel: 3,
      });

      expect(result.success).toBe(true);
    });

    it('should compile with warning level 4 (all warnings)', async () => {
      const result = await service.compile(validCode, 'test.c', 'test.exe', {
        warningLevel: 4,
      });

      expect(result.success).toBe(true);
    });
  });

  describe('Debug Information', () => {
    it('should compile with debug info enabled', async () => {
      const result = await service.compile(validCode, 'test.c', 'test.exe', {
        debug: true,
      });

      expect(result.success).toBe(true);
    });

    it('should compile with debug info disabled', async () => {
      const result = await service.compile(validCode, 'test.c', 'test.exe', {
        debug: false,
      });

      expect(result.success).toBe(true);
    });
  });

  describe('Combined Options', () => {
    it('should compile with multiple options combined', async () => {
      const result = await service.compile(validCode, 'test.c', 'test.exe', {
        memoryModel: 'large',
        optimization: 'O2',
        warningLevel: 4,
        debug: true,
      });

      expect(result.success).toBe(true);
    });

    it('should compile with size optimization and tiny memory model', async () => {
      const result = await service.compile(validCode, 'test.c', 'test.exe', {
        memoryModel: 'tiny',
        optimization: 'Os',
      });

      expect(result.success).toBe(true);
    });

    it('should compile with aggressive optimization and no debug', async () => {
      const result = await service.compile(validCode, 'test.c', 'test.exe', {
        optimization: 'O3',
        debug: false,
      });

      expect(result.success).toBe(true);
    });

    it('should compile with all warnings and debug info', async () => {
      const result = await service.compile(validCode, 'test.c', 'test.exe', {
        warningLevel: 4,
        debug: true,
      });

      expect(result.success).toBe(true);
    });
  });

  describe('Option Validation', () => {
    it('should handle empty options object', async () => {
      const result = await service.compile(validCode, 'test.c', 'test.exe', {});

      expect(result.success).toBe(true);
    });

    it('should handle undefined options', async () => {
      const result = await service.compile(validCode, 'test.c', 'test.exe');

      expect(result.success).toBe(true);
    });

    it('should handle partial options', async () => {
      const result = await service.compile(validCode, 'test.c', 'test.exe', {
        optimization: 'O2',
        // Other options use defaults
      });

      expect(result.success).toBe(true);
    });
  });

  describe('Options with Complex Code', () => {
    it('should optimize complex arithmetic code', async () => {
      const complexCode = `
int fibonacci(int n) {
    if (n <= 1) return n;
    return fibonacci(n - 1) + fibonacci(n - 2);
}

int main(void) {
    return fibonacci(10);
}`;

      const result = await service.compile(complexCode, 'test.c', 'test.exe', {
        optimization: 'O3',
      });

      expect(result.success).toBe(true);
    });

    it('should compile with warnings for unused variables', async () => {
      const codeWithWarnings = `
int main(void) {
    int unused = 42;
    return 0;
}`;

      const result = await service.compile(codeWithWarnings, 'test.c', 'test.exe', {
        warningLevel: 4,
      });

      // With real DOS execution, warnings are captured in the compiler output
      expect(result.success).toBe(true);
    });

    it('should compile large memory model code with far pointers', async () => {
      const largeModelCode = `
int main(void) {
    char far *ptr;
    return 0;
}`;

      const result = await service.compile(largeModelCode, 'test.c', 'test.exe', {
        memoryModel: 'large',
      });

      expect(result.success).toBe(true);
    });
  });
});

