/**
 * Tests for the fingerprints of the emulator's frames
 */

import { describe, it, expect } from 'vitest';
import { fnv1a } from './frameHash';

describe('fnv1a', () => {
  it('gives the 32-bit FNV-1a of every byte', () => {
    // Reference values of FNV-1a: the empty string, "a" and "foobar"
    expect(fnv1a(new Uint8Array())).toBe(0x811c9dc5);
    expect(fnv1a(new TextEncoder().encode('a'))).toBe(0xe40c292c);
    expect(fnv1a(new TextEncoder().encode('foobar'))).toBe(0xbf9cf968);
  });
});
