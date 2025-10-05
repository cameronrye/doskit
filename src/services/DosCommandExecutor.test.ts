/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * DOS Command Executor Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { CommandInterface, CommandInterfaceEvents } from '../types/js-dos';
import { DosCommandExecutor } from './DosCommandExecutor';

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

  private executeCommand(): void {
    const command = this.getTypedCommand();
    
    // Simulate different command outputs
    if (command === 'DIR') {
      this.emitOutput('Directory of C:\\\n');
      this.emitOutput('WATCOM       <DIR>\n');
      this.emitOutput('TEMP         <DIR>\n');
      this.emitOutput('C:\\>\n');
    } else if (command.includes('COMPILE.BAT')) {
      this.emitOutput('Compiling source file...\n');
      this.emitOutput('Open Watcom C16 Compiler Version 2.0\n');
      this.emitOutput('SOURCE.C: 10 lines, included 150, 0 warnings, 0 errors\n');
      this.emitOutput('<<<COMPILE_SUCCESS>>>\n');
      this.emitOutput('C:\\>\n');
    } else if (command.includes('LINK.BAT')) {
      this.emitOutput('Linking object files...\n');
      this.emitOutput('Open Watcom Linker Version 2.0\n');
      this.emitOutput('<<<LINK_SUCCESS>>>\n');
      this.emitOutput('C:\\>\n');
    } else if (command.includes('ERROR.BAT')) {
      this.emitOutput('Compiling source file...\n');
      this.emitOutput('SOURCE.C(5): Error! E1011: Symbol \'printf\' has not been declared\n');
      this.emitOutput('<<<COMPILE_ERROR>>>\n');
      this.emitOutput('C:\\>\n');
    } else {
      this.emitOutput(`${command}\n`);
      this.emitOutput('C:\\>\n');
    }
  }

  private getTypedCommand(): string {
    // Extract command from key presses (excluding Enter key)
    const chars = this.keyPresses
      .filter(code => code !== 13)
      .map(code => String.fromCharCode(code));
    return chars.join('');
  }

  private emitOutput(message: string): void {
    this.outputBuffer += message;
    this.stdoutHandlers.forEach(handler => handler(message));
  }

  getKeyPresses(): number[] {
    return [...this.keyPresses];
  }

  clearKeyPresses(): void {
    this.keyPresses = [];
  }
}

describe('DosCommandExecutor', () => {
  let mockCi: MockCommandInterface;
  let executor: DosCommandExecutor;

  beforeEach(() => {
    mockCi = new MockCommandInterface();
    executor = new DosCommandExecutor(mockCi as unknown as CommandInterface);
  });

  describe('Basic Command Execution', () => {
    it('should execute DIR command and capture output', async () => {
      const result = await executor.executeDosCommand('DIR');

      expect(result.success).toBe(true);
      expect(result.output).toContain('Directory of C:\\');
      expect(result.output).toContain('WATCOM');
      expect(result.output).toContain('C:\\>');
      expect(result.executionTime).toBeGreaterThan(0);
    });

    it('should type command character by character', async () => {
      await executor.executeDosCommand('DIR');

      const keyPresses = mockCi.getKeyPresses();
      expect(keyPresses).toContain('D'.charCodeAt(0));
      expect(keyPresses).toContain('I'.charCodeAt(0));
      expect(keyPresses).toContain('R'.charCodeAt(0));
      expect(keyPresses).toContain(13); // Enter key
    });

    it('should clear output buffer before execution by default', async () => {
      await executor.executeDosCommand('DIR');
      const firstOutput = executor.getOutputBuffer();

      mockCi.clearKeyPresses(); // Clear key presses for second command
      await executor.executeDosCommand('DIR');
      const secondOutput = executor.getOutputBuffer();

      // Second output should be the same as first (buffer was cleared)
      expect(secondOutput).toBe(firstOutput);
    });

    it('should not clear buffer when clearBuffer is false', async () => {
      await executor.executeDosCommand('DIR', { clearBuffer: false });
      const firstLength = executor.getOutputBuffer().length;

      mockCi.clearKeyPresses(); // Clear key presses for second command
      await executor.executeDosCommand('DIR', { clearBuffer: false });
      const secondLength = executor.getOutputBuffer().length;

      // Second execution should append to buffer
      expect(secondLength).toBeGreaterThan(firstLength);
    });
  });

  describe('Batch File Execution', () => {
    it('should execute compile batch file successfully', async () => {
      const result = await executor.executeBatchFile('C:\\COMPILE.BAT');

      expect(result.success).toBe(true);
      expect(result.output).toContain('Compiling source file');
      expect(result.output).toContain('Open Watcom C16 Compiler');
      expect(result.output).toContain('<<<COMPILE_SUCCESS>>>');
      expect(result.error).toBeUndefined();
    });

    it('should execute link batch file successfully', async () => {
      const result = await executor.executeBatchFile('C:\\LINK.BAT');

      expect(result.success).toBe(true);
      expect(result.output).toContain('Linking object files');
      expect(result.output).toContain('Open Watcom Linker');
      expect(result.output).toContain('<<<LINK_SUCCESS>>>');
      expect(result.error).toBeUndefined();
    });

    it('should detect compilation errors', async () => {
      const result = await executor.executeBatchFile('C:\\ERROR.BAT');

      expect(result.success).toBe(false);
      expect(result.output).toContain('Error! E1011');
      expect(result.output).toContain('<<<COMPILE_ERROR>>>');
      expect(result.error).toBe('Command failed with errors');
    });
  });

  describe('Custom Markers', () => {
    it('should detect custom completion markers', async () => {
      const result = await executor.executeDosCommand('C:\\COMPILE.BAT', {
        completionMarkers: ['<<<COMPILE_SUCCESS>>>'],
      });

      expect(result.success).toBe(true);
    });

    it('should detect custom error markers', async () => {
      const result = await executor.executeDosCommand('C:\\ERROR.BAT', {
        errorMarkers: ['<<<COMPILE_ERROR>>>'],
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Command failed with errors');
    });
  });

  describe('Buffer Management', () => {
    it('should get output buffer', () => {
      const buffer = executor.getOutputBuffer();
      expect(typeof buffer).toBe('string');
    });

    it('should clear output buffer', async () => {
      await executor.executeDosCommand('DIR');
      expect(executor.getOutputBuffer().length).toBeGreaterThan(0);
      
      executor.clearOutputBuffer();
      expect(executor.getOutputBuffer()).toBe('');
    });
  });

  describe('Execution State', () => {
    it('should report not executing initially', () => {
      expect(executor.isExecuting()).toBe(false);
    });

    it('should prevent concurrent execution', async () => {
      const promise1 = executor.executeDosCommand('DIR');
      
      // Try to execute another command while first is running
      await expect(
        executor.executeDosCommand('DIR')
      ).rejects.toThrow('Another command is already executing');
      
      await promise1;
    });

    it('should allow execution after previous command completes', async () => {
      await executor.executeDosCommand('DIR');
      
      // Should not throw
      await expect(
        executor.executeDosCommand('DIR')
      ).resolves.toBeDefined();
    });
  });

  describe('Timeout Handling', () => {
    it('should respect custom timeout', async () => {
      const result = await executor.executeDosCommand('DIR', {
        timeoutMs: 10000,
      });

      expect(result.success).toBe(true);
      expect(result.executionTime).toBeLessThan(10000);
    });
  });
});

