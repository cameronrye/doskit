/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * js-dos's key codes, which are GLFW's: printable keys by their ASCII code (letters as
 * capitals), the others from 256 up. ci.sendKeyEvent() takes these.
 */

const letters = Object.fromEntries(
  Array.from({ length: 26 }, (_, i) => [String.fromCharCode(65 + i), 65 + i])
) as Record<
  | 'A'
  | 'B'
  | 'C'
  | 'D'
  | 'E'
  | 'F'
  | 'G'
  | 'H'
  | 'I'
  | 'J'
  | 'K'
  | 'L'
  | 'M'
  | 'N'
  | 'O'
  | 'P'
  | 'Q'
  | 'R'
  | 'S'
  | 'T'
  | 'U'
  | 'V'
  | 'W'
  | 'X'
  | 'Y'
  | 'Z',
  number
>;

export const dosKey = {
  ...letters,
  Space: 32,
  Escape: 256,
  Enter: 257,
  Tab: 258,
  Backspace: 259,
  Right: 262,
  Left: 263,
  Down: 264,
  Up: 265,
  PageUp: 266,
  PageDown: 267,
  Home: 268,
  End: 269,
  F1: 290,
  F2: 291,
  F3: 292,
  F4: 293,
  F5: 294,
  F6: 295,
  F7: 296,
  F8: 297,
  F9: 298,
  F10: 299,
  LeftShift: 340,
  LeftCtrl: 341,
  LeftAlt: 342,
} as const;

/** A key's name, as app data files give it */
export type DosKeyName = keyof typeof dosKey;

export function isDosKeyName(name: string): name is DosKeyName {
  return Object.hasOwn(dosKey, name);
}
