/**
 * Tests for giving a visitor's files names DOS can open
 */

import { describe, it, expect } from 'vitest';
import { dosNameFor, zipEntryNames } from './dosNames';

describe('dosNameFor', () => {
  it.each([
    ['song.it', 'SONG.IT'],
    ['My Cool Song.xm', 'MYCOOLSO.XM'],
    ['axel-f (remix).mod', 'AXEL-F(R.MOD'],
    ['no extension', 'NOEXTENS'],
    ['tune.s3m.bak', 'TUNES3M.BAK'],
    ['ümlaut.it', 'MLAUT.IT'],
    ['.it', 'MODULE.IT'],
  ])('names %s %s', (name, dosName) => {
    expect(dosNameFor(name, new Set())).toBe(dosName);
  });

  it("gives a file a name of its own beside the archive's and the saved ones", () => {
    const taken = new Set(['CHRIS31B.IT', 'SONG.IT', 'SONG~1.IT']);

    expect(dosNameFor('chris31b.it', taken)).toBe('CHRIS3~1.IT');
    expect(dosNameFor('song.it', taken)).toBe('SONG~2.IT');
  });
});

describe('zipEntryNames', () => {
  it('reads the names in a ZIP archive, upper case as DOS sees them', async () => {
    // A ZIP with two stored entries, made by hand: local headers, central directory, end record
    const entries = ['ST3.EXE', 'armani.s3m'];
    const encoder = new TextEncoder();
    const parts: number[] = [];
    const central: number[] = [];
    const u16 = (n: number) => [n & 0xff, (n >> 8) & 0xff];
    const u32 = (n: number) => [...u16(n & 0xffff), ...u16(n >>> 16)];
    for (const name of entries) {
      const bytes = [...encoder.encode(name)];
      const offset = parts.length;
      parts.push(
        ...u32(0x04034b50),
        ...Array(22).fill(0),
        ...u16(bytes.length),
        ...u16(0),
        ...bytes
      );
      central.push(
        ...u32(0x02014b50),
        ...Array(24).fill(0),
        ...u16(bytes.length),
        ...u16(0),
        ...u16(0),
        ...Array(8).fill(0),
        ...u32(offset),
        ...bytes
      );
    }
    const centralOffset = parts.length;
    const zip = new Uint8Array([
      ...parts,
      ...central,
      ...u32(0x06054b50),
      ...u16(0),
      ...u16(0),
      ...u16(entries.length),
      ...u16(entries.length),
      ...u32(central.length),
      ...u32(centralOffset),
      ...u16(0),
    ]);

    expect(zipEntryNames(zip)).toEqual(['ST3.EXE', 'ARMANI.S3M']);
  });

  it('reads nothing from bytes that are no ZIP archive', () => {
    expect(zipEntryNames(new Uint8Array([1, 2, 3]))).toEqual([]);
  });
});
