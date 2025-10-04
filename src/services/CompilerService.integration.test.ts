/**
 * DosKit - CompilerService Integration Tests (Phase 3 POC)
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 * 
 * These tests verify the real DOS executable generator integration
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CompilerService } from './CompilerService';
import { DosExecutableGenerator } from './DosExecutableGenerator';
import type { CommandInterface } from '../types/js-dos';

// Mock the compiler config to enable real DOS compilation
vi.mock('../config/compiler.config', () => ({
  mockCompilerEnabled: false,
  mockCompilationDelay: 0,
  realDosCompilerEnabled: true, // Enable real DOS compiler for these tests
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

describe('CompilerService - Real DOS Compilation (Phase 3 POC)', () => {
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

  describe('Real DOS Executable Generation', () => {
    it('should compile simple Hello World program to real DOS executable', async () => {
      const sourceCode = `
#include <stdio.h>

int main() {
    printf("Hello, DOS World!");
    return 0;
}
`;

      // Mock file read to return source code
      (mockCI.fsReadFile as ReturnType<typeof vi.fn>).mockResolvedValue(
        new TextEncoder().encode(sourceCode)
      );

      const result = await compiler.compile('hello.c', 'hello.exe');

      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.executable).toBeDefined();
      
      // Verify it's a valid DOS MZ executable
      expect(DosExecutableGenerator.isValidMZExecutable(result.executable!)).toBe(true);
      
      // Verify MZ header
      const mzInfo = DosExecutableGenerator.getMZInfo(result.executable!);
      expect(mzInfo).not.toBeNull();
      expect(mzInfo!.signature).toBe(0x5A4D); // MZ signature
    });

    it('should compile program with multiple printf statements', async () => {
      const sourceCode = `
#include <stdio.h>

int main() {
    printf("Line 1");
    printf("Line 2");
    printf("Line 3");
    return 0;
}
`;

      (mockCI.fsReadFile as ReturnType<typeof vi.fn>).mockResolvedValue(
        new TextEncoder().encode(sourceCode)
      );

      const result = await compiler.compile('multi.c', 'multi.exe');

      expect(result.success).toBe(true);
      expect(result.executable).toBeDefined();
      expect(DosExecutableGenerator.isValidMZExecutable(result.executable!)).toBe(true);
    });

    it('should handle escape sequences in printf', async () => {
      const sourceCode = `
#include <stdio.h>

int main() {
    printf("Hello\\nWorld\\r\\n");
    return 0;
}
`;

      (mockCI.fsReadFile as ReturnType<typeof vi.fn>).mockResolvedValue(
        new TextEncoder().encode(sourceCode)
      );

      const result = await compiler.compile('escape.c', 'escape.exe');

      expect(result.success).toBe(true);
      expect(result.executable).toBeDefined();
      expect(DosExecutableGenerator.isValidMZExecutable(result.executable!)).toBe(true);
    });

    it('should detect missing main function', async () => {
      const sourceCode = `
#include <stdio.h>

void helper() {
    printf("No main!");
}
`;

      (mockCI.fsReadFile as ReturnType<typeof vi.fn>).mockResolvedValue(
        new TextEncoder().encode(sourceCode)
      );

      const result = await compiler.compile('nomain.c', 'nomain.exe');

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(e => e.includes('main'))).toBe(true);
    });

    it('should generate warning for missing stdio.h include', async () => {
      const sourceCode = `
int main() {
    printf("Missing include!");
    return 0;
}
`;

      (mockCI.fsReadFile as ReturnType<typeof vi.fn>).mockResolvedValue(
        new TextEncoder().encode(sourceCode)
      );

      const result = await compiler.compile('noinclude.c', 'noinclude.exe');

      // Should still compile but with warnings
      expect(result.success).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some(w => w.includes('printf'))).toBe(true);
    });

    it('should write executable to filesystem', async () => {
      const sourceCode = `
#include <stdio.h>

int main() {
    printf("Test");
    return 0;
}
`;

      (mockCI.fsReadFile as ReturnType<typeof vi.fn>).mockResolvedValue(
        new TextEncoder().encode(sourceCode)
      );

      await compiler.compile('test.c', 'test.exe');

      // Verify fsWriteFile was called with the executable
      expect(mockCI.fsWriteFile).toHaveBeenCalledWith(
        '/C/PROJECT/test.exe',
        expect.any(Uint8Array)
      );
    });

    it('should track compilation time', async () => {
      const sourceCode = `
#include <stdio.h>

int main() {
    printf("Timing test");
    return 0;
}
`;

      (mockCI.fsReadFile as ReturnType<typeof vi.fn>).mockResolvedValue(
        new TextEncoder().encode(sourceCode)
      );

      const result = await compiler.compile('timing.c', 'timing.exe');

      expect(result.compilationTime).toBeDefined();
      expect(result.compilationTime).toBeGreaterThanOrEqual(0);
    });

    it('should generate appropriate build messages', async () => {
      const sourceCode = `
#include <stdio.h>

int main() {
    printf("Build messages test");
    return 0;
}
`;

      (mockCI.fsReadFile as ReturnType<typeof vi.fn>).mockResolvedValue(
        new TextEncoder().encode(sourceCode)
      );

      await compiler.compile('messages.c', 'messages.exe');

      const messages = compiler.getBuildMessages();
      
      // Should have info messages about compilation
      const infoMessages = messages.filter(m => m.type === 'info');
      expect(infoMessages.length).toBeGreaterThan(0);
      
      // Should have success message
      const successMessages = messages.filter(m => m.type === 'success');
      expect(successMessages.length).toBeGreaterThan(0);
    });

    it('should handle file not found error', async () => {
      (mockCI.fsReadFile as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('File not found')
      );

      const result = await compiler.compile('missing.c', 'missing.exe');

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Source file not found: missing.c');
    });

    it('should validate generated executable format', async () => {
      const sourceCode = `
#include <stdio.h>

int main() {
    printf("Validation test");
    return 0;
}
`;

      (mockCI.fsReadFile as ReturnType<typeof vi.fn>).mockResolvedValue(
        new TextEncoder().encode(sourceCode)
      );

      const result = await compiler.compile('validate.c', 'validate.exe');

      expect(result.success).toBe(true);
      expect(result.executable).toBeDefined();
      
      // Detailed validation
      const executable = result.executable!;
      expect(executable.length).toBeGreaterThan(28); // Minimum MZ header size
      expect(executable[0]).toBe(0x4D); // 'M'
      expect(executable[1]).toBe(0x5A); // 'Z'
    });
  });

  describe('Build Messages', () => {
    it('should include DOS executable generator info', async () => {
      const sourceCode = `
#include <stdio.h>

int main() {
    printf("Test");
    return 0;
}
`;

      (mockCI.fsReadFile as ReturnType<typeof vi.fn>).mockResolvedValue(
        new TextEncoder().encode(sourceCode)
      );

      await compiler.compile('test.c', 'test.exe');

      const messages = compiler.getBuildMessages();
      const messageTexts = messages.map(m => m.message);
      
      expect(messageTexts.some(m => m.includes('DOS Executable Generator'))).toBe(true);
      expect(messageTexts.some(m => m.includes('Generating DOS MZ executable'))).toBe(true);
    });

    it('should include executable size in build messages', async () => {
      const sourceCode = `
#include <stdio.h>

int main() {
    printf("Size test");
    return 0;
}
`;

      (mockCI.fsReadFile as ReturnType<typeof vi.fn>).mockResolvedValue(
        new TextEncoder().encode(sourceCode)
      );

      await compiler.compile('size.c', 'size.exe');

      const messages = compiler.getBuildMessages();
      const messageTexts = messages.map(m => m.message);
      
      expect(messageTexts.some(m => m.includes('Executable size:'))).toBe(true);
      expect(messageTexts.some(m => m.includes('bytes'))).toBe(true);
    });
  });
});

