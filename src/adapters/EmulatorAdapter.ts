/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * Emulator Adapter Interface
 * Provides an abstraction layer for DOS emulator implementations
 * This decouples the application from specific emulator libraries (js-dos, etc.)
 */

import type { DosOptions, DosProps } from '../types/js-dos';

/**
 * Interface for emulator adapters
 * Allows swapping emulator implementations without changing application code
 */
export interface EmulatorAdapter {
  /**
   * Check if the emulator is available
   * @returns true if the emulator can be initialized
   */
  isAvailable(): boolean;

  /**
   * Initialize the emulator
   * @param container - The HTML element to render the emulator into
   * @param options - Configuration options for the emulator
   * @returns A promise that resolves to the emulator instance
   */
  initialize(container: HTMLDivElement, options: Partial<DosOptions>): Promise<DosProps>;

  /**
   * Get the name of the emulator implementation
   * @returns The emulator name (e.g., 'js-dos', 'dosbox-wasm')
   */
  getName(): string;

  /**
   * Get the version of the emulator
   * @returns The emulator version string
   */
  getVersion(): string;
}

/**
 * js-dos Emulator Adapter
 * Adapter for the js-dos v8 emulator library
 */
export class JsDosAdapter implements EmulatorAdapter {
  /**
   * Check if js-dos is available on window
   */
  isAvailable(): boolean {
    return typeof window !== 'undefined' && typeof window.Dos === 'function';
  }

  /**
   * Initialize js-dos emulator
   */
  async initialize(container: HTMLDivElement, options: Partial<DosOptions>): Promise<DosProps> {
    if (!this.isAvailable()) {
      throw new Error('js-dos library is not loaded. Please ensure the script is included.');
    }

    try {
      // Initialize js-dos synchronously (it returns DosProps immediately)
      const dosProps = window.Dos(container, options);
      return Promise.resolve(dosProps);
    } catch (error) {
      throw new Error(
        `Failed to initialize js-dos: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get the adapter name
   */
  getName(): string {
    return 'js-dos';
  }

  /**
   * Get the js-dos version
   */
  getVersion(): string {
    if (!this.isAvailable()) {
      return 'unknown';
    }

    let tempContainer: HTMLDivElement | null = null;
    let dosProps: DosProps | null = null;

    try {
      // Create a temporary container to get version
      tempContainer = document.createElement('div');
      tempContainer.style.display = 'none';
      document.body.appendChild(tempContainer);

      dosProps = window.Dos(tempContainer, {});
      const [version] = dosProps.getVersion();

      return version;
    } catch {
      return 'unknown';
    } finally {
      // Always cleanup, even if an error occurs
      if (dosProps) {
        try {
          dosProps.stop();
        } catch {
          // Ignore stop errors during cleanup
        }
      }
      if (tempContainer && tempContainer.parentNode) {
        tempContainer.parentNode.removeChild(tempContainer);
      }
    }
  }
}

/**
 * Default emulator adapter instance
 * Uses js-dos as the default implementation
 */
export const defaultEmulatorAdapter: EmulatorAdapter = new JsDosAdapter();

/**
 * Get the current emulator adapter
 * This can be extended to support multiple adapters or adapter selection
 */
export function getEmulatorAdapter(): EmulatorAdapter {
  // For now, always return the js-dos adapter
  // In the future, this could check environment variables or configuration
  // to select different adapters (e.g., dosbox-wasm, v86, etc.)
  return defaultEmulatorAdapter;
}
