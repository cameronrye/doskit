/**
 * Tests for the sizes the selector shows
 */

import { describe, it, expect } from 'vitest';
import { formatSize } from './formatSize';

describe('formatSize', () => {
  it.each([
    [1_482, '1.5 KB'],
    [2_991, '3.0 KB'],
    [9_949, '9.9 KB'],
    [21_014, '21 KB'],
    [183_556, '184 KB'],
    [916_997, '917 KB'],
    [999_499, '999 KB'],
    [1_047_473, '1.0 MB'],
    [2_122_910, '2.1 MB'],
  ])('shows %d bytes as %s', (bytes, shown) => {
    expect(formatSize(bytes)).toBe(shown);
  });

  it('shows bytes under a kilobyte as bytes', () => {
    expect(formatSize(512)).toBe('512 B');
  });
});
