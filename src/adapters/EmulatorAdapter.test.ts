/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * Tests for Emulator Adapter
 */

import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { JsDosAdapter, getEmulatorAdapter } from './EmulatorAdapter';
import type { DosProps } from '../types/js-dos';

describe('EmulatorAdapter', () => {
  describe('JsDosAdapter', () => {
    let adapter: JsDosAdapter;
    let mockDosProps: DosProps;
    let mockDos: Mock<Window['Dos']>;

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

      mockDos = vi.fn<Window['Dos']>().mockReturnValue(mockDosProps);
      window.Dos = mockDos;
    });

    describe('isAvailable', () => {
      it('should return true when window.Dos is available', () => {
        expect(adapter.isAvailable()).toBe(true);
      });

      it('should return false when window.Dos is not available', () => {
        delete (window as Partial<Window>).Dos;
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
        delete (window as Partial<Window>).Dos;
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
