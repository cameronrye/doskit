/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * DOS Command Executor
 * Executes DOS commands via keystroke simulation in js-dos emulator
 */

import type { CommandInterface } from '../types/js-dos';

/**
 * Options for DOS command execution
 */
export interface DosCommandOptions {
  /** Timeout in milliseconds (default: 30000) */
  timeoutMs?: number;
  
  /** Completion markers to look for in output */
  completionMarkers?: string[];
  
  /** Error markers to look for in output */
  errorMarkers?: string[];
  
  /** Whether to clear output buffer before execution */
  clearBuffer?: boolean;
}

/**
 * Result of DOS command execution
 */
export interface DosCommandResult {
  /** Whether command completed successfully */
  success: boolean;
  
  /** Captured output from command */
  output: string;
  
  /** Error message if command failed */
  error?: string;
  
  /** Execution time in milliseconds */
  executionTime: number;
}

/**
 * DOS Command Executor
 * 
 * Executes DOS commands via keystroke simulation and captures output.
 * Uses js-dos CommandInterface to type commands and listen for output.
 * 
 * @example
 * ```typescript
 * const executor = new DosCommandExecutor(commandInterface);
 * const result = await executor.executeDosCommand('DIR');
 * console.log(result.output);
 * ```
 */
export class DosCommandExecutor {
  private ci: CommandInterface;
  private outputBuffer: string = '';
  private isExecutingFlag: boolean = false;
  private stdoutHandler?: (message: string) => void;

  /**
   * Create a new DOS command executor
   * 
   * @param ci - js-dos CommandInterface instance
   */
  constructor(ci: CommandInterface) {
    this.ci = ci;
    this.setupOutputCapture();
  }

  /**
   * Set up output capture from DOS emulator
   * 
   * Registers an onStdout handler to capture all output from the DOS emulator.
   * Output is appended to the internal buffer for later retrieval.
   */
  private setupOutputCapture(): void {
    this.stdoutHandler = (message: string) => {
      this.outputBuffer += message;
    };
    this.ci.events().onStdout(this.stdoutHandler);
  }

  /**
   * Execute a DOS command
   * 
   * Types the command character-by-character, presses Enter, and waits for completion.
   * Captures all output and detects success/failure based on markers.
   * 
   * @param command - Command to execute (e.g., "DIR", "C:\\COMPILE.BAT")
   * @param options - Execution options
   * @returns Promise resolving to command result
   * 
   * @throws Error if another command is already executing
   * @throws Error if command times out
   * 
   * @example
   * ```typescript
   * const result = await executor.executeDosCommand('DIR', {
   *   timeoutMs: 5000,
   *   completionMarkers: ['<<<SUCCESS>>>']
   * });
   * ```
   */
  async executeDosCommand(
    command: string,
    options?: DosCommandOptions
  ): Promise<DosCommandResult> {
    if (this.isExecutingFlag) {
      throw new Error('Another command is already executing');
    }

    const startTime = Date.now();
    const timeoutMs = options?.timeoutMs ?? 30000;
    const completionMarkers = options?.completionMarkers ?? [];
    const errorMarkers = options?.errorMarkers ?? [];
    const clearBuffer = options?.clearBuffer ?? true;

    this.isExecutingFlag = true;
    
    if (clearBuffer) {
      this.outputBuffer = '';
    }

    try {
      // Type the command
      this.typeCommand(command);

      // Wait for command to complete
      await this.waitForCompletion(timeoutMs, completionMarkers, errorMarkers);

      const executionTime = Date.now() - startTime;

      // Check for error markers
      const hasError = errorMarkers.some(marker => 
        this.outputBuffer.includes(marker)
      );

      // Check for success markers
      const hasSuccess = completionMarkers.length === 0 || 
        completionMarkers.some(marker => this.outputBuffer.includes(marker));

      return {
        success: hasSuccess && !hasError,
        output: this.outputBuffer,
        error: hasError ? 'Command failed with errors' : undefined,
        executionTime,
      };
    } finally {
      this.isExecutingFlag = false;
    }
  }

  /**
   * Execute a batch file
   * 
   * Convenience method for executing batch files.
   * Automatically adds standard completion and error markers.
   * 
   * @param batchFilePath - Path to batch file in DOS filesystem
   * @param options - Execution options
   * @returns Promise resolving to command result
   * 
   * @example
   * ```typescript
   * const result = await executor.executeBatchFile('C:\\COMPILE.BAT');
   * if (result.success) {
   *   console.log('Batch file executed successfully');
   * }
   * ```
   */
  async executeBatchFile(
    batchFilePath: string,
    options?: DosCommandOptions
  ): Promise<DosCommandResult> {
    const defaultOptions: DosCommandOptions = {
      completionMarkers: [
        '<<<COMPILE_SUCCESS>>>',
        '<<<LINK_SUCCESS>>>',
      ],
      errorMarkers: [
        '<<<COMPILE_ERROR>>>',
        '<<<LINK_ERROR>>>',
      ],
      ...options,
    };

    return this.executeDosCommand(batchFilePath, defaultOptions);
  }

  /**
   * Type a command character-by-character
   * 
   * Simulates typing by sending individual key presses for each character,
   * then presses Enter to execute the command.
   * 
   * @param command - Command to type
   */
  private typeCommand(command: string): void {
    // Type each character
    for (const char of command) {
      const keyCode = char.charCodeAt(0);
      this.ci.simulateKeyPress(keyCode);
    }

    // Press Enter (key code 13)
    this.ci.simulateKeyPress(13);
  }

  /**
   * Wait for command completion
   * 
   * Waits for the DOS prompt to appear, indicating command completion.
   * Also checks for completion markers and error markers.
   * 
   * @param timeoutMs - Maximum time to wait in milliseconds
   * @param completionMarkers - Markers indicating successful completion
   * @param errorMarkers - Markers indicating errors
   * 
   * @throws Error if timeout is reached
   */
  private async waitForCompletion(
    timeoutMs: number,
    completionMarkers: string[],
    errorMarkers: string[]
  ): Promise<void> {
    const startTime = Date.now();
    const checkInterval = 100; // Check every 100ms

    return new Promise((resolve, reject) => {
      const intervalId = setInterval(() => {
        const elapsed = Date.now() - startTime;

        // Check for timeout
        if (elapsed >= timeoutMs) {
          clearInterval(intervalId);
          reject(new Error(`Command timeout after ${timeoutMs}ms`));
          return;
        }

        // Check for completion markers
        const hasCompletionMarker = completionMarkers.length === 0 ||
          completionMarkers.some(marker => this.outputBuffer.includes(marker));

        // Check for error markers
        const hasErrorMarker = errorMarkers.some(marker => 
          this.outputBuffer.includes(marker)
        );

        // Check for DOS prompt (indicates command finished)
        const hasPrompt = this.outputBuffer.includes('C:\\>') ||
                         this.outputBuffer.includes('C:>');

        // Command is complete if we have a prompt and either:
        // - No completion markers specified, or
        // - A completion marker is found, or
        // - An error marker is found
        if (hasPrompt && (hasCompletionMarker || hasErrorMarker || completionMarkers.length === 0)) {
          clearInterval(intervalId);
          resolve();
        }
      }, checkInterval);
    });
  }

  /**
   * Get current output buffer
   * 
   * Returns all captured output since the last buffer clear.
   * 
   * @returns Current output buffer content
   */
  getOutputBuffer(): string {
    return this.outputBuffer;
  }

  /**
   * Clear output buffer
   * 
   * Removes all content from the output buffer.
   * Useful for starting fresh before executing a new command.
   */
  clearOutputBuffer(): void {
    this.outputBuffer = '';
  }

  /**
   * Check if a command is currently executing
   * 
   * @returns True if a command is currently executing
   */
  isExecuting(): boolean {
    return this.isExecutingFlag;
  }
}

