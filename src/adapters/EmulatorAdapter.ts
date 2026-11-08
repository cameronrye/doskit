/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * Emulator Adapter Interface
 * Provides an abstraction layer for DOS emulator implementations
 * This decouples the application from specific emulator libraries (js-dos, etc.)
 */

import type { DosFn, DosOptions, DosProps } from '../types/js-dos';

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
   * @param signal - Aborted when the emulator is no longer wanted: a start that has not
   *   begun yet then never begins, and rejects with the signal's reason
   * @returns A promise that resolves to the emulator instance
   */
  initialize(
    container: HTMLDivElement,
    options: Partial<DosOptions>,
    signal?: AbortSignal
  ): Promise<DosProps>;

  /**
   * Get the name of the emulator implementation
   * @returns The emulator name (e.g., 'js-dos', 'dosbox-wasm')
   */
  getName(): string;
}

/**
 * Id of the script tag that loads js-dos's emulators package, emulators.js. js-dos 8.3.20's
 * first Dos() call adds it (initEmulatorsJs in its src/store/dos.ts), and every later call
 * that finds it takes the package for loaded and reads the emulators global at once. A
 * player started before the script has run never boots: js-dos logs "Unable to init
 * emulators.js ReferenceError: emulators is not defined" and sends no event for it.
 */
const EMULATORS_SCRIPT_ID = 'emulators-js';

/** How the load of each emulators.js script tag ends: resolved once the script has run */
const emulatorsLoads = new WeakMap<HTMLScriptElement, Promise<void>>();

/**
 * Follow the load of emulators.js, when a start has added its script tag and the emulators
 * global is not there yet. A failed load rejects and takes the tag away, so that the next
 * start adds a new one: js-dos would take the failed tag for a loaded package too.
 * @returns The load, the same for every call while the tag is there, or undefined when
 *   there is nothing to wait for
 */
function emulatorsLoad(): Promise<void> | undefined {
  if (window.emulators !== undefined) return undefined;
  const script = document.getElementById(EMULATORS_SCRIPT_ID);
  if (!(script instanceof HTMLScriptElement)) return undefined;

  let load = emulatorsLoads.get(script);
  if (!load) {
    const src = script.getAttribute('src') ?? 'emulators.js';
    load = new Promise<void>((resolve, reject) => {
      const fail = (reason: string) => {
        script.remove();
        reject(new Error(`The DOS emulator could not be loaded: ${src} ${reason}`));
      };
      script.addEventListener('load', () => {
        if (window.emulators !== undefined) resolve();
        else fail('ran but did not set up the emulator. Reload the page.');
      });
      script.addEventListener('error', () => {
        fail('failed to download. Check your connection, then reload the page.');
      });
    });
    // Each start that waits gets the error; a load that no start waits for fails quietly
    load.catch(() => {});
    emulatorsLoads.set(script, load);
  }
  return load;
}

/** js-dos's Dos(), or undefined while js-dos.js has not run */
function jsDos(): DosFn | undefined {
  return typeof window !== 'undefined' && typeof window.Dos === 'function' ? window.Dos : undefined;
}

/**
 * js-dos Emulator Adapter
 * Adapter for the js-dos v8 emulator library
 */
export class JsDosAdapter implements EmulatorAdapter {
  /**
   * Check whether js-dos.js has run: the page runs without window.Dos when that script fails
   * to download or is blocked
   */
  isAvailable(): boolean {
    return jsDos() !== undefined;
  }

  /**
   * Start js-dos in the container, and hand back its player once emulators.js has run. A
   * start made while emulators.js loads waits for it before calling Dos(), and one aborted
   * by then never calls it; any other start calls Dos() at once. If emulators.js cannot
   * load, every start that needs it fails, and one that has called Dos() stops its player.
   */
  async initialize(
    container: HTMLDivElement,
    options: Partial<DosOptions>,
    signal?: AbortSignal
  ): Promise<DosProps> {
    const Dos = jsDos();
    if (!Dos) {
      throw new Error('js-dos library is not loaded. Please ensure the script is included.');
    }

    const loading = emulatorsLoad();
    if (loading) await loading;
    // Each Dos() call adds document listeners that js-dos never removes, and takes the
    // keyboard lock from the player before it, so none is made for a player no one wants
    signal?.throwIfAborted();

    let dosProps: DosProps;
    try {
      // js-dos returns the player synchronously
      dosProps = Dos(container, options);
    } catch (error) {
      throw new Error(
        `Failed to initialize js-dos: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }

    // The start that added the tag follows the load from here, so that a later start learns
    // how it ended even when that was before it asked, and waits for it too: js-dos shows a
    // failed load only in its own window, under the player's loading panel, and sends no
    // event for it
    const added = emulatorsLoad();
    if (added) {
      try {
        await added;
      } catch (error) {
        dosProps.stop().catch((err: unknown) => {
          console.error('[EmulatorAdapter] Error stopping player:', err);
        });
        throw error;
      }
    }
    return dosProps;
  }

  /**
   * Get the adapter name
   */
  getName(): string {
    return 'js-dos';
  }
}

/**
 * Default emulator adapter instance
 * Uses js-dos as the default implementation
 */
const defaultEmulatorAdapter: EmulatorAdapter = new JsDosAdapter();

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
