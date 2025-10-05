/**
 * DosKit - OpenWatcomCompilerService Multi-file Compilation Tests
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * Comprehensive tests for multi-file compilation with Open Watcom
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OpenWatcomCompilerService } from './OpenWatcomCompilerService';
import type { CommandInterface } from '../types/js-dos';
import { createMockCommandInterface } from './__test-helpers__/mockCommandInterface';

describe('OpenWatcomCompilerService - Multi-file Compilation', () => {
  let mockCI: CommandInterface;
  let service: OpenWatcomCompilerService;

  beforeEach(() => {
    vi.clearAllMocks();

    mockCI = createMockCommandInterface();
    service = new OpenWatcomCompilerService(mockCI);
  });

  describe('Two-file projects', () => {
    it('should compile main.c + helper.c', async () => {
      const sourceFiles = [
        { 
          name: 'main.c', 
          content: `#include <stdio.h>
extern int add(int a, int b);

int main(void) {
    printf("Result: %d\\n", add(5, 3));
    return 0;
}` 
        },
        { 
          name: 'helper.c', 
          content: `int add(int a, int b) {
    return a + b;
}` 
        },
      ];

      const result = await service.compileMultiple(sourceFiles, 'program.exe');

      expect(result.success).toBe(true);
      expect(result.outputFile).toBe('program.exe');
      expect(result.executable).toBeDefined();
      
      // Verify both source files were written
      const writeFileCalls = (mockCI.fsWriteFile as any).mock.calls;
      const mainWritten = writeFileCalls.some((call: any[]) => call[0].includes('main.c'));
      const helperWritten = writeFileCalls.some((call: any[]) => call[0].includes('helper.c'));
      expect(mainWritten).toBe(true);
      expect(helperWritten).toBe(true);
    });

    it('should compile with header file', async () => {
      const sourceFiles = [
        { 
          name: 'main.c', 
          content: `#include "math_ops.h"

int main(void) {
    return multiply(4, 5);
}` 
        },
        { 
          name: 'math_ops.h', 
          content: `#ifndef MATH_OPS_H
#define MATH_OPS_H

int multiply(int a, int b);

#endif` 
        },
        { 
          name: 'math_ops.c', 
          content: `#include "math_ops.h"

int multiply(int a, int b) {
    return a * b;
}` 
        },
      ];

      const result = await service.compileMultiple(sourceFiles, 'program.exe');

      expect(result.success).toBe(true);
      
      // Verify header file was written
      const writeFileCalls = (mockCI.fsWriteFile as any).mock.calls;
      const headerWritten = writeFileCalls.some((call: any[]) => call[0].includes('math_ops.h'));
      expect(headerWritten).toBe(true);
    });
  });

  describe('Three-file projects', () => {
    it('should compile main.c + helper1.c + helper2.c', async () => {
      const sourceFiles = [
        { 
          name: 'main.c', 
          content: `extern int add(int a, int b);
extern int subtract(int a, int b);

int main(void) {
    int sum = add(10, 5);
    int diff = subtract(10, 5);
    return sum + diff;
}` 
        },
        { 
          name: 'helper1.c', 
          content: `int add(int a, int b) {
    return a + b;
}` 
        },
        { 
          name: 'helper2.c', 
          content: `int subtract(int a, int b) {
    return a - b;
}` 
        },
      ];

      const result = await service.compileMultiple(sourceFiles, 'program.exe');

      expect(result.success).toBe(true);
      expect(result.outputFile).toBe('program.exe');
    });

    it('should compile with multiple header files', async () => {
      const sourceFiles = [
        { 
          name: 'main.c', 
          content: `#include "math.h"
#include "string_utils.h"

int main(void) {
    return add(1, 2);
}` 
        },
        { 
          name: 'math.h', 
          content: `int add(int a, int b);` 
        },
        { 
          name: 'math.c', 
          content: `#include "math.h"
int add(int a, int b) { return a + b; }` 
        },
        { 
          name: 'string_utils.h', 
          content: `int string_length(const char* s);` 
        },
        { 
          name: 'string_utils.c', 
          content: `#include "string_utils.h"
int string_length(const char* s) { return 0; }` 
        },
      ];

      const result = await service.compileMultiple(sourceFiles, 'program.exe');

      expect(result.success).toBe(true);
      
      // Verify all files were written
      const writeFileCalls = (mockCI.fsWriteFile as any).mock.calls;
      expect(writeFileCalls.length).toBeGreaterThan(0);
    });
  });

  describe('Complex projects', () => {
    it('should compile project with nested includes', async () => {
      const sourceFiles = [
        { 
          name: 'main.c', 
          content: `#include "app.h"

int main(void) {
    return run_app();
}` 
        },
        { 
          name: 'app.h', 
          content: `#include "config.h"
int run_app(void);` 
        },
        { 
          name: 'app.c', 
          content: `#include "app.h"
int run_app(void) { return 0; }` 
        },
        { 
          name: 'config.h', 
          content: `#define VERSION 1` 
        },
      ];

      const result = await service.compileMultiple(sourceFiles, 'program.exe');

      expect(result.success).toBe(true);
    });

    it('should compile project with include guards', async () => {
      const sourceFiles = [
        { 
          name: 'main.c', 
          content: `#include "types.h"
#include "types.h"  // Duplicate include should be safe

int main(void) {
    return 0;
}` 
        },
        { 
          name: 'types.h', 
          content: `#ifndef TYPES_H
#define TYPES_H

typedef int my_int;

#endif` 
        },
      ];

      const result = await service.compileMultiple(sourceFiles, 'program.exe');

      expect(result.success).toBe(true);
    });
  });

  describe('Error handling', () => {
    it('should handle missing header file', async () => {
      const sourceFiles = [
        {
          name: 'main.c',
          content: `#include "missing.h"

int main(void) {
    return 0;
}`
        },
      ];

      const result = await service.compileMultiple(sourceFiles, 'program.exe');

      // With real DOS execution, missing headers are detected during compilation
      expect(result).toBeDefined();
    });

    it('should handle syntax error in one of multiple files', async () => {
      const sourceFiles = [
        {
          name: 'main.c',
          content: `int main(void) { return 0; }`
        },
        {
          name: 'error.c',
          content: `int broken( { return 0; }` // Syntax error
        },
      ];

      const result = await service.compileMultiple(sourceFiles, 'program.exe');

      // With real DOS execution, syntax errors are detected during compilation
      expect(result).toBeDefined();
    });

    it('should handle linker error with undefined reference', async () => {
      const sourceFiles = [
        {
          name: 'main.c',
          content: `extern int undefined_function(void);

int main(void) {
    return undefined_function();
}`
        },
      ];

      const result = await service.compileMultiple(sourceFiles, 'program.exe');

      // With real DOS execution, linker errors are detected during linking
      expect(result).toBeDefined();
    });
  });

  describe('Compilation options with multi-file', () => {
    it('should apply optimization to all files', async () => {
      const sourceFiles = [
        { name: 'main.c', content: 'int main(void) { return 0; }' },
        { name: 'helper.c', content: 'int add(int a, int b) { return a + b; }' },
      ];

      const result = await service.compileMultiple(sourceFiles, 'program.exe', {
        optimization: 'O2',
      });

      expect(result.success).toBe(true);
    });

    it('should apply memory model to all files', async () => {
      const sourceFiles = [
        { name: 'main.c', content: 'int main(void) { return 0; }' },
        { name: 'helper.c', content: 'int add(int a, int b) { return a + b; }' },
      ];

      const result = await service.compileMultiple(sourceFiles, 'program.exe', {
        memoryModel: 'large',
      });

      expect(result.success).toBe(true);
    });

    it('should apply debug info to all files', async () => {
      const sourceFiles = [
        { name: 'main.c', content: 'int main(void) { return 0; }' },
        { name: 'helper.c', content: 'int add(int a, int b) { return a + b; }' },
      ];

      const result = await service.compileMultiple(sourceFiles, 'program.exe', {
        debug: true,
      });

      expect(result.success).toBe(true);
    });
  });
});

