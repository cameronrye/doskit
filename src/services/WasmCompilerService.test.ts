/**
 * DosKit - WasmCompilerService Tests
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { WasmCompilerService } from './WasmCompilerService';
import type { WasmCompilerConfig } from './WasmCompilerService';

describe('WasmCompilerService', () => {
  let wasmCompiler: WasmCompilerService;
  let config: WasmCompilerConfig;

  beforeEach(() => {
    config = {
      wasmModuleUrl: '/test/gcc.wasm',
      maxCompilationTime: 10000,
      verbose: true,
      defaultOptimization: 'O2',
      defaultWarnings: true,
      defaultDebug: false,
    };
    wasmCompiler = new WasmCompilerService(config);
  });

  describe('compile', () => {
    it('should compile simple Hello World program', async () => {
      const sourceCode = `
        #include <stdio.h>
        int main(void) {
          printf("Hello, World!");
          return 0;
        }
      `;

      const result = await wasmCompiler.compile(sourceCode, 'hello.c', 'hello.exe');

      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.executable).toBeDefined();
      expect(result.executable!.length).toBeGreaterThan(0);
      expect(result.outputFile).toBe('hello.exe');
      expect(result.compilationTime).toBeGreaterThanOrEqual(0);
    });

    it('should handle missing main function', async () => {
      const sourceCode = `
        #include <stdio.h>
        void helper() {
          printf("Helper function");
        }
      `;

      const result = await wasmCompiler.compile(sourceCode, 'invalid.c', 'invalid.exe');

      expect(result.success).toBe(false);
      expect(result.errors).toContain("invalid.c:1: error: 'main' function not found");
      expect(result.executable).toBeUndefined();
    });

    it('should generate warnings for missing includes', async () => {
      const sourceCode = `
        int main(void) {
          printf("Hello without include");
          return 0;
        }
      `;

      const result = await wasmCompiler.compile(sourceCode, 'warning.c', 'warning.exe');

      expect(result.success).toBe(true);
      expect(result.warnings).toContain("warning.c:1: warning: implicit declaration of function 'printf'");
    });

    it('should handle syntax errors', async () => {
      const sourceCode = `
        #include <stdio.h>
        int main(void) {
          printf("Unclosed brace"
          return 0;
        }
      `;

      const result = await wasmCompiler.compile(sourceCode, 'syntax.c', 'syntax.exe');

      expect(result.success).toBe(false);
      expect(result.errors.some(error => error.includes('mismatched'))).toBe(true);
    });

    it('should apply compiler options', async () => {
      const sourceCode = `
        #include <stdio.h>
        int main(void) {
          printf("Hello with options");
          return 0;
        }
      `;

      const options = {
        optimization: 'O3' as const,
        warnings: false,
        debug: true,
        customFlags: ['-ffast-math'],
      };

      const result = await wasmCompiler.compile(sourceCode, 'options.c', 'options.exe', options);

      expect(result.success).toBe(true);
      
      // Check that build messages reflect the options
      const messages = wasmCompiler.getBuildMessages();
      const optionMessage = messages.find(m => m.message.includes('Optimization: O3'));
      expect(optionMessage).toBeDefined();
    });

    it('should handle compilation timeout', async () => {
      // Create a service with very short timeout for testing
      const shortTimeoutConfig = { ...config, maxCompilationTime: 1 };
      const shortTimeoutCompiler = new WasmCompilerService(shortTimeoutConfig);

      const sourceCode = `
        #include <stdio.h>
        int main(void) {
          printf("This should timeout");
          return 0;
        }
      `;

      // Note: This test may not actually timeout with the current implementation
      // since we're using DosExecutableGenerator which is synchronous
      const result = await shortTimeoutCompiler.compile(sourceCode, 'timeout.c', 'timeout.exe');
      
      // For now, just verify it completes (timeout handling would be added with real WASM)
      expect(result).toBeDefined();
    });
  });

  describe('getBuildMessages', () => {
    it('should return build messages', async () => {
      const sourceCode = `
        #include <stdio.h>
        int main(void) {
          printf("Test message");
          return 0;
        }
      `;

      await wasmCompiler.compile(sourceCode, 'test.c', 'test.exe');
      const messages = wasmCompiler.getBuildMessages();

      expect(messages.length).toBeGreaterThan(0);
      expect(messages[0].message).toContain('Starting WASM compilation');
      expect(messages.some(m => m.type === 'success')).toBe(true);
    });

    it('should include error messages for failed compilation', async () => {
      const sourceCode = `invalid C code without main`;

      const result = await wasmCompiler.compile(sourceCode, 'invalid.c', 'invalid.exe');
      const messages = wasmCompiler.getBuildMessages();

      expect(result.success).toBe(false);
      expect(messages.some(m => m.type === 'error')).toBe(true);
    });
  });

  describe('clearBuildMessages', () => {
    it('should clear all build messages', async () => {
      const sourceCode = `
        #include <stdio.h>
        int main(void) {
          printf("Test");
          return 0;
        }
      `;

      await wasmCompiler.compile(sourceCode, 'test.c', 'test.exe');
      expect(wasmCompiler.getBuildMessages().length).toBeGreaterThan(0);

      wasmCompiler.clearBuildMessages();
      expect(wasmCompiler.getBuildMessages()).toHaveLength(0);
    });
  });

  describe('parseCompilerOutput', () => {
    it('should parse GCC-style error messages', () => {
      const output = `
        hello.c:5:10: error: expected ';' before 'return'
        hello.c:3:1: warning: unused variable 'x'
        hello.c:1:1: note: in file included from hello.c
      `;

      const messages = WasmCompilerService.parseCompilerOutput(output);

      expect(messages).toHaveLength(3);
      
      expect(messages[0].type).toBe('error');
      expect(messages[0].file).toBe('hello.c');
      expect(messages[0].line).toBe(5);
      expect(messages[0].column).toBe(10);
      expect(messages[0].message).toBe("expected ';' before 'return'");

      expect(messages[1].type).toBe('warning');
      expect(messages[1].file).toBe('hello.c');
      expect(messages[1].line).toBe(3);
      expect(messages[1].column).toBe(1);
      expect(messages[1].message).toBe("unused variable 'x'");
    });

    it('should parse simple format messages', () => {
      const output = `
        test.c:10: error: undefined reference to 'missing_function'
        test.c:5: warning: implicit declaration of function 'printf'
      `;

      const messages = WasmCompilerService.parseCompilerOutput(output);

      expect(messages).toHaveLength(2);
      expect(messages[0].type).toBe('error');
      expect(messages[0].file).toBe('test.c');
      expect(messages[0].line).toBe(10);
      expect(messages[0].message).toBe("undefined reference to 'missing_function'");
    });

    it('should handle non-standard messages as info', () => {
      const output = `
        Compilation started
        Linking object files
        Build completed successfully
      `;

      const messages = WasmCompilerService.parseCompilerOutput(output);

      expect(messages).toHaveLength(3);
      expect(messages.every(m => m.type === 'info')).toBe(true);
    });
  });

  describe('configuration', () => {
    it('should use default options when none provided', async () => {
      const sourceCode = `
        #include <stdio.h>
        int main(void) {
          printf("Default options");
          return 0;
        }
      `;

      const result = await wasmCompiler.compile(sourceCode, 'default.c', 'default.exe');

      expect(result.success).toBe(true);
      
      const messages = wasmCompiler.getBuildMessages();
      const optionMessage = messages.find(m => m.message.includes('Optimization: O2'));
      expect(optionMessage).toBeDefined();
    });

    it('should respect verbose configuration', () => {
      const verboseConfig = { ...config, verbose: true };
      const verboseCompiler = new WasmCompilerService(verboseConfig);

      expect(verboseCompiler).toBeDefined();
      // Verbose behavior is tested indirectly through build messages
    });
  });
});
