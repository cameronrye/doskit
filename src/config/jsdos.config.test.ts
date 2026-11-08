/**
 * Tests for js-dos configuration utilities
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  defaultJsDosConfig,
  mobileJsDosConfig,
  isMobileDevice,
  getDefaultConfig,
} from './jsdos.config';

/**
 * The key names js-dos 8.3.20's on-screen keyboard presses (buttonToCode in its
 * src/window/soft-keyboard.tsx): names in braces, the punctuation it maps itself, and
 * letters, digits, ; [ and ], which it looks up by character code. It logs "Unknown
 * button" for any other name and presses nothing. {layout} and {symbols} switch to the
 * next layout and the next set of labels.
 */
const JS_DOS_KEYS = new Set([
  ...['esc', 'tab', 'lock', 'shift', 'ctrl', 'alt', 'space', 'enter', 'bksp', 'del']
    .concat(['up', 'down', 'left', 'right', 'home', 'end', 'pgup', 'pgdown'])
    .concat(['layout', 'symbols'])
    .map((name) => `{${name}}`),
  ...Array.from({ length: 12 }, (_, i) => `{f${i + 1}}`),
  ...Array.from({ length: 10 }, (_, i) => `{kp${i}}`),
  ...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
  ...[',', '.', "'", ':', ';', '{', '}', '(', ')', '[', ']', '-', '=', '+'],
]);

/**
 * The rows js-dos 8.3.20 renders from a softKeyboardLayout. Its reducer keeps a list
 * whose first element is an array as layouts of columns of rows, and wraps any other list
 * as the rows of one layout with one column. Its keyboard maps over a layout's columns and
 * each column's rows, then splits each row at spaces, so anything else fails to render.
 */
function rowsJsDosRenders(layout: unknown): unknown[] {
  expect(layout).toBeInstanceOf(Array);
  const list = layout as unknown[];
  const layouts = list.length > 0 && Array.isArray(list[0]) ? list : [[list]];
  return layouts.flatMap((columns) => {
    expect(columns).toBeInstanceOf(Array);
    return (columns as unknown[]).flatMap((rows) => {
      expect(rows).toBeInstanceOf(Array);
      return rows as unknown[];
    });
  });
}

/** The keys of every row, as js-dos splits them; an empty row is a gap */
function keysJsDosRenders(layout: unknown): string[] {
  return rowsJsDosRenders(layout).flatMap((row) =>
    typeof row === 'string' && row.length > 0 ? row.split(' ') : []
  );
}

describe('jsdos.config', () => {
  describe('defaultJsDosConfig', () => {
    it('should have correct default settings', () => {
      expect(defaultJsDosConfig.backend).toBe('dosbox');
      expect(defaultJsDosConfig.theme).toBe('dark');
      expect(defaultJsDosConfig.volume).toBe(0.7);
      expect(defaultJsDosConfig.autoStart).toBe(true);
      expect(defaultJsDosConfig.noCloud).toBe(true);
    });

    it('should use WebGL rendering by default', () => {
      expect(defaultJsDosConfig.renderBackend).toBe('webgl');
    });

    it('should have worker thread enabled', () => {
      expect(defaultJsDosConfig.workerThread).toBe(true);
    });

    it('should have offscreen canvas enabled for performance', () => {
      expect(defaultJsDosConfig.offscreenCanvas).toBe(true);
    });

    it('should have correct aspect ratio', () => {
      expect(defaultJsDosConfig.renderAspect).toBe('4/3');
    });
  });

  describe('mobileJsDosConfig', () => {
    it('should extend default config', () => {
      expect(mobileJsDosConfig.backend).toBe('dosbox');
      expect(mobileJsDosConfig.theme).toBe('dark');
    });

    it('should have larger controls for mobile', () => {
      expect(mobileJsDosConfig.scaleControls).toBe(0.4);
      expect(defaultJsDosConfig.scaleControls).toBe(0.3);
    });

    describe('on-screen keyboard', () => {
      it('should give js-dos rows it can render: strings of key names', () => {
        const rows = rowsJsDosRenders(mobileJsDosConfig.softKeyboardLayout);

        expect(rows.length).toBeGreaterThan(0);
        for (const row of rows) {
          expect(typeof row).toBe('string');
        }
      });

      it('should name only keys js-dos can press', () => {
        const keys = keysJsDosRenders(mobileJsDosConfig.softKeyboardLayout);

        expect(keys.length).toBeGreaterThan(0);
        expect(keys.filter((key) => !JS_DOS_KEYS.has(key))).toEqual([]);
      });

      it('should offer Esc, function keys, digits, letters, modifiers, Space, Enter and arrows', () => {
        const keys = keysJsDosRenders(mobileJsDosConfig.softKeyboardLayout);

        expect(keys).toEqual(
          expect.arrayContaining(
            ['{esc}', '{f1}', '{f2}', '{f3}', '{f5}', '1', '5', 'q', 'a', 'z']
              .concat(['{ctrl}', '{alt}', '{space}', '{enter}'])
              .concat(['{up}', '{down}', '{left}', '{right}'])
          )
        );
      });

      it('should label keys by the names the layout gives them', () => {
        const keys = new Set(keysJsDosRenders(mobileJsDosConfig.softKeyboardLayout));
        const symbols = mobileJsDosConfig.softKeyboardSymbols ?? [];

        expect(symbols.length).toBeGreaterThan(0);
        for (const labels of symbols) {
          expect(Object.keys(labels).filter((key) => !keys.has(key))).toEqual([]);
        }
        expect(symbols[0]).toEqual({ '{up}': '↑', '{down}': '↓', '{left}': '←', '{right}': '→' });
      });
    });
  });

  describe('isMobileDevice', () => {
    let originalUserAgent: string;

    beforeEach(() => {
      originalUserAgent = navigator.userAgent;
    });

    afterEach(() => {
      Object.defineProperty(navigator, 'userAgent', {
        value: originalUserAgent,
        writable: true,
      });
    });

    it('should detect Android devices', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36',
        writable: true,
      });
      expect(isMobileDevice()).toBe(true);
    });

    it('should detect iPhone devices', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        writable: true,
      });
      expect(isMobileDevice()).toBe(true);
    });

    it('should detect iPad devices', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X)',
        writable: true,
      });
      expect(isMobileDevice()).toBe(true);
    });

    it('should not detect desktop as mobile', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        writable: true,
      });
      expect(isMobileDevice()).toBe(false);
    });
  });

  describe('getDefaultConfig', () => {
    let originalUserAgent: string;

    beforeEach(() => {
      originalUserAgent = navigator.userAgent;
    });

    afterEach(() => {
      Object.defineProperty(navigator, 'userAgent', {
        value: originalUserAgent,
        writable: true,
      });
    });

    it('should return mobile config for mobile devices', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        writable: true,
      });
      const config = getDefaultConfig();
      expect(config.scaleControls).toBe(0.4);
      expect(config.softKeyboardLayout).toBeDefined();
    });

    it('should return default config for desktop', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        writable: true,
      });
      const config = getDefaultConfig();
      expect(config.scaleControls).toBe(0.3);
      expect(config.softKeyboardLayout).toBeUndefined();
    });
  });
});
