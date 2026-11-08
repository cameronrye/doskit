/**
 * Tests for js-dos configuration utilities
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  defaultJsDosConfig,
  mobileJsDosConfig,
  isMobileDevice,
  getDefaultConfig,
  getStoredSettings,
} from './jsdos.config';

/** js-dos's code for the left Shift key, which it presses with some punctuation */
const SHIFT = 340;

/**
 * What js-dos 8.3.20's on-screen keyboard presses for each key name (buttonToCode in its
 * src/window/soft-keyboard.tsx), in js-dos's key codes (src/window/dos/controls/keys.ts,
 * where a printable key's code is that of the character it types unshifted, a letter's in
 * upper case). It maps the names in braces and some punctuation itself. Any other
 * one-character name it looks up in its table of the browser's key codes, by the name's
 * character code in upper case: that presses the letters, digits, ; [ and ], and also \ for
 * Ü (220), / for ¿ (191) and ` for À (192), the browser's codes for those keys. The table
 * has no 92 or 47, so the names \ and / press nothing, and 96 is keypad 0 there, which the
 * name ` presses. It logs "Unknown button" for a longer name it does not know and presses
 * nothing.
 */
const JS_DOS_KEYS = new Map<string, number[]>([
  ...Object.entries({
    '{esc}': 256,
    '{tab}': 258,
    '{lock}': 280,
    '{shift}': SHIFT,
    '{ctrl}': 341,
    '{alt}': 342,
    '{space}': 32,
    '{enter}': 257,
    '{bksp}': 259,
    '{del}': 261,
    '{up}': 265,
    '{down}': 264,
    '{left}': 263,
    '{right}': 262,
    '{home}': 268,
    '{end}': 269,
    '{pgup}': 266,
    '{pgdown}': 267,
    ',': 44,
    '.': 46,
    "'": 39,
    '-': 45,
    '=': 61,
    ';': 59,
    '[': 91,
    ']': 93,
    Ü: 92,
    '¿': 47,
    À: 96,
  }).map(([name, code]): [string, number[]] => [name, [code]]),
  ...Object.entries({ ':': 59, '{': 91, '}': 93, '(': 57, ')': 48, '+': 61 }).map(
    ([name, code]): [string, number[]] => [name, [SHIFT, code]]
  ),
  ...Array.from({ length: 12 }, (_, i): [string, number[]] => [`{f${i + 1}}`, [290 + i]]),
  ...Array.from({ length: 10 }, (_, i): [string, number[]] => [`{kp${i}}`, [320 + i]]),
  ...[...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'].map(
    (name): [string, number[]] => [name, [name.toUpperCase().charCodeAt(0)]]
  ),
]);

/** The keys that switch js-dos's keyboard to its next layout and its next set of labels */
const SWITCH_KEYS = new Set(['{layout}', '{symbols}']);

/** The characters a US keyboard types unshifted, and those of them js-dos shifts */
const US_CHARACTERS = [..."abcdefghijklmnopqrstuvwxyz0123456789,.'-=;[]\\/` "];
const US_SHIFTED: Record<string, string> = {
  9: '(',
  0: ')',
  ';': ':',
  '[': '{',
  ']': '}',
  '=': '+',
};

/** The character the keys js-dos presses type on a US keyboard, if they type one */
function characterTyped(codes: number[] | undefined): string | undefined {
  const unshifted = (code: number | undefined) =>
    US_CHARACTERS.find((c) => c.toUpperCase().charCodeAt(0) === code);
  if (codes?.length === 1) return unshifted(codes[0]);
  if (codes?.length === 2 && codes[0] === SHIFT) return US_SHIFTED[unshifted(codes[1]) ?? ''];
  return undefined;
}

/**
 * js-dos 8.3.20's own layouts, the ones its keyboard shows unless given a
 * softKeyboardLayout (softKeyboardLayout in the initial state of its src/store/dos.ts): one
 * of function keys, digits, arrows and a keypad, in three columns, and a full keyboard, which
 * its {layout} key switches to
 */
const JS_DOS_LAYOUTS: [string[][], string[][]] = [
  [
    [
      '{esc} {f1} {f2} {f3} {f4}',
      '0 1 2 3 4',
      '5 6 7 8 9',
      '{ } ( ) {shift}',
      '{layout} {ctrl} {alt} {space}',
    ],
    ['{f5} {f6} {f7} {f8}', '{pgup} {pgdown} {bksp}', '', '{up}', '{left} {down} {right}'],
    [
      '{f9} {f10} {f11} {f12}',
      '{del} {kp7} {kp8} {kp9}',
      '{tab} {kp4} {kp5} {kp6}',
      '- {kp1} {kp2} {kp3}',
      '+ {kp0} . {enter}',
    ],
  ],
  [
    [
      '{esc} ` 1 2 3 4 5 6 7 8 9 0 ( ) - = {bksp} {enter}',
      '{tab} q w e r t y u i o p { } \\ [ ] {up}',
      "{shift} {left} {right} a s d f g h j k l : ; ' [ {down}",
      '{layout} {symbols} {alt} {ctrl} z x c v b n m , . / ] {space}',
    ],
  ],
];

/**
 * js-dos 8.3.20's own labels for those keys (softKeyboardSymbols in the same file), the
 * first of its two sets; {symbols} switches to the second, which labels the letters in
 * Russian
 */
const JS_DOS_LABELS: Record<string, string> = {
  '{esc}': '␛',
  '{bksp}': '⌫',
  '{enter}': '↵',
  '{up}': '↑',
  '{down}': '↓',
  '{left}': '←',
  '{right}': '→',
  '{shift}': '⇑',
  '{layout}': '⎘',
  '{pgup}': 'PgUp',
  '{pgdown}': 'PgDown',
  '{kp7}': '↖',
  '{kp8}': '↑',
  '{kp9}': '↗',
  '{kp5}': '5',
  '{kp4}': '←',
  '{kp6}': '→',
  '{kp1}': '↙',
  '{kp2}': '↓',
  '{kp3}': '↘',
  '{kp0}': '0',
  '{symbols}': 'En/Ru',
};

/**
 * The layouts js-dos 8.3.20 renders from a softKeyboardLayout, each a list of columns of
 * rows. Its reducer keeps a list whose first element is an array as layouts of columns of
 * rows, and wraps any other list as the rows of one layout with one column. Its keyboard
 * maps over a layout's columns and each column's rows, then splits each row at spaces, so
 * anything else fails to render.
 */
function layoutsJsDosRenders(layout: unknown): unknown[][][] {
  expect(layout).toBeInstanceOf(Array);
  const list = layout as unknown[];
  const layouts = list.length > 0 && Array.isArray(list[0]) ? list : [[list]];
  return layouts.map((columns) => {
    expect(columns).toBeInstanceOf(Array);
    return (columns as unknown[]).map((rows) => {
      expect(rows).toBeInstanceOf(Array);
      return rows as unknown[];
    });
  });
}

/** The rows of every layout js-dos renders */
function rowsJsDosRenders(layout: unknown): unknown[] {
  return layoutsJsDosRenders(layout).flat(2);
}

/** The keys of these rows, as js-dos splits them; an empty row is a gap */
function keysOfRows(rows: unknown[]): string[] {
  return rows.flatMap((row) => (typeof row === 'string' && row.length > 0 ? row.split(' ') : []));
}

/** The keys of every layout js-dos renders */
function keysJsDosRenders(layout: unknown): string[] {
  return keysOfRows(rowsJsDosRenders(layout));
}

/** The keys of each layout js-dos renders, layout by layout */
function keysOfEachLayout(layout: unknown): string[][] {
  return layoutsJsDosRenders(layout).map((columns) => keysOfRows(columns.flat()));
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

    it('should have correct aspect ratio', () => {
      expect(defaultJsDosConfig.renderAspect).toBe('4/3');
    });

    // js-dos scales only the touch controls a bundle's .jsdos/jsdos.json defines, and DosKit
    // gives it none
    it('should not set scaleControls, which has nothing to scale', () => {
      expect(defaultJsDosConfig).not.toHaveProperty('scaleControls');
    });
  });

  describe('mobileJsDosConfig', () => {
    it('should extend default config', () => {
      expect(mobileJsDosConfig.backend).toBe('dosbox');
      expect(mobileJsDosConfig.theme).toBe('dark');
    });

    it('should not set scaleControls, which has nothing to scale', () => {
      expect(mobileJsDosConfig).not.toHaveProperty('scaleControls');
    });

    describe('on-screen keyboard', () => {
      const layout = mobileJsDosConfig.softKeyboardLayout;
      const symbols = mobileJsDosConfig.softKeyboardSymbols ?? [];
      /** The label js-dos shows on a key: from the first set of labels, else its name */
      const labelOf = (key: string) => symbols[0]?.[key] ?? key;

      it('should give js-dos rows it can render: strings of key names', () => {
        const rows = rowsJsDosRenders(layout);

        expect(rows.length).toBeGreaterThan(0);
        for (const row of rows) {
          expect(typeof row).toBe('string');
        }
      });

      it('should give several layouts in the form js-dos reads them: columns of rows', () => {
        expect(Array.isArray(layout?.[0])).toBe(true);
        expect(layoutsJsDosRenders(layout).length).toBeGreaterThan(1);
      });

      it('should name only keys js-dos can press', () => {
        const keys = keysJsDosRenders(layout);

        expect(keys.length).toBeGreaterThan(0);
        expect(keys.filter((key) => !JS_DOS_KEYS.has(key) && !SWITCH_KEYS.has(key))).toEqual([]);
      });

      it('should show its compact layout first: Esc, function keys, digits, letters, modifiers, Space, Backspace, Enter and arrows', () => {
        const [compact] = keysOfEachLayout(layout);

        expect(compact).toEqual(
          expect.arrayContaining(
            ['{esc}', '{f1}', '{f2}', '{f3}', '{f5}', '1', '5', 'q', 'a', 'z']
              .concat(['{ctrl}', '{alt}', '{space}', '{bksp}', '{enter}'])
              .concat(['{up}', '{down}', '{left}', '{right}'])
          )
        );
        expect(compact).not.toContain('y');
      });

      it('should let every layout switch to the next, so the layout key comes back to the first', () => {
        for (const keys of keysOfEachLayout(layout)) {
          expect(keys).toContain('{layout}');
        }
      });

      it("should follow the compact layout with js-dos's own, the full keyboard first, naming the keys js-dos cannot press by their own names as it presses them", () => {
        const renamed: Record<string, string> = { '\\': 'Ü', '/': '¿', '`': 'À' };
        const asDosKitHasThem = (rows: string[]) =>
          rows.map((row) =>
            keysOfRows([row])
              .filter((key) => key !== '{symbols}')
              .map((key) => renamed[key] ?? key)
              .join(' ')
          );
        const [fullKeyboard] = JS_DOS_LAYOUTS[1].map(asDosKitHasThem);
        const functionKeys = JS_DOS_LAYOUTS[0].map(asDosKitHasThem);

        expect(layoutsJsDosRenders(layout).slice(1)).toEqual([[fullKeyboard], functionKeys]);
      });

      it('should let every letter and digit, . : \\ / Backspace and Enter be typed on one layout', () => {
        const typed = keysOfEachLayout(layout).map(
          (keys) => new Set(keys.map((key) => characterTyped(JS_DOS_KEYS.get(key)) ?? key))
        );
        const needed = [...'abcdefghijklmnopqrstuvwxyz0123456789.:\\/'].concat([
          '{bksp}',
          '{enter}',
        ]);

        expect(typed.some((layoutTypes) => needed.every((c) => layoutTypes.has(c)))).toBe(true);
      });

      it('should offer every function key', () => {
        const keys = keysJsDosRenders(layout);

        for (let n = 1; n <= 12; n++) {
          expect(keys).toContain(`{f${n}}`);
        }
      });

      it('should label keys by the names the layout gives them', () => {
        const keys = new Set(keysJsDosRenders(layout));

        expect(symbols.length).toBeGreaterThan(0);
        for (const labels of symbols) {
          expect(Object.keys(labels).filter((key) => !keys.has(key))).toEqual([]);
        }
      });

      it("should label js-dos's keys as js-dos does, the arrows with arrows", () => {
        const keys = keysJsDosRenders(layout);

        for (const key of keys.filter((key) => key in JS_DOS_LABELS)) {
          expect([key, labelOf(key)]).toEqual([key, JS_DOS_LABELS[key]]);
        }
        expect(['{up}', '{down}', '{left}', '{right}'].map(labelOf)).toEqual(['↑', '↓', '←', '→']);
      });

      it('should show on each key that types a character the character it types', () => {
        const keys = keysJsDosRenders(layout).filter((key) => key.length === 1);

        expect(keys.length).toBeGreaterThan(0);
        for (const key of keys) {
          expect([key, labelOf(key)]).toEqual([key, characterTyped(JS_DOS_KEYS.get(key))]);
        }
      });

      it('should have one set of labels, and no key to switch to another', () => {
        expect(symbols).toHaveLength(1);
        expect(keysJsDosRenders(layout)).not.toContain('{symbols}');
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

  // js-dos keeps them in localStorage, reads them only once, when js-dos.js loads, and
  // applies the options each Dos() call gets over them
  describe("getStoredSettings: the choices made in js-dos's settings panel", () => {
    afterEach(() => {
      localStorage.clear();
    });

    it('gives none before the user has made any', () => {
      expect(getStoredSettings()).toEqual({});
    });

    it('gives the volume, mouse sensitivity, aspect ratio, image rendering and theme', () => {
      // As js-dos 8.3.20 stores them
      localStorage.setItem('jsdos.8.volume', '0.20000002119276258');
      localStorage.setItem('jsdos.8.mouse_sensitivity', '0.35');
      localStorage.setItem('jsdos.8.renderAspect', '16/10');
      localStorage.setItem('jsdos.8.imageRendering', 'smooth');
      localStorage.setItem('jsdos.8.theme', 'light');

      expect(getStoredSettings()).toEqual({
        volume: 0.20000002119276258,
        mouseSensitivity: 0.35,
        renderAspect: '16/10',
        imageRendering: 'smooth',
        theme: 'light',
      });
    });

    it('gives each one that is stored, and leaves the others to DosKit', () => {
      localStorage.setItem('jsdos.8.volume', '0');

      expect(getStoredSettings()).toEqual({ volume: 0 });
    });

    it('leaves out values js-dos would not have stored', () => {
      localStorage.setItem('jsdos.8.volume', 'loud');
      localStorage.setItem('jsdos.8.mouse_sensitivity', '1.5');
      localStorage.setItem('jsdos.8.renderAspect', '21/9');
      localStorage.setItem('jsdos.8.imageRendering', 'blurry');
      localStorage.setItem('jsdos.8.theme', '');

      expect(getStoredSettings()).toEqual({});
    });

    it('gives none when the browser refuses storage', () => {
      const original = Object.getOwnPropertyDescriptor(window, 'localStorage')!;
      Object.defineProperty(window, 'localStorage', {
        configurable: true,
        get() {
          throw new DOMException('Access is denied for this document.', 'SecurityError');
        },
      });
      try {
        expect(getStoredSettings()).toEqual({});
      } finally {
        Object.defineProperty(window, 'localStorage', original);
      }
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
      expect(config).toBe(mobileJsDosConfig);
      expect(config.softKeyboardLayout).toBeDefined();
    });

    it('should return default config for desktop', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        writable: true,
      });
      const config = getDefaultConfig();
      expect(config).toBe(defaultJsDosConfig);
      expect(config.softKeyboardLayout).toBeUndefined();
    });
  });
});
