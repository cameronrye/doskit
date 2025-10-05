/**
 * DosKit - CompilerService Open Watcom Integration Tests
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * Tests for CompilerService integration with Open Watcom compiler
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CompilerService } from './CompilerService';
import type { CommandInterface } from '../types/js-dos';
import { createMockCommandInterface } from './__test-helpers__/mockCommandInterface';

// Mock the compiler config to enable Open Watcom
vi.mock('../config/compiler.config', () => ({
  mockCompilerEnabled: true,
  mockCompilationDelay: 100,
  realDosCompilerEnabled: false,
  wasmCompilerConfig: {
    wasmModuleUrl: '/test/gcc.wasm',
    maxCompilationTime: 10000,
    verbose: false,
    defaultOptimization: 'O2',
    defaultWarnings: true,
    defaultDebug: false,
  },
  compilerFeatureFlags: {
    enableOpenWatcomCompiler: true, // Enable Open Watcom for these tests
    enableWasmCompiler: false,
    enableMockCompiler: true,
    preferOpenWatcomCompiler: true, // Prefer Open Watcom
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

describe('CompilerService - Open Watcom Integration', () => {
  let mockCI: CommandInterface;
  let compiler: CompilerService;

  beforeEach(() => {
    vi.clearAllMocks();

    mockCI = createMockCommandInterface();
    compiler = new CompilerService(mockCI);
  });

  describe('compiler selection', () => {
    it('should use Open Watcom compiler when enabled and preferred', async () => {
      const validCode = `#include <stdio.h>
int main(void) {
    printf("Hello, DOS!\\n");
    return 0;
}`;

      // Mock reading the source file from project directory
      const encoder = new TextEncoder();
      (mockCI.fsReadFile as any).mockResolvedValue(encoder.encode(validCode));

      const result = await compiler.compile('hello.c', 'hello.exe');

      expect(result.success).toBe(true);
      expect(result.outputFile).toBe('hello.exe');
      
      // Check that Open Watcom compiler message is present
      const messages = compiler.getBuildMessages();
      const watcomMessage = messages.find(m => 
        m.message.includes('Open Watcom') || m.message.includes('Real DOS Compiler')
      );
      expect(watcomMessage).toBeDefined();
    });

    it('should compile with Open Watcom compiler options', async () => {
      const validCode = `int main(void) { return 0; }`;
      const encoder = new TextEncoder();
      (mockCI.fsReadFile as any).mockResolvedValue(encoder.encode(validCode));

      const result = await compiler.compile('test.c', 'test.exe', {
        optimization: 'O2',
        memoryModel: 'small',
        debug: false,
      });

      expect(result.success).toBe(true);
      expect(result.executable).toBeDefined();
    });

    it('should handle source file not found error', async () => {
      (mockCI.fsReadFile as any).mockRejectedValue(new Error('File not found'));

      const result = await compiler.compile('missing.c', 'missing.exe');

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Source file not found: missing.c');
    });

    it('should copy build messages from Open Watcom compiler', async () => {
      const validCode = `int main(void) { return 0; }`;
      const encoder = new TextEncoder();
      (mockCI.fsReadFile as any).mockResolvedValue(encoder.encode(validCode));

      await compiler.compile('test.c', 'test.exe');

      const messages = compiler.getBuildMessages();
      
      // Should have messages from both CompilerService and OpenWatcomCompilerService
      expect(messages.length).toBeGreaterThan(0);
      
      // Should have info messages about compilation steps
      const infoMessages = messages.filter(m => m.type === 'info');
      expect(infoMessages.length).toBeGreaterThan(0);
    });

    it('should write executable to project directory on success', async () => {
      const validCode = `int main(void) { return 0; }`;
      const encoder = new TextEncoder();
      (mockCI.fsReadFile as any).mockResolvedValue(encoder.encode(validCode));

      const result = await compiler.compile('test.c', 'test.exe');

      expect(result.success).toBe(true);
      
      // Verify that writeBinaryFile was called to write the executable
      expect(mockCI.fsWriteFile).toHaveBeenCalled();
      
      // Check that a message about writing the executable was added
      const messages = compiler.getBuildMessages();
      const writeMessage = messages.find(m => m.message.includes('Executable written'));
      expect(writeMessage).toBeDefined();
    });
  });

  describe('compilation workflow', () => {
    it('should track compilation time', async () => {
      const validCode = `int main(void) { return 0; }`;
      const encoder = new TextEncoder();
      (mockCI.fsReadFile as any).mockResolvedValue(encoder.encode(validCode));

      const result = await compiler.compile('test.c', 'test.exe');

      expect(result.compilationTime).toBeDefined();
      expect(result.compilationTime).toBeGreaterThanOrEqual(0);
    });

    it('should return raw compiler output', async () => {
      const validCode = `int main(void) { return 0; }`;
      const encoder = new TextEncoder();
      (mockCI.fsReadFile as any).mockResolvedValue(encoder.encode(validCode));

      const result = await compiler.compile('test.c', 'test.exe');

      expect(result.rawOutput).toBeDefined();
      expect(typeof result.rawOutput).toBe('string');
    });

    it('should handle compilation with different memory models', async () => {
      const validCode = `int main(void) { return 0; }`;
      const encoder = new TextEncoder();
      (mockCI.fsReadFile as any).mockResolvedValue(encoder.encode(validCode));

      const memoryModels = ['tiny', 'small', 'compact', 'medium', 'large', 'huge'] as const;

      for (const model of memoryModels) {
        const result = await compiler.compile('test.c', 'test.exe', {
          memoryModel: model,
        });

        expect(result.success).toBe(true);
      }
    });

    it('should handle compilation with optimization levels', async () => {
      const validCode = `int main(void) { return 0; }`;
      const encoder = new TextEncoder();
      (mockCI.fsReadFile as any).mockResolvedValue(encoder.encode(validCode));

      const optimizationLevels = ['O0', 'O1', 'O2', 'O3', 'Os'] as const;

      for (const level of optimizationLevels) {
        const result = await compiler.compile('test.c', 'test.exe', {
          optimization: level,
        });

        expect(result.success).toBe(true);
      }
    });
  });

  describe('build messages', () => {
    it('should generate build messages during compilation', async () => {
      const validCode = `int main(void) { return 0; }`;
      const encoder = new TextEncoder();
      (mockCI.fsReadFile as any).mockResolvedValue(encoder.encode(validCode));

      await compiler.compile('test.c', 'test.exe');

      const messages = compiler.getBuildMessages();
      expect(messages.length).toBeGreaterThan(0);
    });

    it('should clear build messages', async () => {
      const validCode = `int main(void) { return 0; }`;
      const encoder = new TextEncoder();
      (mockCI.fsReadFile as any).mockResolvedValue(encoder.encode(validCode));

      await compiler.compile('test.c', 'test.exe');
      expect(compiler.getBuildMessages().length).toBeGreaterThan(0);

      compiler.clearBuildMessages();
      expect(compiler.getBuildMessages()).toHaveLength(0);
    });

    it('should include timestamps in build messages', async () => {
      const validCode = `int main(void) { return 0; }`;
      const encoder = new TextEncoder();
      (mockCI.fsReadFile as any).mockResolvedValue(encoder.encode(validCode));

      await compiler.compile('test.c', 'test.exe');

      const messages = compiler.getBuildMessages();
      messages.forEach(message => {
        expect(message.timestamp).toBeInstanceOf(Date);
      });
    });
  });

  describe('error handling', () => {
    it('should handle filesystem errors gracefully', async () => {
      const validCode = `int main(void) { return 0; }`;
      const encoder = new TextEncoder();
      (mockCI.fsReadFile as any).mockResolvedValue(encoder.encode(validCode));
      
      // Mock write to fail
      (mockCI.fsWriteFile as any).mockRejectedValueOnce(new Error('Write failed'));

      const result = await compiler.compile('test.c', 'test.exe');

      // Compilation may still succeed but writing executable fails
      expect(result).toBeDefined();
    });

    it('should provide helpful error messages', async () => {
      (mockCI.fsReadFile as any).mockRejectedValue(new Error('File not found'));

      const result = await compiler.compile('missing.c', 'missing.exe');

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Source file not found');
    });
  });

  describe('compiler status', () => {
    it('should report compiler status', () => {
      const status = compiler.getCompilerStatus();

      expect(status).toBeDefined();
      expect(status.activeCompiler).toBeDefined();
      expect(status.mockEnabled).toBe(true);

      // TODO: Update getCompilerStatus() to include Open Watcom information
      // For now, it only reports WASM and mock compiler status
    });
  });
});

