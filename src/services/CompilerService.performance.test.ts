/**
 * DosKit - CompilerService Performance Tests
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 * 
 * Performance benchmarks for WASM compiler integration
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CompilerService } from './CompilerService';
import type { CommandInterface } from '../types/js-dos';

// Mock the compiler config to enable real DOS compilation for performance tests
vi.mock('../config/compiler.config', () => ({
  mockCompilerEnabled: false,
  mockCompilationDelay: 0,
  realDosCompilerEnabled: true,
  wasmCompilerConfig: {
    wasmModuleUrl: '/test/gcc.wasm',
    maxCompilationTime: 30000,
    verbose: false, // Disable verbose for performance tests
    defaultOptimization: 'O2',
    defaultWarnings: true,
    defaultDebug: false,
  },
  compilerFeatureFlags: {
    enableWasmCompiler: true,
    enableMockCompiler: false,
    preferWasmCompiler: true,
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

describe('CompilerService - Performance Benchmarks', () => {
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

  describe('Simple Program Performance', () => {
    it('should compile Hello World in under 100ms', async () => {
      const sourceCode = `
#include <stdio.h>

int main() {
    printf("Hello, World!");
    return 0;
}
`;

      (mockCI.fsReadFile as ReturnType<typeof vi.fn>).mockResolvedValue(
        new TextEncoder().encode(sourceCode)
      );

      const startTime = Date.now();
      const result = await compiler.compile('hello.c', 'hello.exe');
      const endTime = Date.now();

      expect(result.success).toBe(true);
      expect(result.compilationTime).toBeLessThan(100);
      expect(endTime - startTime).toBeLessThan(150); // Allow some overhead
    });

    it('should compile simple arithmetic program efficiently', async () => {
      const sourceCode = `
#include <stdio.h>

int main() {
    int a = 10, b = 20;
    int sum = a + b;
    printf("Sum: %d", sum);
    return 0;
}
`;

      (mockCI.fsReadFile as ReturnType<typeof vi.fn>).mockResolvedValue(
        new TextEncoder().encode(sourceCode)
      );

      const result = await compiler.compile('arithmetic.c', 'arithmetic.exe');

      expect(result.success).toBe(true);
      expect(result.compilationTime).toBeLessThan(100);
      expect(result.executable).toBeDefined();
      expect(result.executable!.length).toBeGreaterThan(0);
    });
  });

  describe('Complex Program Performance', () => {
    it('should compile program with multiple functions in reasonable time', async () => {
      const sourceCode = `
#include <stdio.h>

int add(int a, int b) {
    return a + b;
}

int multiply(int a, int b) {
    return a * b;
}

int factorial(int n) {
    if (n <= 1) return 1;
    return n * factorial(n - 1);
}

int main() {
    int x = 5, y = 3;
    printf("Add: %d\\n", add(x, y));
    printf("Multiply: %d\\n", multiply(x, y));
    printf("Factorial of %d: %d\\n", x, factorial(x));
    return 0;
}
`;

      (mockCI.fsReadFile as ReturnType<typeof vi.fn>).mockResolvedValue(
        new TextEncoder().encode(sourceCode)
      );

      const result = await compiler.compile('complex.c', 'complex.exe');

      expect(result.success).toBe(true);
      expect(result.compilationTime).toBeLessThan(200); // Allow more time for complex code
      expect(result.executable).toBeDefined();
    });

    it('should compile program with loops and arrays efficiently', async () => {
      const sourceCode = `
#include <stdio.h>

int main() {
    int numbers[10];
    int sum = 0;
    
    // Initialize array
    for (int i = 0; i < 10; i++) {
        numbers[i] = i * 2;
    }
    
    // Calculate sum
    for (int i = 0; i < 10; i++) {
        sum += numbers[i];
    }
    
    printf("Sum of array: %d\\n", sum);
    return 0;
}
`;

      (mockCI.fsReadFile as ReturnType<typeof vi.fn>).mockResolvedValue(
        new TextEncoder().encode(sourceCode)
      );

      const result = await compiler.compile('arrays.c', 'arrays.exe');

      expect(result.success).toBe(true);
      expect(result.compilationTime).toBeLessThan(150);
      expect(result.executable).toBeDefined();
    });
  });

  describe('Optimization Level Performance', () => {
    const testCode = `
#include <stdio.h>

int fibonacci(int n) {
    if (n <= 1) return n;
    return fibonacci(n - 1) + fibonacci(n - 2);
}

int main() {
    printf("Fibonacci(10): %d\\n", fibonacci(10));
    return 0;
}
`;

    it('should compile with O0 optimization', async () => {
      (mockCI.fsReadFile as ReturnType<typeof vi.fn>).mockResolvedValue(
        new TextEncoder().encode(testCode)
      );

      const result = await compiler.compile('fib_o0.c', 'fib_o0.exe', {
        optimization: 'O0'
      });

      expect(result.success).toBe(true);
      expect(result.compilationTime).toBeLessThan(200);
    });

    it('should compile with O2 optimization (default)', async () => {
      (mockCI.fsReadFile as ReturnType<typeof vi.fn>).mockResolvedValue(
        new TextEncoder().encode(testCode)
      );

      const result = await compiler.compile('fib_o2.c', 'fib_o2.exe', {
        optimization: 'O2'
      });

      expect(result.success).toBe(true);
      expect(result.compilationTime).toBeLessThan(200);
    });

    it('should compile with O3 optimization', async () => {
      (mockCI.fsReadFile as ReturnType<typeof vi.fn>).mockResolvedValue(
        new TextEncoder().encode(testCode)
      );

      const result = await compiler.compile('fib_o3.c', 'fib_o3.exe', {
        optimization: 'O3'
      });

      expect(result.success).toBe(true);
      expect(result.compilationTime).toBeLessThan(250); // O3 may take slightly longer
    });
  });

  describe('Executable Size Performance', () => {
    it('should generate reasonably sized executables', async () => {
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

      const result = await compiler.compile('size_test.c', 'size_test.exe');

      expect(result.success).toBe(true);
      expect(result.executable).toBeDefined();
      
      // DOS MZ executable should be reasonably sized
      const executableSize = result.executable!.length;
      expect(executableSize).toBeGreaterThan(28); // Minimum MZ header size
      expect(executableSize).toBeLessThan(10000); // Should not be excessively large for simple program
    });

    it('should track executable size in build messages', async () => {
      const sourceCode = `
#include <stdio.h>

int main() {
    printf("Build message test");
    return 0;
}
`;

      (mockCI.fsReadFile as ReturnType<typeof vi.fn>).mockResolvedValue(
        new TextEncoder().encode(sourceCode)
      );

      await compiler.compile('build_msg.c', 'build_msg.exe');

      const messages = compiler.getBuildMessages();
      const sizeMessage = messages.find(m => m.message.includes('Executable size:'));
      
      expect(sizeMessage).toBeDefined();
      expect(sizeMessage!.message).toMatch(/\d+ bytes/);
    });
  });

  describe('Concurrent Compilation Performance', () => {
    it('should handle multiple compilations efficiently', async () => {
      const sourceCode1 = `
#include <stdio.h>
int main() { printf("Program 1"); return 0; }
`;
      const sourceCode2 = `
#include <stdio.h>
int main() { printf("Program 2"); return 0; }
`;

      (mockCI.fsReadFile as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce(new TextEncoder().encode(sourceCode1))
        .mockResolvedValueOnce(new TextEncoder().encode(sourceCode2));

      const startTime = Date.now();
      
      // Run compilations concurrently
      const [result1, result2] = await Promise.all([
        compiler.compile('prog1.c', 'prog1.exe'),
        compiler.compile('prog2.c', 'prog2.exe')
      ]);
      
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      
      // Concurrent compilation should not take significantly longer than sequential
      expect(totalTime).toBeLessThan(300);
    });
  });

  describe('Performance Metrics Documentation', () => {
    it('should provide compilation time metrics', async () => {
      const sourceCode = `
#include <stdio.h>

int main() {
    printf("Metrics test");
    return 0;
}
`;

      (mockCI.fsReadFile as ReturnType<typeof vi.fn>).mockResolvedValue(
        new TextEncoder().encode(sourceCode)
      );

      const result = await compiler.compile('metrics.c', 'metrics.exe');

      expect(result.success).toBe(true);
      expect(result.compilationTime).toBeDefined();
      expect(typeof result.compilationTime).toBe('number');
      expect(result.compilationTime).toBeGreaterThanOrEqual(0);
      
      // Log performance metrics for documentation
      console.log(`Compilation time: ${result.compilationTime}ms`);
      console.log(`Executable size: ${result.executable?.length || 0} bytes`);
    });
  });
});
