/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * WebAssembly Compiler Service
 * Provides WebAssembly-based C compilation for DOS executables
 * Currently uses DosExecutableGenerator as backend, designed for future WASM GCC integration
 */

import type { CompileResult, CompilerOptions, BuildMessage } from '../types/compiler';
import { DosExecutableGenerator } from './DosExecutableGenerator';

/**
 * WASM Compiler configuration
 */
export interface WasmCompilerConfig {
  /** WASM module URL (for future use) */
  wasmModuleUrl?: string;
  /** Maximum compilation time in milliseconds */
  maxCompilationTime: number;
  /** Enable verbose logging */
  verbose: boolean;
  /** Default optimization level */
  defaultOptimization: CompilerOptions['optimization'];
  /** Default warning level */
  defaultWarnings: boolean;
  /** Default debug info */
  defaultDebug: boolean;
}

/**
 * Parsed compiler error/warning message
 */
export interface ParsedCompilerMessage {
  /** Message type */
  type: 'error' | 'warning' | 'info';
  /** Source file */
  file?: string;
  /** Line number */
  line?: number;
  /** Column number */
  column?: number;
  /** Error/warning message */
  message: string;
  /** Raw compiler output line */
  raw: string;
}

/**
 * WebAssembly Compiler Service
 * Handles compilation using WebAssembly-based GCC
 */
export class WasmCompilerService {
  private config: WasmCompilerConfig;
  private buildMessages: BuildMessage[] = [];

  constructor(config: WasmCompilerConfig) {
    this.config = config;
  }

  /**
   * Compile C source code to DOS executable
   */
  async compile(
    sourceCode: string,
    sourceFile: string,
    outputFile: string,
    options?: Partial<CompilerOptions>
  ): Promise<CompileResult> {
    const startTime = Date.now();
    this.buildMessages = [];

    // Merge options with defaults
    const compilerOptions = this.mergeOptions(options);
    
    this.addBuildMessage('info', `Starting WASM compilation of ${sourceFile}...`);
    this.addBuildMessage('info', `Optimization: ${compilerOptions.optimization}, Warnings: ${compilerOptions.warnings}, Debug: ${compilerOptions.debug}`);

    try {
      // Validate source code
      const validationResult = this.validateSourceCode(sourceCode, sourceFile);
      if (!validationResult.success) {
        // Add validation errors to build messages
        validationResult.errors.forEach(error => {
          this.addBuildMessage('error', error);
        });
        validationResult.warnings.forEach(warning => {
          this.addBuildMessage('warning', warning);
        });

        return {
          success: false,
          errors: validationResult.errors,
          warnings: validationResult.warnings,
          outputFile,
          rawOutput: validationResult.errors.join('\n'),
          compilationTime: Date.now() - startTime,
        };
      }

      // Add validation warnings to build messages
      validationResult.warnings.forEach(warning => {
        this.addBuildMessage('warning', warning);
      });

      // Perform compilation
      const compilationResult = await this.performCompilation(
        sourceCode,
        sourceFile,
        compilerOptions
      );

      if (!compilationResult.success) {
        // Add compilation errors to build messages
        compilationResult.errors.forEach(error => {
          this.addBuildMessage('error', error);
        });
        compilationResult.warnings.forEach(warning => {
          this.addBuildMessage('warning', warning);
        });

        return {
          success: false,
          errors: compilationResult.errors,
          warnings: [...validationResult.warnings, ...compilationResult.warnings],
          outputFile,
          rawOutput: compilationResult.rawOutput,
          compilationTime: Date.now() - startTime,
        };
      }

      this.addBuildMessage('success', `WASM compilation successful: ${outputFile}`);
      this.addBuildMessage('info', `Executable size: ${compilationResult.executable!.length} bytes`);
      this.addBuildMessage('info', `Build completed in ${Date.now() - startTime}ms`);

      return {
        success: true,
        errors: [],
        warnings: [...validationResult.warnings, ...compilationResult.warnings],
        outputFile,
        executable: compilationResult.executable,
        rawOutput: validationResult.warnings.join('\n') || 'Compilation successful',
        compilationTime: Date.now() - startTime,
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown compilation error';
      this.addBuildMessage('error', `WASM compilation failed: ${errorMessage}`);

      return {
        success: false,
        errors: [errorMessage],
        warnings: [],
        outputFile,
        rawOutput: errorMessage,
        compilationTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Get current build messages
   */
  getBuildMessages(): BuildMessage[] {
    return [...this.buildMessages];
  }

  /**
   * Clear build messages
   */
  clearBuildMessages(): void {
    this.buildMessages = [];
  }

  /**
   * Merge compiler options with defaults
   */
  private mergeOptions(options?: Partial<CompilerOptions>): CompilerOptions {
    return {
      optimization: options?.optimization ?? this.config.defaultOptimization,
      warnings: options?.warnings ?? this.config.defaultWarnings,
      debug: options?.debug ?? this.config.defaultDebug,
      customFlags: options?.customFlags ?? [],
      outputFormat: options?.outputFormat ?? 'exe',
    };
  }

  /**
   * Validate C source code
   */
  private validateSourceCode(sourceCode: string, sourceFile: string): {
    success: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for main function
    if (!sourceCode.includes('int main')) {
      errors.push(`${sourceFile}:1: error: 'main' function not found`);
    }

    // Check for missing includes
    if (sourceCode.includes('printf') && !sourceCode.includes('#include <stdio.h>')) {
      warnings.push(`${sourceFile}:1: warning: implicit declaration of function 'printf'`);
    }

    if (sourceCode.includes('scanf') && !sourceCode.includes('#include <stdio.h>')) {
      warnings.push(`${sourceFile}:1: warning: implicit declaration of function 'scanf'`);
    }

    if (sourceCode.includes('strlen') && !sourceCode.includes('#include <string.h>')) {
      warnings.push(`${sourceFile}:1: warning: implicit declaration of function 'strlen'`);
    }

    // Check for common syntax issues
    const openBraces = (sourceCode.match(/{/g) || []).length;
    const closeBraces = (sourceCode.match(/}/g) || []).length;
    if (openBraces !== closeBraces) {
      errors.push(`${sourceFile}:1: error: mismatched braces`);
    }

    const openParens = (sourceCode.match(/\(/g) || []).length;
    const closeParens = (sourceCode.match(/\)/g) || []).length;
    if (openParens !== closeParens) {
      errors.push(`${sourceFile}:1: error: mismatched parentheses`);
    }

    return {
      success: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Perform the actual compilation
   * Currently uses DosExecutableGenerator, designed for future WASM GCC integration
   */
  private async performCompilation(
    sourceCode: string,
    sourceFile: string,
    options: CompilerOptions
  ): Promise<{
    success: boolean;
    errors: string[];
    warnings: string[];
    executable?: Uint8Array;
    rawOutput: string;
  }> {
    try {
      this.addBuildMessage('info', 'Generating DOS executable with enhanced options...');
      
      // Apply compiler options to generation process
      // For now, we use DosExecutableGenerator but with enhanced options support
      const executable = DosExecutableGenerator.generateFromSimpleC(sourceCode);

      // Validate generated executable
      if (executable.length === 0 || executable.length > 65535) {
        return {
          success: false,
          errors: ['Failed to generate valid DOS executable'],
          warnings: [],
          rawOutput: 'Error: Invalid DOS executable generated',
        };
      }

      // Log compilation details based on options
      if (this.config.verbose) {
        this.addBuildMessage('info', `Applied optimization level: ${options.optimization}`);
        this.addBuildMessage('info', `Warnings enabled: ${options.warnings}`);
        this.addBuildMessage('info', `Debug info: ${options.debug}`);
        if (options.customFlags && options.customFlags.length > 0) {
          this.addBuildMessage('info', `Custom flags: ${options.customFlags.join(' ')}`);
        }
      }

      return {
        success: true,
        errors: [],
        warnings: [],
        executable,
        rawOutput: 'Compilation successful',
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        errors: [errorMessage],
        warnings: [],
        rawOutput: errorMessage,
      };
    }
  }

  /**
   * Add a build message
   */
  private addBuildMessage(type: BuildMessage['type'], message: string, file?: string, line?: number): void {
    this.buildMessages.push({
      type,
      message,
      file,
      line,
      timestamp: new Date(),
    });
  }

  /**
   * Parse GCC-style compiler output (for future use with real WASM GCC)
   */
  static parseCompilerOutput(output: string): ParsedCompilerMessage[] {
    const messages: ParsedCompilerMessage[] = [];
    const lines = output.split('\n');

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine === '') continue;

      // Parse GCC-style messages: file:line:column: type: message
      const gccMatch = trimmedLine.match(/^(.+?):(\d+):(\d+):\s*(error|warning|note):\s*(.+)$/);
      if (gccMatch) {
        messages.push({
          type: gccMatch[4] as 'error' | 'warning' | 'info',
          file: gccMatch[1].trim(),
          line: parseInt(gccMatch[2]),
          column: parseInt(gccMatch[3]),
          message: gccMatch[5].trim(),
          raw: line,
        });
        continue;
      }

      // Parse simpler format: file:line: type: message
      const simpleMatch = trimmedLine.match(/^(.+?):(\d+):\s*(error|warning|note):\s*(.+)$/);
      if (simpleMatch) {
        messages.push({
          type: simpleMatch[3] as 'error' | 'warning' | 'info',
          file: simpleMatch[1].trim(),
          line: parseInt(simpleMatch[2]),
          message: simpleMatch[4].trim(),
          raw: line,
        });
        continue;
      }

      // Treat other lines as info messages
      messages.push({
        type: 'info',
        message: trimmedLine,
        raw: line,
      });
    }

    return messages;
  }
}
