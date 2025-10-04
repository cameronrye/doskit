/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * Compiler Service
 * Orchestrates compilation of DOS programs using mock compiler
 * Future: Will support WebAssembly GCC for real compilation
 */

import type { CommandInterface } from '../types/js-dos';
import type { CompileResult, CompilerOptions, BuildMessage } from '../types/compiler';
import { FileSystemService } from './FileSystemService';
import { mockCompilationDelay, realDosCompilerEnabled } from '../config/compiler.config';
import { DosExecutableGenerator } from './DosExecutableGenerator';

/**
 * Service for compiling DOS programs
 */
export class CompilerService {
  private fs: FileSystemService;
  private buildMessages: BuildMessage[] = [];

  constructor(commandInterface: CommandInterface) {
    this.fs = new FileSystemService(commandInterface);
  }

  /**
   * Compile a C source file
   * Supports both mock compiler and real DOS compilation
   */
  async compile(
    sourceFile: string,
    outputFile: string,
    options?: Partial<CompilerOptions>
  ): Promise<CompileResult> {
    const startTime = Date.now();
    this.buildMessages = [];

    this.addBuildMessage('info', `Starting compilation of ${sourceFile}...`);

    try {
      // Use real DOS compiler if enabled (Phase 3 POC)
      if (realDosCompilerEnabled) {
        this.addBuildMessage('info', 'Using real DOS executable generator (Phase 3 POC)');
        return await this.realCompile(sourceFile, outputFile, options);
      }

      // Otherwise use mock compiler (Phase 2)
      this.addBuildMessage('info', 'Using mock compiler (Phase 2)');
      return await this.mockCompile(sourceFile, outputFile, options);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.addBuildMessage('error', `Compilation failed: ${errorMessage}`);

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
   * Mock compiler for MVP - simulates compilation
   * This validates C syntax and creates a mock executable
   */
  private async mockCompile(
    sourceFile: string,
    outputFile: string,
    _options?: Partial<CompilerOptions>
  ): Promise<CompileResult> {
    const startTime = Date.now();

    // Read source file from filesystem
    let sourceCode: string;
    try {
      sourceCode = await this.fs.readTextFile(`/C/PROJECT/${sourceFile}`);
    } catch {
      this.addBuildMessage('error', `Source file not found: ${sourceFile}`);
      return {
        success: false,
        errors: [`Source file not found: ${sourceFile}`],
        warnings: [],
        outputFile,
        rawOutput: `Error: Source file not found: ${sourceFile}`,
        compilationTime: Date.now() - startTime,
      };
    }

    this.addBuildMessage('info', `Compiling ${sourceFile}...`);

    // Simulate compilation delay
    await new Promise(resolve => setTimeout(resolve, mockCompilationDelay));

    // Basic syntax validation
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for common C syntax errors
    if (!sourceCode.includes('int main')) {
      errors.push(`${sourceFile}:1: error: 'main' function not found`);
    }

    // Check for missing includes
    if (sourceCode.includes('printf') && !sourceCode.includes('#include <stdio.h>')) {
      warnings.push(`${sourceFile}:1: warning: implicit declaration of function 'printf'`);
    }

    // Check for unclosed braces
    const openBraces = (sourceCode.match(/{/g) || []).length;
    const closeBraces = (sourceCode.match(/}/g) || []).length;
    if (openBraces !== closeBraces) {
      errors.push(`${sourceFile}:${sourceCode.split('\n').length}: error: expected '}'`);
    }

    // Check for missing semicolons (basic check)
    const lines = sourceCode.split('\n');
    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (trimmed && 
          !trimmed.startsWith('//') && 
          !trimmed.startsWith('/*') &&
          !trimmed.startsWith('#') &&
          !trimmed.endsWith('{') &&
          !trimmed.endsWith('}') &&
          !trimmed.endsWith(';') &&
          trimmed !== '') {
        // This is a very basic check - might have false positives
        if (trimmed.includes('printf') || trimmed.includes('return')) {
          warnings.push(`${sourceFile}:${index + 1}: warning: statement may be missing semicolon`);
        }
      }
    });

    // Add warnings to build messages
    warnings.forEach(warning => {
      this.addBuildMessage('warning', warning);
    });

    // Add errors to build messages
    errors.forEach(error => {
      this.addBuildMessage('error', error);
    });

    if (errors.length > 0) {
      this.addBuildMessage('error', 'Compilation failed.');
      return {
        success: false,
        errors,
        warnings,
        outputFile,
        rawOutput: [...warnings, ...errors].join('\n'),
        compilationTime: Date.now() - startTime,
      };
    }

    // Create mock executable
    const mockExecutable = this.createMockExecutable(sourceCode);
    
    // Write executable to filesystem
    await this.fs.writeBinaryFile(`/C/PROJECT/${outputFile}`, mockExecutable);

    this.addBuildMessage('success', `Compilation successful: ${outputFile}`);
    this.addBuildMessage('info', `Build completed in ${Date.now() - startTime}ms`);

    return {
      success: true,
      errors: [],
      warnings,
      outputFile,
      executable: mockExecutable,
      rawOutput: warnings.join('\n') || 'Compilation successful',
      compilationTime: Date.now() - startTime,
    };
  }



  /**
   * Real DOS compilation using DOS Executable Generator
   * This is the proof-of-concept implementation for Phase 3
   */
  private async realCompile(
    sourceFile: string,
    outputFile: string,
    _options?: Partial<CompilerOptions>
  ): Promise<CompileResult> {
    const startTime = Date.now();

    // Read source file from filesystem
    let sourceCode: string;
    try {
      sourceCode = await this.fs.readTextFile(`/C/PROJECT/${sourceFile}`);
    } catch {
      this.addBuildMessage('error', `Source file not found: ${sourceFile}`);
      return {
        success: false,
        errors: [`Source file not found: ${sourceFile}`],
        warnings: [],
        outputFile,
        rawOutput: `Error: Source file not found: ${sourceFile}`,
        compilationTime: Date.now() - startTime,
      };
    }

    this.addBuildMessage('info', `Compiling ${sourceFile} with DOS Executable Generator...`);

    // Basic syntax validation
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for common C syntax errors
    if (!sourceCode.includes('int main')) {
      errors.push(`${sourceFile}:1: error: 'main' function not found`);
    }

    // Check for missing includes
    if (sourceCode.includes('printf') && !sourceCode.includes('#include <stdio.h>')) {
      warnings.push(`${sourceFile}:1: warning: implicit declaration of function 'printf'`);
    }

    // Add warnings to build messages
    warnings.forEach(warning => {
      this.addBuildMessage('warning', warning);
    });

    // If there are errors, fail compilation
    if (errors.length > 0) {
      errors.forEach(error => {
        this.addBuildMessage('error', error);
      });

      return {
        success: false,
        errors,
        warnings,
        outputFile,
        rawOutput: errors.join('\n'),
        compilationTime: Date.now() - startTime,
      };
    }

    // Generate real DOS executable (MZ format)
    this.addBuildMessage('info', 'Generating DOS MZ executable...');
    const executable = DosExecutableGenerator.generateFromSimpleC(sourceCode);

    // Validate generated executable
    if (executable.length === 0 || executable.length > 65535) {
      this.addBuildMessage('error', 'Failed to generate valid DOS executable');
      return {
        success: false,
        errors: ['Failed to generate valid DOS executable'],
        warnings,
        outputFile,
        rawOutput: 'Error: Invalid DOS executable generated',
        compilationTime: Date.now() - startTime,
      };
    }

    // Write executable to filesystem
    // Note: Create a copy because fsWriteFile may transfer the ArrayBuffer
    const executableCopy = new Uint8Array(executable);
    const filePath = `/C/PROJECT/${outputFile}`;
    await this.fs.writeBinaryFile(filePath, executableCopy);

    this.addBuildMessage('success', `Real DOS compilation successful: ${outputFile}`);
    this.addBuildMessage('info', `Executable size: ${executable.length} bytes`);
    this.addBuildMessage('info', `Build completed in ${Date.now() - startTime}ms`);

    return {
      success: true,
      errors: [],
      warnings,
      outputFile,
      executable,
      rawOutput: warnings.join('\n') || 'Compilation successful',
      compilationTime: Date.now() - startTime,
    };
  }

  /**
   * Create a mock DOS executable
   * This creates a simple DOS .COM file that displays the program output
   */
  private createMockExecutable(sourceCode: string): Uint8Array {
    // Extract printf statements to simulate output
    const printfRegex = /printf\s*\(\s*"([^"]*)"/g;
    const outputs: string[] = [];
    let match;

    while ((match = printfRegex.exec(sourceCode)) !== null) {
      outputs.push(match[1]);
    }

    // Create a simple DOS .COM file structure
    // This is a mock - real DOS executables would be created by WebAssembly GCC
    const header = new Uint8Array([
      0x4D, 0x5A, // MZ signature
      0x90, 0x00, // Bytes on last page
      0x03, 0x00, // Pages in file
      0x00, 0x00, // Relocations
      0x04, 0x00, // Size of header in paragraphs
      0x00, 0x00, // Minimum extra paragraphs
      0xFF, 0xFF, // Maximum extra paragraphs
    ]);

    // For MVP, just create a minimal executable marker
    // In production, this would be the actual compiled binary from WebAssembly GCC
    const mockData = new TextEncoder().encode(
      `MOCK_EXECUTABLE\n${outputs.join('\n')}\n`
    );

    const executable = new Uint8Array(header.length + mockData.length);
    executable.set(header, 0);
    executable.set(mockData, header.length);

    return executable;
  }

  /**
   * Add a build message
   */
  private addBuildMessage(type: BuildMessage['type'], message: string): void {
    this.buildMessages.push({
      type,
      message,
      timestamp: new Date(),
    });
  }

  /**
   * Get all build messages
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
}

