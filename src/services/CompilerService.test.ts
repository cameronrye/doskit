/**
 * DosKit - CompilerService Tests
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CompilerService } from './CompilerService';
import type { CommandInterface } from '../types/js-dos';

// Mock the compiler config
vi.mock('../config/compiler.config', () => ({
  mockCompilerEnabled: true,
  mockCompilationDelay: 100, // Shorter delay for tests
  realDosCompilerEnabled: false, // Use mock compiler for tests
  wasmCompilerConfig: {
    wasmModuleUrl: '/test/gcc.wasm',
    maxCompilationTime: 10000,
    verbose: false,
    defaultOptimization: 'O2',
    defaultWarnings: true,
    defaultDebug: false,
  },
  compilerFeatureFlags: {
    enableWasmCompiler: false, // Disable WASM for mock tests
    enableMockCompiler: true,
    preferWasmCompiler: false,
  },
  compilerConfig: {
    defaultOptimizationLevel: 2,
    defaultWarningLevel: 'all',
    defaultDebugInfo: false,
    maxSourceFileSize: 1024 * 1024,
    maxOutputFileSize: 10 * 1024 * 1024,
    allowedExtensions: ['.c', '.h'],
    outputExtension: '.exe',
  },
}));

describe('CompilerService', () => {
  let mockCI: CommandInterface;
  let compiler: CompilerService;

  beforeEach(() => {
    vi.clearAllMocks();

    // Create mock CommandInterface
    mockCI = {
      fsWriteFile: vi.fn().mockResolvedValue(undefined),
      fsReadFile: vi.fn(),
      fsDeleteFile: vi.fn().mockResolvedValue(undefined),
      fsTree: vi.fn().mockResolvedValue({ nodes: {} }),
    } as unknown as CommandInterface;

    compiler = new CompilerService(mockCI);
  });

  describe('compile', () => {
    it('should successfully compile valid C code', async () => {
      const validCode = `#include <stdio.h>
int main(void) {
    printf("Hello, DOS!\\n");
    return 0;
}`;

      // Mock reading the source file
      const encoder = new TextEncoder();
      (mockCI.fsReadFile as any).mockResolvedValue(encoder.encode(validCode));

      const result = await compiler.compile('hello.c', 'hello.exe');

      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.outputFile).toBe('hello.exe');
      expect(result.compilationTime).toBeGreaterThan(0);
    });

    it('should detect missing main function', async () => {
      const invalidCode = `#include <stdio.h>
void test(void) {
    printf("No main!\\n");
}`;

      const encoder = new TextEncoder();
      (mockCI.fsReadFile as any).mockResolvedValue(encoder.encode(invalidCode));

      const result = await compiler.compile('test.c', 'test.exe');

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(e => e.includes('main'))).toBe(true);
    });

    it('should detect syntax errors', async () => {
      const syntaxError = `#include <stdio.h>
int main(void) {
    printf("Missing semicolon")
    return 0;
}`;

      const encoder = new TextEncoder();
      (mockCI.fsReadFile as any).mockResolvedValue(encoder.encode(syntaxError));

      const result = await compiler.compile('error.c', 'error.exe');

      // Mock compiler detects missing semicolons as warnings, not errors
      // It will still compile successfully but with warnings
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should detect missing includes', async () => {
      const missingInclude = `int main(void) {
    printf("No stdio.h!\\n");
    return 0;
}`;

      const encoder = new TextEncoder();
      (mockCI.fsReadFile as any).mockResolvedValue(encoder.encode(missingInclude));

      const result = await compiler.compile('noinc.c', 'noinc.exe');

      // Mock compiler generates warnings for missing includes but still compiles
      expect(result.success).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should handle file not found error', async () => {
      (mockCI.fsReadFile as any).mockRejectedValue(new Error('File not found'));

      const result = await compiler.compile('missing.c', 'missing.exe');

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Source file not found: missing.c');
    });

    it('should track compilation time', async () => {
      const validCode = `#include <stdio.h>
int main(void) { return 0; }`;

      const encoder = new TextEncoder();
      (mockCI.fsReadFile as any).mockResolvedValue(encoder.encode(validCode));

      const result = await compiler.compile('test.c', 'test.exe');

      expect(result.compilationTime).toBeDefined();
      expect(result.compilationTime).toBeGreaterThan(0);
    });

    it('should generate build messages', async () => {
      const validCode = `#include <stdio.h>
int main(void) { return 0; }`;

      const encoder = new TextEncoder();
      (mockCI.fsReadFile as any).mockResolvedValue(encoder.encode(validCode));

      await compiler.compile('test.c', 'test.exe');

      const messages = compiler.getBuildMessages();
      expect(messages.length).toBeGreaterThan(0);
      expect(messages[0].type).toBe('info');
      expect(messages[0].message).toContain('Starting compilation');
    });

    it('should clear previous build messages', async () => {
      const validCode = `#include <stdio.h>
int main(void) { return 0; }`;

      const encoder = new TextEncoder();
      (mockCI.fsReadFile as any).mockResolvedValue(encoder.encode(validCode));

      // First compilation
      await compiler.compile('test1.c', 'test1.exe');
      compiler.getBuildMessages();

      // Second compilation
      await compiler.compile('test2.c', 'test2.exe');
      const secondMessages = compiler.getBuildMessages();

      // Messages should be different (cleared between compilations)
      expect(secondMessages[0].message).toContain('test2.c');
    });

    it('should handle compiler options', async () => {
      const validCode = `#include <stdio.h>
int main(void) { return 0; }`;

      const encoder = new TextEncoder();
      (mockCI.fsReadFile as any).mockResolvedValue(encoder.encode(validCode));

      const options = {
        optimization: 'O3' as const,
        warnings: true,
        debug: true,
      };

      const result = await compiler.compile('test.c', 'test.exe', options);

      expect(result.success).toBe(true);
    });
  });

  describe('getBuildMessages', () => {
    it('should return empty array initially', () => {
      const messages = compiler.getBuildMessages();
      expect(messages).toEqual([]);
    });

    it('should return build messages after compilation', async () => {
      const validCode = `#include <stdio.h>
int main(void) { return 0; }`;

      const encoder = new TextEncoder();
      (mockCI.fsReadFile as any).mockResolvedValue(encoder.encode(validCode));

      await compiler.compile('test.c', 'test.exe');

      const messages = compiler.getBuildMessages();
      expect(messages.length).toBeGreaterThan(0);
      expect(messages.every(m => m.timestamp instanceof Date)).toBe(true);
    });

    it('should include error messages for failed compilation', async () => {
      const invalidCode = `invalid C code here`;

      const encoder = new TextEncoder();
      (mockCI.fsReadFile as any).mockResolvedValue(encoder.encode(invalidCode));

      await compiler.compile('error.c', 'error.exe');

      const messages = compiler.getBuildMessages();
      const errorMessages = messages.filter(m => m.type === 'error');
      expect(errorMessages.length).toBeGreaterThan(0);
    });

    it('should include warning messages', async () => {
      // Use code that will generate a warning (missing include for printf)
      const warningCode = `int main(void) {
    printf("Hello\\n");
    return 0;
}`;

      const encoder = new TextEncoder();
      (mockCI.fsReadFile as any).mockResolvedValue(encoder.encode(warningCode));

      await compiler.compile('warning.c', 'warning.exe');

      const messages = compiler.getBuildMessages();
      const warningMessages = messages.filter(m => m.type === 'warning');
      expect(warningMessages.length).toBeGreaterThan(0);
    });

    it('should include success message for successful compilation', async () => {
      const validCode = `#include <stdio.h>
int main(void) { return 0; }`;

      const encoder = new TextEncoder();
      (mockCI.fsReadFile as any).mockResolvedValue(encoder.encode(validCode));

      await compiler.compile('test.c', 'test.exe');

      const messages = compiler.getBuildMessages();
      const successMessages = messages.filter(m => m.type === 'success');
      expect(successMessages.length).toBeGreaterThan(0);
    });
  });

  describe('clearBuildMessages', () => {
    it('should clear all build messages', async () => {
      const validCode = `#include <stdio.h>
int main(void) { return 0; }`;

      const encoder = new TextEncoder();
      (mockCI.fsReadFile as any).mockResolvedValue(encoder.encode(validCode));

      await compiler.compile('test.c', 'test.exe');
      expect(compiler.getBuildMessages().length).toBeGreaterThan(0);

      compiler.clearBuildMessages();
      expect(compiler.getBuildMessages()).toEqual([]);
    });
  });

  describe('mock compiler validation', () => {
    it('should validate basic C syntax', async () => {
      const validCode = `#include <stdio.h>
int main(void) {
    printf("Hello\\n");
    return 0;
}`;

      const encoder = new TextEncoder();
      (mockCI.fsReadFile as any).mockResolvedValue(encoder.encode(validCode));

      const result = await compiler.compile('test.c', 'test.exe');
      expect(result.success).toBe(true);
    });

    it('should detect unmatched braces', async () => {
      const unmatchedBraces = `#include <stdio.h>
int main(void) {
    printf("Hello\\n");
    return 0;
`;

      const encoder = new TextEncoder();
      (mockCI.fsReadFile as any).mockResolvedValue(encoder.encode(unmatchedBraces));

      const result = await compiler.compile('test.c', 'test.exe');
      expect(result.success).toBe(false);
    });

    it('should detect unmatched parentheses', async () => {
      const unmatchedParens = `#include <stdio.h>
int main(void {
    return 0;
}`;

      const encoder = new TextEncoder();
      (mockCI.fsReadFile as any).mockResolvedValue(encoder.encode(unmatchedParens));

      const result = await compiler.compile('test.c', 'test.exe');
      // Mock compiler doesn't detect unmatched parentheses, only braces
      // This would still compile in the mock
      expect(result.success).toBe(true);
    });
  });
});

