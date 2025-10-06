/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * Open Watcom Compiler Service
 * Implements real C compilation using Open Watcom C/C++ compiler in js-dos
 */

import type { CommandInterface } from '../types/js-dos';
import type { CompileResult, CompilerOptions, BuildMessage } from '../types/compiler';
import { FileSystemService } from './FileSystemService';
import { OpenWatcomErrorParser } from './OpenWatcomErrorParser';
import { DosCommandExecutor } from './DosCommandExecutor';
import { BatchFileGenerator, type CompileBatchParams, type LinkBatchParams } from './BatchFileGenerator';

/**
 * Open Watcom compiler configuration
 */
export interface OpenWatcomConfig {
  /** Path to Open Watcom installation in DOS filesystem */
  watcomPath: string;
  /** Path to compiler binary (wcc.exe for 16-bit) */
  compilerBin: string;
  /** Path to linker binary (wlink.exe) */
  linkerBin: string;
  /** Path to headers directory */
  includePath: string;
  /** Path to libraries directory */
  libPath: string;
  /** Temporary directory for compilation */
  tempPath: string;
  /** Output directory for executables */
  outputPath: string;
  /** Maximum compilation time in milliseconds */
  maxCompilationTime: number;
  /** Enable verbose logging */
  verbose: boolean;
}

/**
 * Default Open Watcom configuration
 */
export const defaultOpenWatcomConfig: OpenWatcomConfig = {
  watcomPath: 'C:\\WATCOM',
  compilerBin: 'C:\\WATCOM\\BINW\\WCC.EXE',
  linkerBin: 'C:\\WATCOM\\BINW\\WLINK.EXE',
  includePath: 'C:\\WATCOM\\H',
  libPath: 'C:\\WATCOM\\LIB286\\DOS',
  tempPath: 'C:\\TEMP',
  outputPath: 'C:\\OUTPUT',
  maxCompilationTime: 30000, // 30 seconds
  verbose: true,
};

/**
 * Open Watcom memory models
 */
export type MemoryModel = 'tiny' | 'small' | 'compact' | 'medium' | 'large' | 'huge';

/**
 * Open Watcom specific compiler options
 */
export interface OpenWatcomOptions extends Partial<CompilerOptions> {
  /** Memory model (default: small) */
  memoryModel?: MemoryModel;
  /** Open Watcom optimization flags */
  watcomOptimizations?: string[];
  /** Warning level (0-4, default: 4) */
  warningLevel?: number;
  /** Treat warnings as errors */
  warningsAsErrors?: boolean;
}

/**
 * Compilation progress event
 */
export interface CompilationProgress {
  /** Current step */
  step: 'initializing' | 'writing' | 'compiling' | 'linking' | 'reading' | 'complete' | 'error';
  /** Progress percentage (0-100) */
  progress: number;
  /** Current file being processed */
  currentFile?: string;
  /** Status message */
  message: string;
}

/**
 * Progress callback function
 */
export type ProgressCallback = (progress: CompilationProgress) => void;

/**
 * Service for compiling C code using Open Watcom compiler in js-dos
 */
export class OpenWatcomCompilerService {
  private fs: FileSystemService;
  private config: OpenWatcomConfig;
  private buildMessages: BuildMessage[] = [];
  private compilerOutput: string = '';
  private progressCallback?: ProgressCallback;
  private abortController?: AbortController;
  private dosExecutor: DosCommandExecutor;

  constructor(
    commandInterface: CommandInterface,
    config: Partial<OpenWatcomConfig> = {}
  ) {
    this.fs = new FileSystemService(commandInterface);
    this.config = { ...defaultOpenWatcomConfig, ...config };
    this.dosExecutor = new DosCommandExecutor(commandInterface);
  }

  /**
   * Set progress callback for compilation progress updates
   *
   * @param callback - Function to call with progress updates, or undefined to disable
   * @example
   * ```typescript
   * compiler.setProgressCallback((progress) => {
   *   console.log(`${progress.step}: ${progress.progress}%`);
   * });
   * ```
   */
  setProgressCallback(callback: ProgressCallback | undefined): void {
    this.progressCallback = callback;
  }

  /**
   * Cancel ongoing compilation
   *
   * Aborts the current compilation process if one is running.
   * The compile() method will throw an error with message "Compilation cancelled".
   *
   * @example
   * ```typescript
   * const compilePromise = compiler.compile(source, 'test.c', 'test.exe');
   * // Later...
   * compiler.cancel();
   * ```
   */
  cancel(): void {
    if (this.abortController) {
      this.abortController.abort();
    }
  }

  /**
   * Compile C source code to DOS executable using Open Watcom
   *
   * This method performs the complete compilation workflow:
   * 1. Creates necessary directories
   * 2. Writes source file to DOS filesystem
   * 3. Compiles source to object file using wcc.exe
   * 4. Links object file to executable using wlink.exe
   * 5. Reads compiled executable
   * 6. Parses compiler output for errors/warnings
   *
   * @param sourceCode - C source code to compile
   * @param sourceFile - Name of source file (e.g., 'hello.c')
   * @param outputFile - Name of output executable (e.g., 'hello.exe')
   * @param options - Optional compiler options (memory model, optimization, etc.)
   * @returns Promise resolving to compilation result
   *
   * @example
   * ```typescript
   * const result = await compiler.compile(
   *   '#include <stdio.h>\nint main() { printf("Hello!\\n"); return 0; }',
   *   'hello.c',
   *   'hello.exe',
   *   { memoryModel: 'small', optimization: 'O2' }
   * );
   *
   * if (result.success) {
   *   console.log('Compilation successful!');
   *   console.log('Executable size:', result.executable?.length);
   * } else {
   *   console.error('Errors:', result.errors);
   * }
   * ```
   */
  async compile(
    sourceCode: string,
    sourceFile: string,
    outputFile: string,
    options?: OpenWatcomOptions
  ): Promise<CompileResult> {
    // Use filesystem-based compilation (keyboard simulation doesn't work when DOS window is hidden)
    return this.compileViaFilesystem(sourceCode, sourceFile, outputFile, options);
  }

  /**
   * Filesystem-based compilation (no keyboard simulation required)
   *
   * This method prepares compilation files and provides instructions for manual execution.
   * It's used when keyboard simulation isn't available (e.g., DOS window hidden).
   *
   * Workflow:
   * 1. Write source file to C:\TEMP\
   * 2. Generate compilation batch file
   * 3. Write batch file to C:\TEMP\COMPILE.BAT
   * 4. Return instructions for user to run the batch file
   * 5. User can then call checkCompilationResult() to retrieve the executable
   */
  private async compileViaFilesystem(
    sourceCode: string,
    sourceFile: string,
    outputFile: string,
    options?: OpenWatcomOptions
  ): Promise<CompileResult> {
    const startTime = Date.now();
    this.buildMessages = [];
    this.compilerOutput = '';

    this.addBuildMessage('info', `Preparing compilation of ${sourceFile}...`);
    this.addBuildMessage('info', 'Using filesystem-based compilation (keyboard simulation not available)');
    this.reportProgress('initializing', 0, sourceFile, 'Preparing compilation...');

    try {
      // Step 1: Ensure directories exist
      this.reportProgress('initializing', 10, sourceFile, 'Creating directories...');
      await this.ensureDirectories();

      // Step 2: Write source file to temp directory
      this.reportProgress('writing', 20, sourceFile, `Writing source file: ${sourceFile}`);
      const sourcePath = `${this.config.tempPath}\\${sourceFile}`;
      await this.fs.writeTextFile(sourcePath, sourceCode);
      this.addBuildMessage('info', `Source file written: ${sourcePath}`);

      // Step 3: Generate compilation batch file
      this.reportProgress('compiling', 30, sourceFile, 'Generating batch file...');
      const objFile = sourceFile.replace(/\.(c|cpp)$/i, '.OBJ');
      const compilerFlags = this.buildCompilerFlags(options);
      const flagsStr = Array.isArray(compilerFlags) ? compilerFlags.join(' ') : compilerFlags;

      const batchContent = `@echo off
SET WATCOM=${this.config.watcomPath}
SET PATH=%WATCOM%\\BINW;%PATH%
SET INCLUDE=%WATCOM%\\H
SET LIB=%WATCOM%\\LIB286\\DOS

echo.
echo ========================================
echo   DosKit - Open Watcom Compiler
echo ========================================
echo.
echo Compiling: ${sourceFile}
echo Output: ${outputFile}
echo.

REM Compile source to object file
echo [1/2] Compiling...
${this.config.compilerBin} ${sourcePath} -FO=${this.config.tempPath}\\${objFile} ${flagsStr} 2>&1
if errorlevel 1 goto compile_error

REM Link object file to executable
echo [2/2] Linking...
${this.config.linkerBin} FILE ${this.config.tempPath}\\${objFile} NAME ${this.config.outputPath}\\${outputFile} SYSTEM DOS 2>&1
if errorlevel 1 goto link_error

REM Success
echo.
echo SUCCESS > ${this.config.tempPath}\\STATUS.TXT
echo ========================================
echo   Compilation Successful!
echo ========================================
echo.
echo Executable: ${this.config.outputPath}\\${outputFile}
echo.
goto end

:compile_error
echo COMPILE_ERROR > ${this.config.tempPath}\\STATUS.TXT
echo.
echo ========================================
echo   Compilation Failed!
echo ========================================
echo.
echo Check the error messages above.
echo.
goto end

:link_error
echo LINK_ERROR > ${this.config.tempPath}\\STATUS.TXT
echo.
echo ========================================
echo   Linking Failed!
echo ========================================
echo.
echo Check the error messages above.
echo.
goto end

:end
`;

      const batchPath = `${this.config.tempPath}\\COMPILE.BAT`;
      await this.fs.writeTextFile(batchPath, batchContent);
      this.addBuildMessage('info', `Batch file created: ${batchPath}`);

      // Step 4: Provide instructions for manual execution
      this.reportProgress('compiling', 50, sourceFile, 'Ready for manual compilation');
      this.addBuildMessage('info', '');
      this.addBuildMessage('info', '📋 MANUAL COMPILATION REQUIRED');
      this.addBuildMessage('info', '');
      this.addBuildMessage('info', 'Keyboard simulation is not available when the DOS window is hidden.');
      this.addBuildMessage('info', 'Please follow these steps:');
      this.addBuildMessage('info', '');
      this.addBuildMessage('info', '1. Switch to Terminal mode (click the Terminal tab)');
      this.addBuildMessage('info', '2. Type the following command and press Enter:');
      this.addBuildMessage('info', `   ${batchPath}`);
      this.addBuildMessage('info', '3. Wait for compilation to complete');
      this.addBuildMessage('info', '4. Switch back to Code mode');
      this.addBuildMessage('info', '5. Click "Check Result" to retrieve the executable');
      this.addBuildMessage('info', '');

      return {
        success: false,
        errors: ['Manual compilation required - see instructions above'],
        warnings: [],
        outputFile,
        rawOutput: `Batch file created: ${batchPath}\n\nPlease run it manually in the DOS terminal.`,
        compilationTime: Date.now() - startTime,
      };

    } catch (error) {
      const errorMessage = this.formatErrorMessage(error);
      this.reportProgress('error', 100, outputFile, `Error: ${errorMessage}`);
      this.addBuildMessage('error', `Compilation setup failed: ${errorMessage}`);

      return {
        success: false,
        errors: [errorMessage],
        warnings: [],
        outputFile,
        rawOutput: this.compilerOutput || errorMessage,
        compilationTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Check compilation result after manual execution
   *
   * This method checks if the compilation was successful by:
   * 1. Reading the STATUS.TXT file to check for SUCCESS/COMPILE_ERROR/LINK_ERROR
   * 2. If successful, reading the compiled executable
   * 3. Returning the result
   *
   * @param outputFile - Name of the expected output file
   * @returns Compilation result
   */
  async checkCompilationResult(outputFile: string): Promise<CompileResult> {
    const startTime = Date.now();
    this.buildMessages = [];

    this.addBuildMessage('info', 'Checking compilation result...');

    try {
      // Check status file
      const statusPath = `${this.config.tempPath}\\STATUS.TXT`;
      let status: string;

      try {
        status = await this.fs.readTextFile(statusPath);
        status = status.trim();
      } catch (error) {
        this.addBuildMessage('error', 'Status file not found. Did you run the batch file?');
        return {
          success: false,
          errors: ['Compilation not executed yet. Please run the batch file in the DOS terminal.'],
          warnings: [],
          outputFile,
          rawOutput: 'Status file not found',
          compilationTime: Date.now() - startTime,
        };
      }

      // Check if compilation was successful
      if (status === 'SUCCESS') {
        // Read the executable
        const exePath = `${this.config.outputPath}\\${outputFile}`;

        try {
          const executable = await this.fs.readBinaryFile(exePath);

          this.addBuildMessage('success', `Compilation successful: ${outputFile}`);
          this.addBuildMessage('info', `Executable size: ${executable.length} bytes`);

          return {
            success: true,
            errors: [],
            warnings: [],
            outputFile,
            executable,
            rawOutput: 'Compilation successful',
            compilationTime: Date.now() - startTime,
          };
        } catch (error) {
          this.addBuildMessage('error', `Failed to read executable: ${exePath}`);
          return {
            success: false,
            errors: ['Executable file not found. Compilation may have failed.'],
            warnings: [],
            outputFile,
            rawOutput: 'Executable not found',
            compilationTime: Date.now() - startTime,
          };
        }
      } else if (status === 'COMPILE_ERROR') {
        this.addBuildMessage('error', 'Compilation failed. Check the DOS terminal for error messages.');
        return {
          success: false,
          errors: ['Compilation failed. Check the DOS terminal output for details.'],
          warnings: [],
          outputFile,
          rawOutput: 'Compilation error',
          compilationTime: Date.now() - startTime,
        };
      } else if (status === 'LINK_ERROR') {
        this.addBuildMessage('error', 'Linking failed. Check the DOS terminal for error messages.');
        return {
          success: false,
          errors: ['Linking failed. Check the DOS terminal output for details.'],
          warnings: [],
          outputFile,
          rawOutput: 'Link error',
          compilationTime: Date.now() - startTime,
        };
      } else {
        this.addBuildMessage('error', `Unknown status: ${status}`);
        return {
          success: false,
          errors: [`Unknown compilation status: ${status}`],
          warnings: [],
          outputFile,
          rawOutput: `Unknown status: ${status}`,
          compilationTime: Date.now() - startTime,
        };
      }
    } catch (error) {
      const errorMessage = this.formatErrorMessage(error);
      this.addBuildMessage('error', `Failed to check result: ${errorMessage}`);

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
   * Format error message with helpful context
   */
  private formatErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      // Check for specific error types
      if (error.message.includes('cancelled')) {
        return 'Compilation was cancelled by user';
      }
      if (error.message.includes('timeout')) {
        return `Compilation timeout (exceeded ${this.config.maxCompilationTime / 1000}s limit)`;
      }
      if (error.message.includes('not found')) {
        return `File not found: ${error.message}`;
      }
      if (error.message.includes('permission')) {
        return `Permission denied: ${error.message}`;
      }
      if (error.message.includes('WATCOM')) {
        return `Open Watcom compiler error: ${error.message}`;
      }
      return error.message;
    }
    return 'Unknown compilation error occurred';
  }

  /**
   * Ensure required directories exist in DOS filesystem
   */
  private async ensureDirectories(): Promise<void> {
    // Create temp directory if it doesn't exist
    try {
      await this.fs.createDirectory(this.config.tempPath);
      this.addBuildMessage('info', `Created temp directory: ${this.config.tempPath}`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      this.addBuildMessage('error', `Failed to create temp directory: ${errorMsg}`);
      console.error('[OpenWatcomCompiler] Failed to create temp directory:', error);
      throw error; // Re-throw to stop compilation
    }

    // Create output directory if it doesn't exist
    try {
      await this.fs.createDirectory(this.config.outputPath);
      this.addBuildMessage('info', `Created output directory: ${this.config.outputPath}`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      this.addBuildMessage('error', `Failed to create output directory: ${errorMsg}`);
      console.error('[OpenWatcomCompiler] Failed to create output directory:', error);
      throw error; // Re-throw to stop compilation
    }

    // Log Open Watcom configuration
    if (this.config.verbose) {
      this.addBuildMessage('info', `Using Open Watcom at: ${this.config.watcomPath}`);
      this.addBuildMessage('info', `Compiler: ${this.config.compilerBin}`);
      this.addBuildMessage('info', `Linker: ${this.config.linkerBin}`);
    }
  }

  /**
   * Compile source file to object file
   */
  private async compileToObject(
    sourcePath: string,
    objPath: string,
    options?: OpenWatcomOptions
  ): Promise<boolean> {
    this.addBuildMessage('info', 'Compiling source to object file...');

    try {
      // Build compiler flags
      const compilerFlags = this.buildCompilerFlags(options);

      // Generate batch file for compilation
      const batchParams: CompileBatchParams = {
        sourcePath,
        objPath,
        compilerFlags,
        compilerBin: this.config.compilerBin,
        includePath: this.config.includePath,
        watcomPath: this.config.watcomPath,
      };

      const batchContent = BatchFileGenerator.generateCompileBatch(batchParams);
      const batchPath = `${this.config.tempPath}\\COMPILE.BAT`;

      if (this.config.verbose) {
        this.addBuildMessage('info', `Compiler command: ${this.config.compilerBin} ${sourcePath} -FO=${objPath} ${compilerFlags}`);
        this.addBuildMessage('info', `Writing batch file: ${batchPath}`);
        this.addBuildMessage('info', `Batch file content:\n${batchContent}`);
      }

      // Write batch file to DOS filesystem
      await this.fs.writeTextFile(batchPath, batchContent);

      // Execute batch file
      this.addBuildMessage('info', 'Executing compiler...');

      let result;
      try {
        result = await this.dosExecutor.executeBatchFile(batchPath, {
          timeoutMs: this.config.maxCompilationTime,
        });
      } catch (error) {
        // On timeout or other errors, try to get whatever output was captured
        const partialOutput = this.dosExecutor.getOutputBuffer();
        if (partialOutput) {
          this.compilerOutput += partialOutput;
          this.addBuildMessage('info', `Partial output captured (${partialOutput.length} chars)`);
        }
        throw error; // Re-throw to be caught by outer catch block
      }

      // Capture output
      this.compilerOutput += result.output;

      if (this.config.verbose) {
        this.addBuildMessage('info', `Compilation completed in ${result.executionTime}ms`);
      }

      // Check for success
      if (!result.success) {
        this.addBuildMessage('error', 'Compilation failed');
        if (this.config.verbose && result.output) {
          this.addBuildMessage('info', `Compiler output:\n${result.output}`);
        }
        return false;
      }

      // Verify object file was created
      try {
        await this.fs.readBinaryFile(objPath);
        this.addBuildMessage('info', `Object file created: ${objPath}`);
        return true;
      } catch {
        this.addBuildMessage('error', `Object file not found: ${objPath}`);
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.addBuildMessage('error', `Compilation error: ${errorMessage}`);

      // The error message from DosCommandExecutor now includes output preview
      // but we also add it to compilerOutput for the final result
      if (!this.compilerOutput.includes(errorMessage)) {
        this.compilerOutput += `\nError: ${errorMessage}\n`;
      }
      return false;
    }
  }

  /**
   * Link object file to executable
   */
  private async linkToExecutable(
    objPath: string,
    exePath: string,
    _options?: OpenWatcomOptions
  ): Promise<boolean> {
    this.addBuildMessage('info', 'Linking object file to executable...');

    try {
      // Generate batch file for linking
      const batchParams: LinkBatchParams = {
        objPaths: [objPath],
        exePath,
        linkerFlags: 'SYSTEM DOS',
        linkerBin: this.config.linkerBin,
        libPath: this.config.libPath,
        watcomPath: this.config.watcomPath,
      };

      const batchContent = BatchFileGenerator.generateLinkBatch(batchParams);
      const batchPath = `${this.config.tempPath}\\LINK.BAT`;

      if (this.config.verbose) {
        this.addBuildMessage('info', `Linker command: ${this.config.linkerBin} FILE ${objPath} NAME ${exePath} SYSTEM DOS`);
        this.addBuildMessage('info', `Writing batch file: ${batchPath}`);
      }

      // Write batch file to DOS filesystem
      await this.fs.writeTextFile(batchPath, batchContent);

      // Execute batch file
      this.addBuildMessage('info', 'Executing linker...');

      let result;
      try {
        result = await this.dosExecutor.executeBatchFile(batchPath, {
          timeoutMs: this.config.maxCompilationTime,
        });
      } catch (error) {
        // On timeout or other errors, try to get whatever output was captured
        const partialOutput = this.dosExecutor.getOutputBuffer();
        if (partialOutput) {
          this.compilerOutput += partialOutput;
          this.addBuildMessage('info', `Partial output captured (${partialOutput.length} chars)`);
        }
        throw error; // Re-throw to be caught by outer catch block
      }

      // Capture output
      this.compilerOutput += result.output;

      if (this.config.verbose) {
        this.addBuildMessage('info', `Linking completed in ${result.executionTime}ms`);
      }

      // Check for success
      if (!result.success) {
        this.addBuildMessage('error', 'Linking failed');
        if (this.config.verbose && result.output) {
          this.addBuildMessage('info', `Linker output:\n${result.output}`);
        }
        return false;
      }

      // Verify executable was created
      try {
        await this.fs.readBinaryFile(exePath);
        this.addBuildMessage('info', `Executable created: ${exePath}`);
        return true;
      } catch {
        this.addBuildMessage('error', `Executable not found: ${exePath}`);
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.addBuildMessage('error', `Linking error: ${errorMessage}`);

      // The error message from DosCommandExecutor now includes output preview
      // but we also add it to compilerOutput for the final result
      if (!this.compilerOutput.includes(errorMessage)) {
        this.compilerOutput += `\nError: ${errorMessage}\n`;
      }
      return false;
    }
  }

  /**
   * Build compiler flags from options
   */
  private buildCompilerFlags(options?: OpenWatcomOptions): string {
    const flags: string[] = [];

    // Memory model
    const memoryModel = options?.memoryModel || 'small';
    const modelFlag = this.getMemoryModelFlag(memoryModel);
    flags.push(modelFlag);

    // Optimization
    if (options?.optimization) {
      const optFlags = this.getOptimizationFlags(options.optimization);
      flags.push(...optFlags);
    }

    // Warnings
    const warningLevel = options?.warningLevel ?? 4;
    flags.push(`-w${warningLevel}`);

    if (options?.warningsAsErrors) {
      flags.push('-we');
    }

    // Debug info
    if (options?.debug) {
      flags.push('-d2'); // Full debug info
    }

    // Custom Open Watcom optimizations
    if (options?.watcomOptimizations) {
      flags.push(...options.watcomOptimizations);
    }

    return flags.join(' ');
  }

  /**
   * Get memory model flag
   */
  private getMemoryModelFlag(model: MemoryModel): string {
    const modelMap: Record<MemoryModel, string> = {
      tiny: '-mt',
      small: '-ms',
      compact: '-mc',
      medium: '-mm',
      large: '-ml',
      huge: '-mh',
    };
    return modelMap[model];
  }

  /**
   * Get optimization flags
   */
  private getOptimizationFlags(level: CompilerOptions['optimization']): string[] {
    switch (level) {
      case 'O0':
        return []; // No optimization
      case 'O1':
        return ['-oh']; // Basic optimizations
      case 'O2':
        return ['-oh', '-ok', '-ot']; // Speed optimizations
      case 'O3':
        return ['-oh', '-ok', '-ot', '-ol+', '-oa', '-ob']; // Aggressive optimizations
      case 'Os':
        return ['-os']; // Size optimizations
      default:
        return ['-oh', '-ok']; // Default: moderate optimizations
    }
  }

  /**
   * Add a build message
   */
  private addBuildMessage(
    type: BuildMessage['type'],
    message: string,
    file?: string,
    line?: number
  ): void {
    this.buildMessages.push({
      type,
      message,
      file,
      line,
      timestamp: new Date(),
    });
  }

  /**
   * Get all build messages
   *
   * Returns a copy of all build messages generated during compilation.
   * Messages include info, warnings, errors, and success messages.
   *
   * @returns Array of build messages
   * @example
   * ```typescript
   * const messages = compiler.getBuildMessages();
   * messages.forEach(msg => {
   *   console.log(`[${msg.type}] ${msg.message}`);
   * });
   * ```
   */
  getBuildMessages(): BuildMessage[] {
    return [...this.buildMessages];
  }

  /**
   * Clear all build messages
   *
   * Removes all build messages from the internal array.
   * Useful for starting a fresh compilation.
   *
   * @example
   * ```typescript
   * compiler.clearBuildMessages();
   * await compiler.compile(source, 'test.c', 'test.exe');
   * ```
   */
  clearBuildMessages(): void {
    this.buildMessages = [];
  }

  /**
   * Report compilation progress
   */
  private reportProgress(
    step: CompilationProgress['step'],
    progress: number,
    currentFile: string,
    message: string
  ): void {
    if (this.progressCallback) {
      this.progressCallback({
        step,
        progress,
        currentFile,
        message,
      });
    }
  }

  /**
   * Compile multiple source files and link them together
   *
   * This method supports multi-file C projects with separate compilation units.
   * It compiles each .c file to an object file, then links all object files together.
   * Header files (.h) are written to the filesystem but not compiled.
   *
   * Workflow:
   * 1. Write all source files (including headers) to DOS filesystem
   * 2. Compile each .c file to .obj file
   * 3. Link all .obj files into single executable
   * 4. Read and return the final executable
   *
   * @param sourceFiles - Array of source files with name and content
   * @param outputFile - Name of output executable (e.g., 'program.exe')
   * @param options - Optional compiler options
   * @returns Promise resolving to compilation result
   *
   * @example
   * ```typescript
   * const result = await compiler.compileMultiple([
   *   { name: 'main.c', content: mainSource },
   *   { name: 'helper.c', content: helperSource },
   *   { name: 'helper.h', content: helperHeader }
   * ], 'program.exe', { memoryModel: 'small' });
   *
   * if (result.success) {
   *   console.log('Multi-file compilation successful!');
   * }
   * ```
   */
  async compileMultiple(
    sourceFiles: Array<{ name: string; content: string }>,
    outputFile: string,
    options?: OpenWatcomOptions
  ): Promise<CompileResult> {
    const startTime = Date.now();
    this.buildMessages = [];
    this.compilerOutput = '';

    this.addBuildMessage('info', `Starting multi-file compilation (${sourceFiles.length} files)...`);

    try {
      // Step 1: Ensure directories exist
      await this.ensureDirectories();

      // Step 2: Write all source files
      for (const file of sourceFiles) {
        const sourcePath = `${this.config.tempPath}\\${file.name}`;
        await this.fs.writeTextFile(sourcePath, file.content);
        this.addBuildMessage('info', `Source file written: ${sourcePath}`);
      }

      // Step 3: Compile each source file to object file
      const objFiles: string[] = [];

      for (const file of sourceFiles) {
        // Skip header files
        if (file.name.toLowerCase().endsWith('.h')) {
          continue;
        }

        const sourcePath = `${this.config.tempPath}\\${file.name}`;
        const objFile = file.name.replace(/\.c$/i, '.OBJ');
        const objPath = `${this.config.tempPath}\\${objFile}`;

        const compileSuccess = await this.compileToObject(
          sourcePath,
          objPath,
          options
        );

        if (!compileSuccess) {
          const parseResult = OpenWatcomErrorParser.parse(this.compilerOutput);
          const errors = OpenWatcomErrorParser.formatForUI(parseResult.errors);
          const warnings = OpenWatcomErrorParser.formatForUI(parseResult.warnings);

          return {
            success: false,
            errors,
            warnings,
            outputFile,
            rawOutput: this.compilerOutput,
            compilationTime: Date.now() - startTime,
          };
        }

        objFiles.push(objPath);
      }

      // Step 4: Link all object files to executable
      const exePath = `${this.config.outputPath}\\${outputFile}`;

      const linkSuccess = await this.linkMultipleToExecutable(
        objFiles,
        exePath,
        options
      );

      if (!linkSuccess) {
        const parseResult = OpenWatcomErrorParser.parse(this.compilerOutput);
        const errors = OpenWatcomErrorParser.formatForUI(parseResult.errors);
        const warnings = OpenWatcomErrorParser.formatForUI(parseResult.warnings);

        return {
          success: false,
          errors,
          warnings,
          outputFile,
          rawOutput: this.compilerOutput,
          compilationTime: Date.now() - startTime,
        };
      }

      // Step 5: Read compiled executable
      const executable = await this.fs.readBinaryFile(exePath);

      // Parse any warnings from compilation
      const parseResult = OpenWatcomErrorParser.parse(this.compilerOutput);
      const warnings = OpenWatcomErrorParser.formatForUI(parseResult.warnings);

      this.addBuildMessage('success', `Multi-file compilation successful: ${outputFile}`);
      this.addBuildMessage('info', `Executable size: ${executable.length} bytes`);
      this.addBuildMessage('info', `Build completed in ${Date.now() - startTime}ms`);

      return {
        success: true,
        errors: [],
        warnings,
        outputFile,
        executable,
        rawOutput: this.compilerOutput,
        compilationTime: Date.now() - startTime,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.addBuildMessage('error', `Multi-file compilation failed: ${errorMessage}`);

      return {
        success: false,
        errors: [errorMessage],
        warnings: [],
        outputFile,
        rawOutput: this.compilerOutput || errorMessage,
        compilationTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Link multiple object files to executable
   */
  private async linkMultipleToExecutable(
    objPaths: string[],
    exePath: string,
    _options?: OpenWatcomOptions
  ): Promise<boolean> {
    this.addBuildMessage('info', `Linking ${objPaths.length} object files to executable...`);

    try {
      // Generate batch file for linking multiple object files
      const batchParams: LinkBatchParams = {
        objPaths,
        exePath,
        linkerFlags: 'SYSTEM DOS',
        linkerBin: this.config.linkerBin,
        libPath: this.config.libPath,
        watcomPath: this.config.watcomPath,
      };

      const batchContent = BatchFileGenerator.generateLinkBatch(batchParams);
      const batchPath = `${this.config.tempPath}\\LINK.BAT`;

      if (this.config.verbose) {
        const objList = objPaths.join(' FILE ');
        this.addBuildMessage('info', `Linker command: ${this.config.linkerBin} FILE ${objList} NAME ${exePath} SYSTEM DOS`);
        this.addBuildMessage('info', `Writing batch file: ${batchPath}`);
      }

      // Write batch file to DOS filesystem
      await this.fs.writeTextFile(batchPath, batchContent);

      // Execute batch file
      this.addBuildMessage('info', 'Executing linker...');
      const result = await this.dosExecutor.executeBatchFile(batchPath, {
        timeoutMs: this.config.maxCompilationTime,
      });

      // Capture output
      this.compilerOutput += result.output;

      if (this.config.verbose) {
        this.addBuildMessage('info', `Linking completed in ${result.executionTime}ms`);
      }

      // Check for success
      if (!result.success) {
        this.addBuildMessage('error', 'Linking failed');
        return false;
      }

      // Verify executable was created
      try {
        await this.fs.readBinaryFile(exePath);
        this.addBuildMessage('info', `Executable created: ${exePath}`);
        return true;
      } catch {
        this.addBuildMessage('error', `Executable not found: ${exePath}`);
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.addBuildMessage('error', `Linking error: ${errorMessage}`);
      this.compilerOutput += `\nError: ${errorMessage}\n`;
      return false;
    }
  }
}

