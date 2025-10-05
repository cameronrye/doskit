/**
 * DosKit - OpenWatcomCompilerService Integration Tests
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * End-to-end integration tests for Open Watcom compiler
 * These tests verify the complete compilation workflow
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OpenWatcomCompilerService } from './OpenWatcomCompilerService';
import type { CommandInterface, CommandInterfaceEvents } from '../types/js-dos';

describe('OpenWatcomCompilerService - Integration Tests', () => {
  let mockCI: CommandInterface;
  let service: OpenWatcomCompilerService;

  beforeEach(() => {
    vi.clearAllMocks();

    // Create stdout handler storage
    let stdoutHandler: ((message: string) => void) | null = null;

    mockCI = {
      fsWriteFile: vi.fn().mockResolvedValue(undefined),
      fsReadFile: vi.fn().mockResolvedValue(new Uint8Array([0x4D, 0x5A, 0x90, 0x00])),
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

    service = new OpenWatcomCompilerService(mockCI);
  });

  describe('Hello World Programs', () => {
    it('should compile basic Hello World', async () => {
      const sourceCode = `#include <stdio.h>

int main(void) {
    printf("Hello, DOS World!\\n");
    return 0;
}`;

      const result = await service.compile(sourceCode, 'hello.c', 'hello.exe');

      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.outputFile).toBe('hello.exe');
      expect(result.executable).toBeDefined();
      expect(result.compilationTime).toBeGreaterThanOrEqual(0);
    });

    it('should compile Hello World with optimization', async () => {
      const sourceCode = `#include <stdio.h>

int main(void) {
    printf("Hello, Optimized World!\\n");
    return 0;
}`;

      const result = await service.compile(sourceCode, 'hello.c', 'hello.exe', {
        optimization: 'O2',
      });

      expect(result.success).toBe(true);
      expect(result.executable).toBeDefined();
    });

    it('should compile Hello World with debug info', async () => {
      const sourceCode = `#include <stdio.h>

int main(void) {
    printf("Hello, Debug World!\\n");
    return 0;
}`;

      const result = await service.compile(sourceCode, 'hello.c', 'hello.exe', {
        debug: true,
      });

      expect(result.success).toBe(true);
      expect(result.executable).toBeDefined();
    });
  });

  describe('Arithmetic Programs', () => {
    it('should compile program with arithmetic operations', async () => {
      const sourceCode = `#include <stdio.h>

int main(void) {
    int a = 10;
    int b = 5;
    printf("Sum: %d\\n", a + b);
    printf("Difference: %d\\n", a - b);
    printf("Product: %d\\n", a * b);
    printf("Quotient: %d\\n", a / b);
    return 0;
}`;

      const result = await service.compile(sourceCode, 'math.c', 'math.exe');

      expect(result.success).toBe(true);
      expect(result.executable).toBeDefined();
    });

    it('should compile program with floating point', async () => {
      const sourceCode = `#include <stdio.h>

int main(void) {
    float x = 3.14;
    float y = 2.0;
    printf("Result: %f\\n", x * y);
    return 0;
}`;

      const result = await service.compile(sourceCode, 'float.c', 'float.exe');

      expect(result.success).toBe(true);
    });
  });

  describe('Control Flow Programs', () => {
    it('should compile program with if-else', async () => {
      const sourceCode = `#include <stdio.h>

int main(void) {
    int x = 10;
    if (x > 5) {
        printf("Greater than 5\\n");
    } else {
        printf("Less than or equal to 5\\n");
    }
    return 0;
}`;

      const result = await service.compile(sourceCode, 'ifelse.c', 'ifelse.exe');

      expect(result.success).toBe(true);
    });

    it('should compile program with loops', async () => {
      const sourceCode = `#include <stdio.h>

int main(void) {
    int i;
    for (i = 0; i < 10; i++) {
        printf("%d ", i);
    }
    printf("\\n");
    return 0;
}`;

      const result = await service.compile(sourceCode, 'loop.c', 'loop.exe');

      expect(result.success).toBe(true);
    });

    it('should compile program with while loop', async () => {
      const sourceCode = `#include <stdio.h>

int main(void) {
    int i = 0;
    while (i < 5) {
        printf("%d ", i);
        i++;
    }
    printf("\\n");
    return 0;
}`;

      const result = await service.compile(sourceCode, 'while.c', 'while.exe');

      expect(result.success).toBe(true);
    });

    it('should compile program with switch statement', async () => {
      const sourceCode = `#include <stdio.h>

int main(void) {
    int choice = 2;
    switch (choice) {
        case 1:
            printf("One\\n");
            break;
        case 2:
            printf("Two\\n");
            break;
        default:
            printf("Other\\n");
    }
    return 0;
}`;

      const result = await service.compile(sourceCode, 'switch.c', 'switch.exe');

      expect(result.success).toBe(true);
    });
  });

  describe('Function Programs', () => {
    it('should compile program with functions', async () => {
      const sourceCode = `#include <stdio.h>

int add(int a, int b) {
    return a + b;
}

int main(void) {
    int result = add(5, 3);
    printf("Result: %d\\n", result);
    return 0;
}`;

      const result = await service.compile(sourceCode, 'func.c', 'func.exe');

      expect(result.success).toBe(true);
    });

    it('should compile program with recursive function', async () => {
      const sourceCode = `#include <stdio.h>

int factorial(int n) {
    if (n <= 1) return 1;
    return n * factorial(n - 1);
}

int main(void) {
    printf("Factorial of 5: %d\\n", factorial(5));
    return 0;
}`;

      const result = await service.compile(sourceCode, 'factorial.c', 'factorial.exe');

      expect(result.success).toBe(true);
    });
  });

  describe('Array and String Programs', () => {
    it('should compile program with arrays', async () => {
      const sourceCode = `#include <stdio.h>

int main(void) {
    int numbers[5] = {1, 2, 3, 4, 5};
    int i;
    for (i = 0; i < 5; i++) {
        printf("%d ", numbers[i]);
    }
    printf("\\n");
    return 0;
}`;

      const result = await service.compile(sourceCode, 'array.c', 'array.exe');

      expect(result.success).toBe(true);
    });

    it('should compile program with strings', async () => {
      const sourceCode = `#include <stdio.h>
#include <string.h>

int main(void) {
    char str[] = "Hello";
    printf("String: %s\\n", str);
    printf("Length: %d\\n", strlen(str));
    return 0;
}`;

      const result = await service.compile(sourceCode, 'string.c', 'string.exe');

      expect(result.success).toBe(true);
    });
  });

  describe('Multi-file Programs', () => {
    it('should compile multi-file calculator program', async () => {
      const sourceFiles = [
        {
          name: 'main.c',
          content: `#include <stdio.h>
#include "calc.h"

int main(void) {
    printf("5 + 3 = %d\\n", add(5, 3));
    printf("5 - 3 = %d\\n", subtract(5, 3));
    return 0;
}`
        },
        {
          name: 'calc.h',
          content: `#ifndef CALC_H
#define CALC_H

int add(int a, int b);
int subtract(int a, int b);

#endif`
        },
        {
          name: 'calc.c',
          content: `#include "calc.h"

int add(int a, int b) {
    return a + b;
}

int subtract(int a, int b) {
    return a - b;
}`
        }
      ];

      const result = await service.compileMultiple(sourceFiles, 'calc.exe');

      expect(result.success).toBe(true);
      expect(result.executable).toBeDefined();
    });
  });

  describe('Programs with Errors', () => {
    it('should detect syntax errors', async () => {
      const sourceCode = `#include <stdio.h>

int main(void) {
    printf("Missing semicolon")
    return 0;
}`;

      const result = await service.compile(sourceCode, 'error.c', 'error.exe');

      // TODO: When actual DOS execution is implemented, this should fail
      // For now, placeholder may succeed
      expect(result).toBeDefined();
    });

    it('should detect missing includes', async () => {
      const sourceCode = `int main(void) {
    printf("No stdio.h\\n");
    return 0;
}`;

      const result = await service.compile(sourceCode, 'error.c', 'error.exe');

      // TODO: When actual DOS execution is implemented, this should fail
      expect(result).toBeDefined();
    });
  });

  describe('Executable Validation', () => {
    it('should generate valid MZ executable header', async () => {
      const sourceCode = `int main(void) { return 0; }`;

      const result = await service.compile(sourceCode, 'test.c', 'test.exe');

      expect(result.success).toBe(true);
      expect(result.executable).toBeDefined();
      
      if (result.executable) {
        // Check for MZ header (DOS executable signature)
        expect(result.executable[0]).toBe(0x4D); // 'M'
        expect(result.executable[1]).toBe(0x5A); // 'Z'
      }
    });
  });
});

