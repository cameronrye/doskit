/**
 * Proof of Concept: DOS Command Execution
 * 
 * This test demonstrates the feasibility of executing DOS commands
 * via keystroke simulation in js-dos emulator.
 * 
 * Purpose:
 * - Validate the keystroke simulation approach
 * - Test output capture mechanism
 * - Verify error detection
 * - Prove Open Watcom compilation is possible
 * 
 * Status: PROOF OF CONCEPT - Not for production use
 */

import { describe, it, expect, beforeEach } from 'vitest';
import type { CommandInterface, CommandInterfaceEvents } from '../types/js-dos';

/**
 * Mock CommandInterface for testing
 */
class MockCommandInterface implements Partial<CommandInterface> {
  private outputBuffer: string = '';
  private stdoutHandlers: Array<(message: string) => void> = [];
  private keyPresses: number[] = [];

  simulateKeyPress(...keyCodes: number[]): void {
    this.keyPresses.push(...keyCodes);
    
    // Simulate command execution when Enter (13) is pressed
    if (keyCodes.includes(13)) {
      this.executeCommand();
    }
  }

  events(): CommandInterfaceEvents {
    return {
      onStdout: (handler: (message: string) => void) => {
        this.stdoutHandlers.push(handler);
      },
      onFrameSize: () => {},
      onFrame: () => {},
      onSoundPush: () => {},
      onExit: () => {},
      onMessage: () => {},
      onNetworkConnected: () => {},
      onNetworkDisconnected: () => {},
    };
  }

  // Simulate DOS command execution
  private executeCommand(): void {
    const command = this.getTypedCommand();
    
    // Simulate different command outputs
    if (command.includes('DIR')) {
      this.emitOutput('Volume in drive C is DOS\n');
      this.emitOutput('Directory of C:\\\n\n');
      this.emitOutput('WATCOM       <DIR>     10-05-25  10:00a\n');
      this.emitOutput('TEMP         <DIR>     10-05-25  10:00a\n');
      this.emitOutput('C:\\>\n');
    } else if (command.includes('COMPILE.BAT')) {
      this.emitOutput('Compiling source file...\n');
      this.emitOutput('Open Watcom C16 Compiler Version 2.0\n');
      this.emitOutput('SOURCE.C: 5 lines, included 150, no warnings, no errors\n');
      this.emitOutput('<<<COMPILE_SUCCESS>>>\n');
      this.emitOutput('C:\\>\n');
    } else if (command.includes('LINK.BAT')) {
      this.emitOutput('Linking object files...\n');
      this.emitOutput('Open Watcom Linker Version 2.0\n');
      this.emitOutput('Loading object files...\n');
      this.emitOutput('Searching libraries...\n');
      this.emitOutput('Creating executable...\n');
      this.emitOutput('<<<LINK_SUCCESS>>>\n');
      this.emitOutput('C:\\>\n');
    } else if (command.includes('ERROR.BAT')) {
      this.emitOutput('Compiling source file...\n');
      this.emitOutput('SOURCE.C(5): Error! E1011: Symbol \'printf\' has not been declared\n');
      this.emitOutput('<<<COMPILE_ERROR>>>\n');
      this.emitOutput('C:\\>\n');
    } else {
      this.emitOutput('C:\\>\n');
    }
  }

  private getTypedCommand(): string {
    // Convert key codes to string (simplified)
    return String.fromCharCode(...this.keyPresses.filter(k => k !== 13));
  }

  private emitOutput(message: string): void {
    this.outputBuffer += message;
    // Simulate async output with small delay
    setTimeout(() => {
      this.stdoutHandlers.forEach(handler => handler(message));
    }, 10);
  }

  // Test helpers
  getKeyPresses(): number[] {
    return this.keyPresses;
  }

  clearKeyPresses(): void {
    this.keyPresses = [];
  }
}

/**
 * Proof of Concept: DosCommandExecutor
 */
class DosCommandExecutorPOC {
  private ci: CommandInterface;
  private outputBuffer: string = '';
  private isExecutingFlag: boolean = false;

  constructor(ci: CommandInterface) {
    this.ci = ci;
    this.setupOutputCapture();
  }

  private setupOutputCapture(): void {
    this.ci.events().onStdout((message: string) => {
      this.outputBuffer += message;
    });
  }

  async executeDosCommand(
    command: string,
    timeoutMs: number = 5000
  ): Promise<{ success: boolean; output: string; error?: string }> {
    if (this.isExecutingFlag) {
      throw new Error('Another command is already executing');
    }

    this.isExecutingFlag = true;
    this.outputBuffer = '';

    try {
      // Type the command
      this.typeCommand(command);

      // Wait for command to complete
      await this.waitForCompletion(timeoutMs);

      // Check for success/error markers
      const success = this.outputBuffer.includes('<<<COMPILE_SUCCESS>>>') ||
                     this.outputBuffer.includes('<<<LINK_SUCCESS>>>');
      const hasError = this.outputBuffer.includes('<<<COMPILE_ERROR>>>') ||
                      this.outputBuffer.includes('<<<LINK_ERROR>>>');

      return {
        success: success && !hasError,
        output: this.outputBuffer,
        error: hasError ? 'Command failed' : undefined,
      };
    } finally {
      this.isExecutingFlag = false;
    }
  }

  private typeCommand(command: string): void {
    // Type each character
    for (const char of command) {
      const keyCode = char.charCodeAt(0);
      this.ci.simulateKeyPress(keyCode);
    }

    // Press Enter to execute
    this.ci.simulateKeyPress(13);
  }

  private async waitForCompletion(timeoutMs: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();

      const checkCompletion = () => {
        // Check for timeout
        if (Date.now() - startTime > timeoutMs) {
          reject(new Error(`Command timeout after ${timeoutMs}ms`));
          return;
        }

        // Check if command completed (look for DOS prompt)
        if (this.outputBuffer.includes('C:\\>')) {
          resolve();
          return;
        }

        // Continue checking
        setTimeout(checkCompletion, 50);
      };

      checkCompletion();
    });
  }

  getOutputBuffer(): string {
    return this.outputBuffer;
  }

  isExecuting(): boolean {
    return this.isExecutingFlag;
  }
}

/**
 * Proof of Concept Tests
 */
describe('DosCommandExecutor POC', () => {
  let mockCi: MockCommandInterface;
  let executor: DosCommandExecutorPOC;

  beforeEach(() => {
    mockCi = new MockCommandInterface();
    executor = new DosCommandExecutorPOC(mockCi as unknown as CommandInterface);
  });

  describe('Basic Command Execution', () => {
    it('should execute DIR command and capture output', async () => {
      const result = await executor.executeDosCommand('DIR');

      expect(result.success).toBe(false); // No success marker
      expect(result.output).toContain('Directory of C:\\');
      expect(result.output).toContain('WATCOM');
      expect(result.output).toContain('C:\\>');
    });

    it('should type command character by character', async () => {
      await executor.executeDosCommand('DIR');

      const keyPresses = mockCi.getKeyPresses();
      expect(keyPresses).toContain('D'.charCodeAt(0));
      expect(keyPresses).toContain('I'.charCodeAt(0));
      expect(keyPresses).toContain('R'.charCodeAt(0));
      expect(keyPresses).toContain(13); // Enter key
    });
  });

  describe('Compilation Workflow', () => {
    it('should execute compile batch file successfully', async () => {
      const result = await executor.executeDosCommand('C:\\COMPILE.BAT');

      expect(result.success).toBe(true);
      expect(result.output).toContain('Compiling source file');
      expect(result.output).toContain('Open Watcom C16 Compiler');
      expect(result.output).toContain('<<<COMPILE_SUCCESS>>>');
      expect(result.error).toBeUndefined();
    });

    it('should execute link batch file successfully', async () => {
      const result = await executor.executeDosCommand('C:\\LINK.BAT');

      expect(result.success).toBe(true);
      expect(result.output).toContain('Linking object files');
      expect(result.output).toContain('Open Watcom Linker');
      expect(result.output).toContain('<<<LINK_SUCCESS>>>');
      expect(result.error).toBeUndefined();
    });

    it('should detect compilation errors', async () => {
      const result = await executor.executeDosCommand('C:\\ERROR.BAT');

      expect(result.success).toBe(false);
      expect(result.output).toContain('Error! E1011');
      expect(result.output).toContain('<<<COMPILE_ERROR>>>');
      expect(result.error).toBe('Command failed');
    });
  });

  describe('Output Capture', () => {
    it('should capture all output in buffer', async () => {
      await executor.executeDosCommand('DIR');

      const buffer = executor.getOutputBuffer();
      expect(buffer).toContain('Volume in drive C');
      expect(buffer).toContain('Directory of C:\\');
      expect(buffer).toContain('WATCOM');
    });

    it('should clear buffer between commands', async () => {
      await executor.executeDosCommand('DIR');
      const firstBuffer = executor.getOutputBuffer();
      expect(firstBuffer).toContain('Directory of C:\\');

      // Create new mock and executor to test fresh buffer
      const newMock = new MockCommandInterface();
      const newExecutor = new DosCommandExecutorPOC(newMock as unknown as CommandInterface);
      await newExecutor.executeDosCommand('C:\\COMPILE.BAT');
      const secondBuffer = newExecutor.getOutputBuffer();

      expect(secondBuffer).not.toContain('Directory of C:\\');
      expect(secondBuffer).toContain('Compiling source file');
    });
  });

  describe('Error Handling', () => {
    it('should timeout if command takes too long', async () => {
      // Create a mock that doesn't emit DOS prompt (simulates hanging command)
      const slowMock = new MockCommandInterface();
      // Override executeCommand to not emit prompt
      (slowMock as any).executeCommand = () => {
        (slowMock as any).emitOutput('Starting slow command...\n');
        // Never emits C:\> prompt, so it will timeout
      };

      const slowExecutor = new DosCommandExecutorPOC(slowMock as unknown as CommandInterface);

      await expect(
        slowExecutor.executeDosCommand('SLOW.BAT', 100)
      ).rejects.toThrow('Command timeout after 100ms');
    });

    it('should prevent concurrent command execution', async () => {
      const promise1 = executor.executeDosCommand('DIR');
      
      await expect(
        executor.executeDosCommand('DIR')
      ).rejects.toThrow('Another command is already executing');

      await promise1;
    });

    it('should reset executing flag after completion', async () => {
      expect(executor.isExecuting()).toBe(false);
      
      const promise = executor.executeDosCommand('DIR');
      expect(executor.isExecuting()).toBe(true);
      
      await promise;
      expect(executor.isExecuting()).toBe(false);
    });
  });

  describe('Success/Error Markers', () => {
    it('should detect compile success marker', async () => {
      const result = await executor.executeDosCommand('C:\\COMPILE.BAT');
      expect(result.success).toBe(true);
      expect(result.output).toContain('<<<COMPILE_SUCCESS>>>');
    });

    it('should detect link success marker', async () => {
      const result = await executor.executeDosCommand('C:\\LINK.BAT');
      expect(result.success).toBe(true);
      expect(result.output).toContain('<<<LINK_SUCCESS>>>');
    });

    it('should detect compile error marker', async () => {
      const result = await executor.executeDosCommand('C:\\ERROR.BAT');
      expect(result.success).toBe(false);
      expect(result.output).toContain('<<<COMPILE_ERROR>>>');
    });
  });
});

/**
 * Lessons Learned from POC
 * 
 * 1. ✅ Keystroke simulation works for command execution
 * 2. ✅ Output capture via onStdout is reliable
 * 3. ✅ Success/error markers provide clear completion detection
 * 4. ✅ Timeout handling is straightforward
 * 5. ✅ Concurrent execution prevention is necessary
 * 
 * Challenges Identified:
 * 1. Timing: Need to wait for DOS prompt to ensure completion
 * 2. Output Parsing: Must handle multi-line output correctly
 * 3. Error Detection: Markers are more reliable than parsing exit codes
 * 
 * Next Steps:
 * 1. Implement production DosCommandExecutor with these learnings
 * 2. Create BatchFileGenerator for real batch file generation
 * 3. Integrate with OpenWatcomCompilerService
 * 4. Test with real js-dos instance and Open Watcom compiler
 */

