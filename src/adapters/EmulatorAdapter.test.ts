/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * Tests for Emulator Adapter
 */

import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import { JsDosAdapter, getEmulatorAdapter } from './EmulatorAdapter';
import type { DosFn, DosProps } from '../types/js-dos';

/** The emulators.js script tag js-dos adds, which a test must find */
function emulatorsScript(): HTMLScriptElement {
  const script = document.getElementById('emulators-js');
  if (!(script instanceof HTMLScriptElement)) throw new Error('js-dos added no emulators.js tag');
  return script;
}

/** Let every pending promise callback run */
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('EmulatorAdapter', () => {
  describe('JsDosAdapter', () => {
    let adapter: JsDosAdapter;
    let mockDosProps: DosProps;
    let mockDos: Mock<DosFn>;

    beforeEach(() => {
      adapter = new JsDosAdapter();

      mockDosProps = {
        stop: vi.fn().mockResolvedValue(undefined),
        getVersion: vi.fn().mockReturnValue(['8.3.20', 'dosbox']),
        getToken: vi.fn().mockReturnValue(null),
        setTheme: vi.fn(),
        setLang: vi.fn(),
        setBackend: vi.fn(),
        setBackendLocked: vi.fn(),
        setWorkerThread: vi.fn(),
        setBackground: vi.fn(),
        setFullScreen: vi.fn(),
        setImageRendering: vi.fn(),
        setRenderBackend: vi.fn(),
        setRenderAspect: vi.fn(),
        setSoftFullscreen: vi.fn(),
        setThinSidebar: vi.fn(),
        setScaleControls: vi.fn(),
        setMouseCapture: vi.fn(),
        setMouseSensitivity: vi.fn(),
        setNoCursor: vi.fn(),
        setSoftKeyboardLayout: vi.fn(),
        setSoftKeyboardSymbols: vi.fn(),
        setVolume: vi.fn(),
        setAutoStart: vi.fn(),
        setCountDownStart: vi.fn(),
        setAutoSave: vi.fn(),
        setKiosk: vi.fn(),
        setPaused: vi.fn(),
        setNoCloud: vi.fn(),
        setKey: vi.fn(),
        save: vi.fn().mockResolvedValue(true),
      };

      mockDos = vi.fn<DosFn>().mockReturnValue(mockDosProps);
      window.Dos = mockDos;
    });

    describe('isAvailable', () => {
      it('should return true when window.Dos is available', () => {
        expect(adapter.isAvailable()).toBe(true);
      });

      it('should return false when window.Dos is not available', () => {
        delete window.Dos;
        expect(adapter.isAvailable()).toBe(false);
      });

      it('should return false when window.Dos is not a function', () => {
        // @ts-expect-error - Testing invalid type
        window.Dos = 'not a function';
        expect(adapter.isAvailable()).toBe(false);
      });
    });

    describe('initialize', () => {
      it('should initialize js-dos with provided options', async () => {
        const container = document.createElement('div');
        const options = {
          dosboxConf: '[cpu]\ncore=auto',
          theme: 'dark',
        };

        const result = await adapter.initialize(container, options);

        expect(mockDos).toHaveBeenCalledWith(container, options);
        expect(result).toBe(mockDosProps);
      });

      it('should throw error when js-dos is not available', async () => {
        delete window.Dos;
        const container = document.createElement('div');

        await expect(adapter.initialize(container, {})).rejects.toThrow(
          'js-dos library is not loaded'
        );
      });

      it('should throw error when initialization fails', async () => {
        mockDos.mockImplementation(() => {
          throw new Error('Initialization failed');
        });

        const container = document.createElement('div');

        await expect(adapter.initialize(container, {})).rejects.toThrow(
          'Failed to initialize js-dos: Initialization failed'
        );
      });

      it("keeps js-dos's own error as the cause of the one it throws", async () => {
        const fromJsDos = new Error('Initialization failed');
        mockDos.mockImplementation(() => {
          throw fromJsDos;
        });

        const container = document.createElement('div');

        await expect(adapter.initialize(container, {})).rejects.toHaveProperty('cause', fromJsDos);
      });
    });

    // js-dos 8.3.20 loads its emulators package, emulators.js, through a script tag that its
    // first Dos() call adds (initEmulatorsJs in its src/store/dos.ts). A later call that
    // finds the tag reads the emulators global at once: before the script has run, that is
    // "Unable to init emulators.js ReferenceError: emulators is not defined", and that
    // player never starts.
    describe('while emulators.js loads', () => {
      /** The emulators global as each Dos() call that found the tag read it */
      let emulatorsFound: unknown[];

      beforeEach(() => {
        emulatorsFound = [];
        mockDos.mockImplementation(() => {
          if (document.getElementById('emulators-js')) {
            emulatorsFound.push(window.emulators);
          } else {
            const script = document.createElement('script');
            script.id = 'emulators-js';
            script.src = '/emulators/emulators.js';
            document.head.append(script);
          }
          return mockDosProps;
        });
      });

      afterEach(() => {
        document.getElementById('emulators-js')?.remove();
        delete window.emulators;
      });

      /** emulators.js runs, which defines the global, and its tag fires load */
      const runEmulatorsJs = () => {
        window.emulators = { version: '8.3.8' };
        emulatorsScript().dispatchEvent(new Event('load'));
      };

      const start = () => adapter.initialize(document.createElement('div'), {});

      it('starts js-dos again only once emulators.js has run', async () => {
        const startPage = start();
        const pick = start();
        await settle();

        expect(mockDos).toHaveBeenCalledTimes(1);

        runEmulatorsJs();

        await expect(pick).resolves.toBe(mockDosProps);
        await expect(startPage).resolves.toBe(mockDosProps);
        expect(mockDos).toHaveBeenCalledTimes(2);
        expect(emulatorsFound).toEqual([window.emulators]);
      });

      // js-dos would add document listeners for it that it never removes, and take the
      // keyboard lock from the player that stays
      it('never starts js-dos for a start aborted while it waits for emulators.js', async () => {
        const startPage = start();
        const controller = new AbortController();
        const pick = adapter.initialize(document.createElement('div'), {}, controller.signal);
        await settle();

        controller.abort();
        runEmulatorsJs();

        await expect(pick).rejects.toThrow(expect.objectContaining({ name: 'AbortError' }));
        await expect(startPage).resolves.toBe(mockDosProps);
        expect(mockDos).toHaveBeenCalledTimes(1);
      });

      it('starts js-dos at once when emulators.js has already run', async () => {
        const startPage = start();
        runEmulatorsJs();
        await startPage;

        void start();

        expect(mockDos).toHaveBeenCalledTimes(2);
        expect(emulatorsFound).toEqual([window.emulators]);
      });

      it('fails a start that waits for emulators.js, with a clear error, if it cannot load', async () => {
        const startPage = start();
        const pick = start();

        emulatorsScript().dispatchEvent(new Event('error'));

        const error =
          'The DOS emulator could not be loaded: /emulators/emulators.js failed to download';
        await expect(pick).rejects.toThrow(error);
        await expect(startPage).rejects.toThrow(error);
        expect(mockDos).toHaveBeenCalledTimes(1);
      });

      it('fails a start that waits for emulators.js if the script defines no emulator', async () => {
        const startPage = start();
        const pick = start();

        // Served something else, such as a page, the script runs without defining the global
        emulatorsScript().dispatchEvent(new Event('load'));

        const error =
          'The DOS emulator could not be loaded: /emulators/emulators.js ran but did not set up the emulator';
        await expect(pick).rejects.toThrow(error);
        await expect(startPage).rejects.toThrow(error);
        expect(mockDos).toHaveBeenCalledTimes(1);
      });

      // js-dos shows its own error for that player, under the page's "Loading DOS
      // emulator...", and sends no event for it
      describe('for the start that adds the tag', () => {
        it('hands back the player only once emulators.js has run', async () => {
          let handedBack = false;
          const startPage = start().then((player) => {
            handedBack = true;
            return player;
          });
          await settle();

          expect(mockDos).toHaveBeenCalledTimes(1);
          expect(handedBack).toBe(false);

          runEmulatorsJs();

          await expect(startPage).resolves.toBe(mockDosProps);
          expect(mockDosProps.stop).not.toHaveBeenCalled();
        });

        it('fails with a clear error, and stops the player, if emulators.js cannot load', async () => {
          const startPage = start();

          emulatorsScript().dispatchEvent(new Event('error'));

          await expect(startPage).rejects.toThrow(
            'The DOS emulator could not be loaded: /emulators/emulators.js failed to download'
          );
          expect(mockDosProps.stop).toHaveBeenCalledTimes(1);
        });
      });

      // js-dos would take the failed tag for a loaded package, as above
      it('loads emulators.js again for a start made after it failed to load', async () => {
        const startPage = start();
        const failed = emulatorsScript();
        failed.dispatchEvent(new Event('error'));
        await expect(startPage).rejects.toThrow('The DOS emulator could not be loaded');

        const retry = start();

        expect(mockDos).toHaveBeenCalledTimes(2);
        expect(emulatorsFound).toEqual([]);
        expect(emulatorsScript()).not.toBe(failed);

        runEmulatorsJs();
        await expect(retry).resolves.toBe(mockDosProps);
      });
    });

    describe('getName', () => {
      it('should return "js-dos"', () => {
        expect(adapter.getName()).toBe('js-dos');
      });
    });
  });

  describe('getEmulatorAdapter', () => {
    it('should return a JsDosAdapter instance', () => {
      const adapter = getEmulatorAdapter();
      expect(adapter).toBeInstanceOf(JsDosAdapter);
    });

    it('should return the same adapter instance', () => {
      const adapter1 = getEmulatorAdapter();
      const adapter2 = getEmulatorAdapter();
      expect(adapter1).toBe(adapter2);
    });
  });
});
