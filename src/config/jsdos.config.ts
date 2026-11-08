/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * js-dos configuration settings
 * Centralized configuration for the DOS emulator
 */

import type { DosOptions } from '../types/js-dos';

/**
 * Default js-dos configuration
 * Optimized for performance and audio quality
 * Based on research of WebAssembly, DOSBox, and browser optimization techniques
 */
export const defaultJsDosConfig: Partial<DosOptions> = {
  // Emulator Settings
  // The DOSBox configs in src/config/dosbox.conf.ts and src/dos-apps/ are written for this
  // backend: they only use settings it applies
  backend: 'dosbox', // Use DOSBox for better performance (20-40% faster than DOSBox-X)
  backendLocked: false, // js-dos shows its backend picker only before a run; autoStart skips that
  workerThread: true, // Use worker thread for non-blocking UI (HIGH impact)

  // Display Settings
  theme: 'dark',
  imageRendering: 'pixelated', // Authentic DOS look + 5-15% performance gain
  renderBackend: 'webgl', // WebGL for 2-5x rendering performance vs Canvas 2D
  renderAspect: '4/3', // Classic DOS aspect ratio
  fullScreen: false,
  softFullscreen: true, // Better cross-platform fullscreen support

  // Input Settings
  mouseCapture: false, // Don't auto-capture mouse
  mouseSensitivity: 1.0,
  noCursor: false,

  // Audio Settings
  volume: 0.7, // 70% volume by default

  // Behavior Settings
  autoStart: true, // Auto-start the emulator
  countDownStart: 0, // No countdown
  autoSave: false, // Manual save control
  kiosk: false, // Show UI controls

  // UI Settings
  lang: 'en',
  thinSidebar: false,

  // Cloud/Network Settings
  noCloud: true, // Disable cloud features by default

  // Advanced Settings
  pathPrefix: '/emulators/', // Local WASM files (copied from node_modules/js-dos/dist/emulators)
};

/**
 * The on-screen keyboard's layouts, each a list of columns of rows of key names separated by
 * spaces (see SoftKeyboardLayout in src/types/js-dos.d.ts for the names). Its {layout} key,
 * labelled ⎘, switches to the next layout, and from the last back to the first.
 */
const softKeyboardLayout: string[][][] = [
  // DosKit's compact layout, which fits upright phones: the keys most programs need
  [
    [
      '{esc} {f1} {f2} {f3} {f5}',
      '1 2 3 4 5 {bksp}',
      'q w e r t',
      'a s d f g',
      'z x c v b',
      '{layout} {ctrl} {alt} {space} {enter}',
      '{up}',
      '{left} {down} {right}',
    ],
  ],
  // js-dos 8.3.20's own two layouts, which its keyboard shows unless given others
  // (softKeyboardLayout in its src/store/dos.ts): the full keyboard first, then function keys
  // and a keypad. Three of its keys do not press what they show: js-dos presses nothing for \
  // and / and keypad 0 for `. It reads a one-character name as the browser key code equal to
  // its character code, and the browser's codes for those keys are those of Ü, ¿ and À, so
  // here those are their names, which the labels below show as \ / and `. Its {symbols} key,
  // which switches to its labels in Russian, is left out: DosKit gives one set of labels.
  [
    [
      '{esc} À 1 2 3 4 5 6 7 8 9 0 ( ) - = {bksp} {enter}',
      '{tab} q w e r t y u i o p { } Ü [ ] {up}',
      "{shift} {left} {right} a s d f g h j k l : ; ' [ {down}",
      '{layout} {alt} {ctrl} z x c v b n m , . ¿ ] {space}',
    ],
  ],
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
];

/**
 * Labels for the keys, by key name: js-dos 8.3.20's own (the first of its two sets, in its
 * src/store/dos.ts) but for {symbols}, and \ / and ` for the keys named Ü, ¿ and À. A key
 * without one shows its name, capitalised and without braces ({ctrl} shows Ctrl).
 */
const softKeyboardSymbols: Record<string, string>[] = [
  {
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
    Ü: '\\',
    '¿': '/',
    À: '`',
  },
];

/**
 * Mobile-optimized configuration
 */
export const mobileJsDosConfig: Partial<DosOptions> = {
  ...defaultJsDosConfig,
  softFullscreen: true,
  mouseCapture: false,
  // The on-screen keyboard behind the keyboard button in the js-dos sidebar: DosKit's compact
  // layout first, then js-dos's own two
  softKeyboardLayout,
  softKeyboardSymbols,
};

/**
 * Detect if the user is on a mobile device
 */
export function isMobileDevice(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * Get the appropriate configuration based on the environment
 */
export function getDefaultConfig(): Partial<DosOptions> {
  if (isMobileDevice()) {
    return mobileJsDosConfig;
  }
  return defaultJsDosConfig;
}
