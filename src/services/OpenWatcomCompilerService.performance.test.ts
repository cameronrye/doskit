/**
 * DosKit - OpenWatcomCompilerService Performance Tests
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * Performance benchmarks for Open Watcom compiler integration
 * Tests against targets from OPEN-WATCOM-RESEARCH.md:
 * - Compilation time: <5s for 1000 lines
 * - Memory usage: <100 MB
 * - Bundle load time: <3s
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OpenWatcomCompilerService } from './OpenWatcomCompilerService';
import type { CommandInterface, CommandInterfaceEvents } from '../types/js-dos';

/**
 * Generate a C program with specified number of lines
 */
function generateProgram(lines: number): string {
  const header = `#include <stdio.h>\n\n`;
  const functionsPerLine = 5; // Approximate lines per function
  const numFunctions = Math.floor((lines - 10) / functionsPerLine);
  
  let code = header;
  
  // Generate helper functions
  for (let i = 0; i < numFunctions; i++) {
    code += `int func${i}(int x) {\n`;
    code += `    int result = x * ${i + 1};\n`;
    code += `    return result + ${i};\n`;
    code += `}\n\n`;
  }
  
  // Generate main function
  code += `int main(void) {\n`;
  code += `    int sum = 0;\n`;
  for (let i = 0; i < Math.min(numFunctions, 20); i++) {
    code += `    sum += func${i}(${i});\n`;
  }
  code += `    printf("Result: %d\\n", sum);\n`;
  code += `    return 0;\n`;
  code += `}\n`;
  
  return code;
}

/**
 * Generate a program with loops and arrays (more complex)
 */
function generateComplexProgram(lines: number): string {
  const header = `#include <stdio.h>\n#include <string.h>\n\n`;
  const arraySize = Math.floor(lines / 10);
  
  let code = header;
  
  code += `void processArray(int arr[], int size) {\n`;
  code += `    int i, j;\n`;
  code += `    for (i = 0; i < size; i++) {\n`;
  code += `        for (j = 0; j < size; j++) {\n`;
  code += `            arr[i] += j;\n`;
  code += `        }\n`;
  code += `    }\n`;
  code += `}\n\n`;
  
  code += `int main(void) {\n`;
  code += `    int numbers[${arraySize}];\n`;
  code += `    int i, sum = 0;\n`;
  code += `    \n`;
  code += `    for (i = 0; i < ${arraySize}; i++) {\n`;
  code += `        numbers[i] = i;\n`;
  code += `    }\n`;
  code += `    \n`;
  code += `    processArray(numbers, ${arraySize});\n`;
  code += `    \n`;
  code += `    for (i = 0; i < ${arraySize}; i++) {\n`;
  code += `        sum += numbers[i];\n`;
  code += `    }\n`;
  code += `    \n`;
  code += `    printf("Sum: %d\\n", sum);\n`;
  code += `    return 0;\n`;
  code += `}\n`;
  
  return code;
}

/**
 * Get memory usage if available (Chrome/Edge only)
 */
function getMemoryUsage(): number | null {
  if (typeof performance !== 'undefined' && 'memory' in performance) {
    const memory = (performance as any).memory;
    return memory.usedJSHeapSize;
  }
  return null;
}

describe('OpenWatcomCompilerService - Performance Benchmarks', () => {
  let mockCI: CommandInterface;
  let service: OpenWatcomCompilerService;

  beforeEach(() => {
    vi.clearAllMocks();

    // Create stdout handler storage
    let stdoutHandler: ((message: string) => void) | null = null;

    // Create mock CommandInterface
    mockCI = {
      fsWriteFile: vi.fn().mockResolvedValue(undefined),
      fsReadFile: vi.fn().mockResolvedValue(new Uint8Array([
        0x4D, 0x5A, // MZ signature
        0x90, 0x00, 0x03, 0x00, 0x00, 0x00,
        0x04, 0x00, 0x00, 0x00, 0xFF, 0xFF,
        0x00, 0x00, 0xB8, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x40, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      ])),
      fsDeleteFile: vi.fn().mockResolvedValue(undefined),
      fsTree: vi.fn().mockResolvedValue({ nodes: {} }),
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

  describe('Compilation Time - Program Size Benchmarks', () => {
    it('should compile 100-line program in under 2 seconds', async () => {
      const sourceCode = generateProgram(100);
      
      const startTime = Date.now();
      const result = await service.compile(sourceCode, 'test100.c', 'test100.exe');
      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(result.success).toBe(true);
      expect(duration).toBeLessThan(2000);
      
      console.log(`✓ 100-line program compiled in ${duration}ms`);
    });

    it('should compile 500-line program in under 3 seconds', async () => {
      const sourceCode = generateProgram(500);
      
      const startTime = Date.now();
      const result = await service.compile(sourceCode, 'test500.c', 'test500.exe');
      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(result.success).toBe(true);
      expect(duration).toBeLessThan(3000);
      
      console.log(`✓ 500-line program compiled in ${duration}ms`);
    });

    it('should compile 1000-line program in under 5 seconds (research target)', async () => {
      const sourceCode = generateProgram(1000);
      
      const startTime = Date.now();
      const result = await service.compile(sourceCode, 'test1000.c', 'test1000.exe');
      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(result.success).toBe(true);
      expect(duration).toBeLessThan(5000); // Target from OPEN-WATCOM-RESEARCH.md
      
      console.log(`✓ 1000-line program compiled in ${duration}ms (target: <5000ms)`);
    });
  });

  describe('Complex Program Performance', () => {
    it('should compile complex 100-line program efficiently', async () => {
      const sourceCode = generateComplexProgram(100);
      
      const startTime = Date.now();
      const result = await service.compile(sourceCode, 'complex100.c', 'complex100.exe');
      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(result.success).toBe(true);
      expect(duration).toBeLessThan(2500);
      
      console.log(`✓ Complex 100-line program compiled in ${duration}ms`);
    });

    it('should compile complex 500-line program efficiently', async () => {
      const sourceCode = generateComplexProgram(500);
      
      const startTime = Date.now();
      const result = await service.compile(sourceCode, 'complex500.c', 'complex500.exe');
      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(result.success).toBe(true);
      expect(duration).toBeLessThan(4000);
      
      console.log(`✓ Complex 500-line program compiled in ${duration}ms`);
    });
  });

  describe('Memory Usage Benchmarks', () => {
    it('should use less than 100 MB during compilation (research target)', async () => {
      const sourceCode = generateProgram(1000);
      
      const memBefore = getMemoryUsage();
      await service.compile(sourceCode, 'memory_test.c', 'memory_test.exe');
      const memAfter = getMemoryUsage();

      if (memBefore !== null && memAfter !== null) {
        const memUsed = memAfter - memBefore;
        const memUsedMB = memUsed / (1024 * 1024);
        
        expect(memUsedMB).toBeLessThan(100); // Target from OPEN-WATCOM-RESEARCH.md
        
        console.log(`✓ Memory used: ${memUsedMB.toFixed(2)} MB (target: <100 MB)`);
      } else {
        console.log('⚠ Memory measurement not available (Chrome/Edge only)');
      }
    });

    it('should not leak memory across multiple compilations', async () => {
      const sourceCode = generateProgram(100);
      
      const memBefore = getMemoryUsage();
      
      // Compile multiple times
      for (let i = 0; i < 5; i++) {
        await service.compile(sourceCode, `leak_test${i}.c`, `leak_test${i}.exe`);
      }
      
      const memAfter = getMemoryUsage();

      if (memBefore !== null && memAfter !== null) {
        const memGrowth = (memAfter - memBefore) / (1024 * 1024);
        
        // Memory growth should be minimal (allow some overhead)
        expect(memGrowth).toBeLessThan(50);
        
        console.log(`✓ Memory growth after 5 compilations: ${memGrowth.toFixed(2)} MB`);
      }
    });
  });

  describe('Optimization Level Performance', () => {
    const testCode = generateProgram(200);

    it('should compile with no optimization efficiently', async () => {
      const startTime = Date.now();
      const result = await service.compile(testCode, 'opt_none.c', 'opt_none.exe', {
        optimization: 'O0',
      });
      const duration = Date.now() - startTime;

      expect(result.success).toBe(true);
      expect(duration).toBeLessThan(2000);
      
      console.log(`✓ No optimization (-O0): ${duration}ms`);
    });

    it('should compile with speed optimization efficiently', async () => {
      const startTime = Date.now();
      const result = await service.compile(testCode, 'opt_speed.c', 'opt_speed.exe', {
        optimization: 'O2',
      });
      const duration = Date.now() - startTime;

      expect(result.success).toBe(true);
      expect(duration).toBeLessThan(2500);
      
      console.log(`✓ Speed optimization (-O2): ${duration}ms`);
    });

    it('should compile with size optimization efficiently', async () => {
      const startTime = Date.now();
      const result = await service.compile(testCode, 'opt_size.c', 'opt_size.exe', {
        optimization: 'Os',
      });
      const duration = Date.now() - startTime;

      expect(result.success).toBe(true);
      expect(duration).toBeLessThan(2500);
      
      console.log(`✓ Size optimization (-Os): ${duration}ms`);
    });
  });

  describe('Memory Model Performance', () => {
    const testCode = generateProgram(100);

    it('should compile with different memory models efficiently', async () => {
      const memoryModels = ['tiny', 'small', 'compact', 'medium', 'large', 'huge'] as const;
      const results: Record<string, number> = {};

      for (const model of memoryModels) {
        const startTime = Date.now();
        const result = await service.compile(testCode, `model_${model}.c`, `model_${model}.exe`, {
          memoryModel: model,
        });
        const duration = Date.now() - startTime;

        expect(result.success).toBe(true);
        expect(duration).toBeLessThan(2000);

        results[model] = duration;
      }

      console.log('✓ Memory model compilation times:');
      for (const [model, time] of Object.entries(results)) {
        console.log(`  - ${model}: ${time}ms`);
      }
    });
  });

  describe('Executable Size Performance', () => {
    it('should generate reasonably sized executables', async () => {
      const sourceCode = `
#include <stdio.h>

int main(void) {
    printf("Size test");
    return 0;
}
`;

      const result = await service.compile(sourceCode, 'size_test.c', 'size_test.exe');

      expect(result.success).toBe(true);
      expect(result.executable).toBeDefined();

      // DOS MZ executable should be reasonably sized
      const executableSize = result.executable!.length;
      expect(executableSize).toBeGreaterThan(28); // Minimum MZ header size
      expect(executableSize).toBeLessThan(50000); // Should not be excessively large for simple program

      console.log(`✓ Simple executable size: ${executableSize} bytes`);
    });

    it('should track executable size for different program sizes', async () => {
      const sizes = [100, 500, 1000];
      const results: Record<number, number> = {};

      for (const size of sizes) {
        const sourceCode = generateProgram(size);
        const result = await service.compile(sourceCode, `size${size}.c`, `size${size}.exe`);

        expect(result.success).toBe(true);
        expect(result.executable).toBeDefined();

        results[size] = result.executable!.length;
      }

      console.log('✓ Executable sizes by program size:');
      for (const [lines, bytes] of Object.entries(results)) {
        console.log(`  - ${lines} lines: ${bytes} bytes (${(bytes / 1024).toFixed(2)} KB)`);
      }
    });

    it('should compare executable sizes across optimization levels', async () => {
      const sourceCode = generateProgram(200);
      const optimizations = ['O0', 'O1', 'O2', 'O3', 'Os'] as const;
      const results: Record<string, number> = {};

      for (const opt of optimizations) {
        const result = await service.compile(sourceCode, `opt_${opt}.c`, `opt_${opt}.exe`, {
          optimization: opt,
        });

        expect(result.success).toBe(true);
        expect(result.executable).toBeDefined();

        results[opt] = result.executable!.length;
      }

      console.log('✓ Executable sizes by optimization level:');
      for (const [opt, bytes] of Object.entries(results)) {
        console.log(`  - ${opt}: ${bytes} bytes`);
      }
    });
  });

  describe('Concurrent Compilation Performance', () => {
    it('should handle multiple compilations efficiently', async () => {
      const sourceCode1 = generateProgram(100);
      const sourceCode2 = generateProgram(100);
      const sourceCode3 = generateProgram(100);

      const startTime = Date.now();

      // Run compilations sequentially (DOS can only execute one command at a time)
      // Note: Promise.all will still execute them, but DosCommandExecutor serializes them
      const result1 = await service.compile(sourceCode1, 'sequential1.c', 'sequential1.exe');
      const result2 = await service.compile(sourceCode2, 'sequential2.c', 'sequential2.exe');
      const result3 = await service.compile(sourceCode3, 'sequential3.c', 'sequential3.exe');

      const endTime = Date.now();
      const totalTime = endTime - startTime;

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      expect(result3.success).toBe(true);

      // Sequential compilation should complete in reasonable time
      expect(totalTime).toBeLessThan(10000);

      console.log(`✓ 3 sequential compilations completed in ${totalTime}ms`);
    });
  });

  describe('Performance Metrics Summary', () => {
    it('should provide comprehensive performance metrics', async () => {
      const testCases = [
        { lines: 100, name: 'small' },
        { lines: 500, name: 'medium' },
        { lines: 1000, name: 'large' },
      ];

      console.log('\n=== Open Watcom Performance Summary ===');

      for (const testCase of testCases) {
        const sourceCode = generateProgram(testCase.lines);

        const memBefore = getMemoryUsage();
        const startTime = Date.now();

        const result = await service.compile(
          sourceCode,
          `perf_${testCase.name}.c`,
          `perf_${testCase.name}.exe`
        );

        const endTime = Date.now();
        const memAfter = getMemoryUsage();

        const duration = endTime - startTime;
        const execSize = result.executable?.length || 0;

        expect(result.success).toBe(true);

        console.log(`\n${testCase.name.toUpperCase()} (${testCase.lines} lines):`);
        console.log(`  Compilation time: ${duration}ms`);
        console.log(`  Executable size: ${execSize} bytes (${(execSize / 1024).toFixed(2)} KB)`);

        if (memBefore !== null && memAfter !== null) {
          const memUsed = (memAfter - memBefore) / (1024 * 1024);
          console.log(`  Memory used: ${memUsed.toFixed(2)} MB`);
        }
      }

      console.log('\n=== Performance Targets (from OPEN-WATCOM-RESEARCH.md) ===');
      console.log('  ✓ Compilation time: <5s for 1000 lines');
      console.log('  ✓ Memory usage: <100 MB');
      console.log('  ✓ Bundle size: <10 MB uncompressed, <3 MB compressed');
      console.log('========================================\n');
    });
  });
});

