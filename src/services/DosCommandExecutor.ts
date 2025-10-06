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
   *
   * IMPORTANT: Only ONE stdout handler should be registered per CommandInterface.
   * Multiple handlers may cause output capture to fail.
   */
  private setupOutputCapture(): void {
    this.stdoutHandler = (message: string) => {
      if (import.meta.env.DEV) {
        // Show the actual content, not just the length
        const preview = message.length > 200 ? message.substring(0, 200) + '...' : message;
        console.log('[DosCommandExecutor] Received stdout:', message.length, 'chars:', JSON.stringify(preview));
      }
      this.outputBuffer += message;
    };
    this.ci.events().onStdout(this.stdoutHandler);

    if (import.meta.env.DEV) {
      console.log('[DosCommandExecutor] Output capture handler registered');
    }
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

    try {
      // Wait for DOS prompt to be ready before typing command
      if (import.meta.env.DEV) {
        console.log('[DosCommandExecutor] Waiting for DOS prompt before typing command...');
      }
      await this.waitForDosPrompt(5000); // Wait up to 5 seconds for prompt

      // Ensure emulator is resumed (not paused)
      try {
        this.ci.resume();
        if (import.meta.env.DEV) {
          console.log('[DosCommandExecutor] Emulator resumed');
        }
      } catch (e) {
        if (import.meta.env.DEV) {
          console.log('[DosCommandExecutor] Resume failed (might already be running):', e);
        }
      }

      if (clearBuffer) {
        this.outputBuffer = '';
      }

      // Type the command
      this.typeCommand(command);

      // Give DOS a moment to start processing the command
      await new Promise(resolve => setTimeout(resolve, 100));

      if (import.meta.env.DEV) {
        console.log('[DosCommandExecutor] After typing, buffer has:', this.outputBuffer.length, 'chars');
      }

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
    if (import.meta.env.DEV) {
      console.log('[DosCommandExecutor] Typing command:', command);
      console.log('[DosCommandExecutor] Command length:', command.length, 'chars');
    }

    // Try using sendKeyEvent instead of simulateKeyPress
    // sendKeyEvent sends both key down and key up events
    for (let i = 0; i < command.length; i++) {
      const char = command[i];
      const keyCode = char.charCodeAt(0);

      if (import.meta.env.DEV && i === 0) {
        console.log('[DosCommandExecutor] First char:', char, 'keyCode:', keyCode);
        console.log('[DosCommandExecutor] Using sendKeyEvent method');
      }

      // Send key down
      this.ci.sendKeyEvent(keyCode, true);
      // Send key up
      this.ci.sendKeyEvent(keyCode, false);
    }

    // Press Enter (key code 13)
    this.ci.sendKeyEvent(13, true);
    this.ci.sendKeyEvent(13, false);

    if (import.meta.env.DEV) {
      console.log('[DosCommandExecutor] Command typed, Enter pressed (keyCode 13)');
    }
  }

  /**
   * Wait for DOS prompt to appear
   *
   * Waits for DOS to be ready to accept commands. Since the DOSBox config
   * doesn't explicitly show a prompt, we look for the last autoexec message
   * and then wait a bit for DOS to be ready.
   *
   * @param timeoutMs - Maximum time to wait in milliseconds
   * @throws Error if timeout is reached
   */
  private async waitForDosPrompt(timeoutMs: number): Promise<void> {
    const startTime = Date.now();
    const checkInterval = 100; // Check every 100ms

    return new Promise((resolve, reject) => {
      const intervalId = setInterval(() => {
        const elapsed = Date.now() - startTime;

        // Check for timeout
        if (elapsed >= timeoutMs) {
          clearInterval(intervalId);
          reject(new Error(`Timeout waiting for DOS prompt after ${timeoutMs}ms. Buffer: ${this.outputBuffer.substring(0, 200)}`));
          return;
        }

        // Check for DOS prompt (standard format)
        const hasPrompt = this.outputBuffer.includes('C:\\>') ||
                         this.outputBuffer.includes('C:>');

        // Check for our custom ready marker (from dosbox.conf autoexec)
        const hasReadyMarker = this.outputBuffer.includes("DOSKIT_READY");

        if (hasPrompt || hasReadyMarker) {
          clearInterval(intervalId);
          if (import.meta.env.DEV) {
            console.log('[DosCommandExecutor] DOS ready marker detected, waiting 1000ms for full initialization...');
          }
          // Wait longer for DOS to be fully ready to accept input
          setTimeout(() => {
            if (import.meta.env.DEV) {
              console.log('[DosCommandExecutor] DOS should be ready to accept commands now');
            }
            resolve();
          }, 1000); // Increased from 500ms to 1000ms
        }
      }, checkInterval);
    });
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

    if (import.meta.env.DEV) {
      console.log('[DosCommandExecutor] Waiting for completion. Markers:', {
        completion: completionMarkers,
        error: errorMarkers,
        timeout: timeoutMs
      });
    }

    return new Promise((resolve, reject) => {
      let lastLogTime = startTime;

      const intervalId = setInterval(() => {
        const elapsed = Date.now() - startTime;

        // Log progress every 5 seconds in dev mode
        if (import.meta.env.DEV && elapsed - (lastLogTime - startTime) >= 5000) {
          console.log(`[DosCommandExecutor] Still waiting... (${Math.floor(elapsed / 1000)}s elapsed, ${this.outputBuffer.length} chars captured)`);
          lastLogTime = Date.now();
        }

        // Check for timeout
        if (elapsed >= timeoutMs) {
          clearInterval(intervalId);
          const outputPreview = this.outputBuffer.length > 0
            ? `\nCaptured output (${this.outputBuffer.length} chars):\n${this.outputBuffer.substring(0, 500)}${this.outputBuffer.length > 500 ? '...' : ''}`
            : '\nNo output captured from DOS emulator';
          reject(new Error(`Command timeout after ${timeoutMs}ms${outputPreview}`));
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
          if (import.meta.env.DEV) {
            console.log('[DosCommandExecutor] Command completed successfully');
          }
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

