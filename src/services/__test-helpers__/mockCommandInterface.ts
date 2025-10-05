/**
 * DosKit - Test Helpers
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * Mock CommandInterface for testing
 */

import { vi } from 'vitest';
import type { CommandInterface, CommandInterfaceEvents } from '../../types/js-dos';

/**
 * Create a mock CommandInterface for testing
 * 
 * This mock simulates successful DOS command execution with proper
 * event handling and output capture.
 * 
 * @param options - Optional configuration for the mock
 * @returns Mock CommandInterface instance
 */
export function createMockCommandInterface(options?: {
  /** Custom file read response */
  fsReadFile?: Uint8Array;
  /** Whether to simulate compilation errors */
  simulateErrors?: boolean;
}): CommandInterface {
  // Create stdout handler storage
  let stdoutHandler: ((message: string) => void) | null = null;

  const defaultExecutable = options?.fsReadFile || new Uint8Array([
    0x4D, 0x5A, // MZ signature
    0x90, 0x00, 0x03, 0x00, 0x00, 0x00,
    0x04, 0x00, 0x00, 0x00, 0xFF, 0xFF,
    0x00, 0x00, 0xB8, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x40, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  ]);

  return {
    fsWriteFile: vi.fn().mockResolvedValue(undefined),
    fsReadFile: vi.fn().mockResolvedValue(defaultExecutable),
    fsDeleteFile: vi.fn().mockResolvedValue(undefined),
    fsTree: vi.fn().mockResolvedValue({ nodes: {} }),
    fsExists: vi.fn().mockResolvedValue(true),
    fsIsDirectory: vi.fn().mockResolvedValue(false),
    fsReaddir: vi.fn().mockResolvedValue([]),
    fsMkdir: vi.fn().mockResolvedValue(undefined),
    simulateKeyPress: vi.fn((...keyCodes: number[]) => {
      // When Enter is pressed, simulate command execution
      if (keyCodes.includes(13) && stdoutHandler) {
        setTimeout(() => {
          if (options?.simulateErrors) {
            stdoutHandler!('Open Watcom C16 Compiler Version 2.0\n');
            stdoutHandler!('Compiling source file...\n');
            stdoutHandler!('SOURCE.C(5): Error! E1011: Symbol \'printf\' has not been declared\n');
            stdoutHandler!('<<<COMPILE_ERROR>>>\n');
            stdoutHandler!('C:\\>\n');
          } else {
            stdoutHandler!('Open Watcom C16 Compiler Version 2.0\n');
            stdoutHandler!('Compiling source file...\n');
            stdoutHandler!('<<<COMPILE_SUCCESS>>>\n');
            stdoutHandler!('C:\\>\n');
            stdoutHandler!('Linking object files...\n');
            stdoutHandler!('<<<LINK_SUCCESS>>>\n');
            stdoutHandler!('C:\\>\n');
          }
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
}

