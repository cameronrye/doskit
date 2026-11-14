/**
 * Tests for js-dos's key codes, by the names app data files give them
 */

import { describe, it, expect } from 'vitest';
import { dosKey, isDosKeyName } from './dosKeys';

describe('dosKey', () => {
  it('names the letters and digits by themselves, with their GLFW codes', () => {
    expect(dosKey.A).toBe(65);
    expect(dosKey.Z).toBe(90);
    // blind's setup takes 1, 4 and 2; MONOTONE's 1, 0 and 4
    expect(['0', '1', '4', '9'].map((name) => dosKey[name as '0' | '1' | '4' | '9'])).toEqual([
      48, 49, 52, 57,
    ]);
  });

  it('knows only the names it has', () => {
    expect(isDosKeyName('7')).toBe(true);
    expect(isDosKeyName('Enter')).toBe(true);
    expect(isDosKeyName('10')).toBe(false);
    expect(isDosKeyName('toString')).toBe(false);
  });
});
