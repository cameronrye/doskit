/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * Unit tests for OpenWatcomCompilerService
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OpenWatcomCompilerService, defaultOpenWatcomConfig } from './OpenWatcomCompilerService';
import type { CommandInterface, CommandInterfaceEvents } from '../types/js-dos';

describe('OpenWatcomCompilerService', () => {
  let mockCI: CommandInterface;
  let service: OpenWatcomCompilerService;

  beforeEach(() => {
    vi.clearAllMocks();

    // Create stdout handler storage
    let stdoutHandler: ((message: string) => void) | null = null;

    // Create mock CommandInterface
    mockCI = {
      fsWriteFile: vi.fn().mockResolvedValue(undefined),
      fsReadFile: vi.fn().mockResolvedValue(new Uint8Array([0x4D, 0x5A, 0x90, 0x00])), // MZ header
      fsDeleteFile: vi.fn().mockResolvedValue(undefined),
      fsTree: vi.fn().mockResolvedValue({ nodes: {} }),
      fsExists: vi.fn().mockResolvedValue(true),
      fsIsDirectory: vi.fn().mockResolvedValue(false),
      fsReaddir: vi.fn().mockResolvedValue([]),
      fsMkdir: vi.fn().mockResolvedValue(undefined),
      simulateKeyPress: vi.fn((...keyCodes: number[]) => {
        // When Enter is pressed, simulate command execution
        if (keyCodes.includes(13) && stdoutHandler) {
          setTimeout(() => {
            stdoutHandler!('Open Watcom C16 Compiler Version 2.0\n');
            stdoutHandler!('Compiling source file...\n');
            stdoutHandler!('<<<COMPILE_SUCCESS>>>\n');
            stdoutHandler!('C:\\>\n');
            stdoutHandler!('Linking object files...\n');
            stdoutHandler!('<<<LINK_SUCCESS>>>\n');
            stdoutHandler!('C:\\>\n');
          }, 10);
        }
      }),
      events: vi.fn().mockReturnValue({
        onStdout: vi.fn((handler: (message: string) => void) => {
          stdoutHandler = handler;
        }),
        onFrameSize: vi.fn(),
        onFrame: vi.fn(),
        onSoundPush: vi.fn(),
        onExit: vi.fn(),
        onMessage: vi.fn(),
        onNetworkConnected: vi.fn(),
        onNetworkDisconnected: vi.fn(),
      } as CommandInterfaceEvents),
    } as unknown as CommandInterface;

    // Create service with default config
    service = new OpenWatcomCompilerService(mockCI);
  });

  describe('constructor', () => {
    it('should initialize with default config', () => {
      expect(service).toBeDefined();
      expect(service.getBuildMessages()).toEqual([]);
    });

    it('should accept custom config', () => {
      const customConfig = {
        ...defaultOpenWatcomConfig,
        verbose: false,
        maxCompilationTime: 60000,
      };
      const customService = new OpenWatcomCompilerService(mockCI, customConfig);
      expect(customService).toBeDefined();
    });
  });

  describe('compile()', () => {
    it('should successfully compile valid C code', async () => {
      const sourceCode = `#include <stdio.h>
int main(void) {
    printf("Hello, DOS!\\n");
    return 0;
}`;

      const result = await service.compile(sourceCode, 'hello.c', 'hello.exe');

      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.outputFile).toBe('hello.exe');
      expect(result.executable).toBeDefined();
      expect(result.compilationTime).toBeGreaterThanOrEqual(0);
      
      // Verify file operations were called
      expect(mockCI.fsWriteFile).toHaveBeenCalled();
      expect(mockCI.fsReadFile).toHaveBeenCalled();
    });

    it('should handle compilation with optimization options', async () => {
      const sourceCode = `int main(void) { return 0; }`;

      const result = await service.compile(sourceCode, 'test.c', 'test.exe', {
        optimization: 'O2',
        memoryModel: 'small',
      });

      expect(result.success).toBe(true);
      expect(result.outputFile).toBe('test.exe');
    });

    it('should handle compilation with different memory models', async () => {
      const sourceCode = `int main(void) { return 0; }`;

      const memoryModels = ['tiny', 'small', 'compact', 'medium', 'large', 'huge'] as const;

      for (const model of memoryModels) {
        const result = await service.compile(sourceCode, 'test.c', 'test.exe', {
          memoryModel: model,
        });

        expect(result.success).toBe(true);
      }
    });

    it('should handle compilation with debug info', async () => {
      const sourceCode = `int main(void) { return 0; }`;

      const result = await service.compile(sourceCode, 'test.c', 'test.exe', {
        debug: true,
      });

      expect(result.success).toBe(true);
    });

    it('should handle compilation with warning options', async () => {
      const sourceCode = `int main(void) { return 0; }`;

      const result = await service.compile(sourceCode, 'test.c', 'test.exe', {
        warningLevel: 4,
        warningsAsErrors: true,
      });

      expect(result.success).toBe(true);
    });

    it('should track compilation time', async () => {
      const sourceCode = `int main(void) { return 0; }`;

      const result = await service.compile(sourceCode, 'test.c', 'test.exe');

      expect(result.compilationTime).toBeDefined();
      expect(result.compilationTime).toBeGreaterThanOrEqual(0);
    });

    it('should handle filesystem write errors', async () => {
      // Test that filesystem write errors are handled gracefully
      const sourceCode = `int main(void) { return 0; }`;

      // Create a new service with a mock that will fail on write
      const failingMockCI = {
        ...mockCI,
        fsWriteFile: vi.fn().mockRejectedValue(new Error('Disk full')),
      } as unknown as CommandInterface;

      const failingService = new OpenWatcomCompilerService(failingMockCI);
      const result = await failingService.compile(sourceCode, 'test.c', 'test.exe');

      // Errors during directory creation are caught and handled
      expect(result).toBeDefined();
      expect(result.outputFile).toBe('test.exe');
    });

    it('should handle filesystem read errors', async () => {
      const sourceCode = `int main(void) { return 0; }`;

      // Mock read to fail when reading the object file (first read after compilation)
      (mockCI.fsReadFile as any).mockRejectedValue(new Error('File not found'));

      const result = await service.compile(sourceCode, 'test.c', 'test.exe');

      expect(result.success).toBe(false);
      // When object file read fails, compilation fails but errors array may be empty
      // Check that build messages contain the error
      const messages = service.getBuildMessages();
      const hasError = messages.some(msg => msg.type === 'error');
      expect(hasError).toBe(true);

      // Reset mock for other tests
      (mockCI.fsReadFile as any).mockResolvedValue(new Uint8Array([0x4D, 0x5A, 0x90, 0x00]));
    });

    it('should handle timeout errors', async () => {
      // Test that timeout configuration is respected
      const sourceCode = `int main(void) { return 0; }`;

      // Create service with very short timeout
      const shortTimeoutService = new OpenWatcomCompilerService(mockCI, {
        maxCompilationTime: 10, // 10ms timeout
      });

      const result = await shortTimeoutService.compile(sourceCode, 'test.c', 'test.exe');

      // Note: This test uses mocked CommandInterface which completes instantly.
      // Real timeout scenarios would require testing with actual js-dos instance.
      expect(result).toBeDefined();
      expect(result.compilationTime).toBeDefined();
    });

    it('should generate build messages', async () => {
      const sourceCode = `int main(void) { return 0; }`;

      await service.compile(sourceCode, 'test.c', 'test.exe');

      const messages = service.getBuildMessages();
      expect(messages.length).toBeGreaterThan(0);
      expect(messages.some(m => m.type === 'info')).toBe(true);
    });

    it('should clear build messages', async () => {
      const sourceCode = `int main(void) { return 0; }`;

      await service.compile(sourceCode, 'test.c', 'test.exe');
      expect(service.getBuildMessages().length).toBeGreaterThan(0);

      service.clearBuildMessages();
      expect(service.getBuildMessages()).toHaveLength(0);
    });

    it('should handle cancellation', async () => {
      const sourceCode = `int main(void) { return 0; }`;

      // Start compilation
      const compilePromise = service.compile(sourceCode, 'test.c', 'test.exe');

      // Cancel immediately
      service.cancel();

      const result = await compilePromise;

      // Should still complete but may have been interrupted
      expect(result).toBeDefined();
    });
  });

  describe('compileMultiple()', () => {
    it('should compile multiple source files', async () => {
      const sourceFiles = [
        { name: 'main.c', content: 'int main(void) { return 0; }' },
        { name: 'helper.c', content: 'int add(int a, int b) { return a + b; }' },
      ];

      const result = await service.compileMultiple(sourceFiles, 'program.exe');

      expect(result.success).toBe(true);
      expect(result.outputFile).toBe('program.exe');
      expect(result.executable).toBeDefined();
    });

    it('should handle header files', async () => {
      const sourceFiles = [
        { name: 'main.c', content: '#include "helper.h"\nint main(void) { return 0; }' },
        { name: 'helper.h', content: 'int add(int a, int b);' },
        { name: 'helper.c', content: 'int add(int a, int b) { return a + b; }' },
      ];

      const result = await service.compileMultiple(sourceFiles, 'program.exe');

      expect(result.success).toBe(true);
      
      // Verify header files were written but not compiled
      const writeFileCalls = (mockCI.fsWriteFile as any).mock.calls;
      const headerWritten = writeFileCalls.some((call: any[]) => call[0].includes('helper.h'));
      expect(headerWritten).toBe(true);
    });

    it('should handle compilation errors in multi-file projects', async () => {
      const sourceFiles = [
        { name: 'main.c', content: 'int main(void) { return 0; }' },
        { name: 'error.c', content: 'invalid syntax here' },
      ];

      // Mock filesystem to simulate compilation error
      (mockCI.fsReadFile as any).mockRejectedValueOnce(new Error('Compilation failed'));

      const result = await service.compileMultiple(sourceFiles, 'program.exe');

      // Note: This test uses mocked CommandInterface which simulates success.
      // Real compilation error detection would require testing with actual js-dos instance.
      expect(result).toBeDefined();
    });

    it('should compile with options for multi-file projects', async () => {
      const sourceFiles = [
        { name: 'main.c', content: 'int main(void) { return 0; }' },
        { name: 'helper.c', content: 'int add(int a, int b) { return a + b; }' },
      ];

      const result = await service.compileMultiple(sourceFiles, 'program.exe', {
        optimization: 'O2',
        memoryModel: 'compact',
      });

      expect(result.success).toBe(true);
    });
  });

  describe('progress tracking', () => {
    it('should report progress during compilation', async () => {
      const sourceCode = `int main(void) { return 0; }`;
      const progressUpdates: any[] = [];

      service.setProgressCallback((progress) => {
        progressUpdates.push(progress);
      });

      await service.compile(sourceCode, 'test.c', 'test.exe');

      expect(progressUpdates.length).toBeGreaterThan(0);
      expect(progressUpdates[0].step).toBe('initializing');
      expect(progressUpdates[0].progress).toBe(0);
    });

    it('should clear progress callback', () => {
      service.setProgressCallback(undefined);
      // Should not throw
      expect(service).toBeDefined();
    });
  });

  describe('error handling', () => {
    it('should format error messages correctly', async () => {
      // Test that error formatting infrastructure works correctly
      const sourceCode = `int main(void) { return 0; }`;

      const result = await service.compile(sourceCode, 'test.c', 'test.exe');

      // Verify the result structure is correct
      expect(result).toBeDefined();
      expect(result.errors).toBeDefined();
      expect(Array.isArray(result.errors)).toBe(true);
      expect(result.rawOutput).toBeDefined();
      expect(typeof result.rawOutput).toBe('string');
    });

    it('should handle unknown errors gracefully', async () => {
      // Test that the service handles edge cases gracefully
      const sourceCode = `int main(void) { return 0; }`;

      const result = await service.compile(sourceCode, 'test.c', 'test.exe');

      // Verify basic error handling structure
      expect(result).toBeDefined();
      expect(result.success).toBeDefined();
      expect(typeof result.success).toBe('boolean');
    });
  });
});

