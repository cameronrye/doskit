/**
 * Tests for packing files into a ZIP bundle js-dos unpacks
 */

import { describe, it, expect } from 'vitest';
import { crc32, zipFiles } from './zipFiles';
import { zipEntryNames } from './dosNames';

describe('crc32', () => {
  it("gives the ZIP format's CRC-32", () => {
    // The check value of CRC-32, and "hello"
    expect(crc32(new TextEncoder().encode('123456789'))).toBe(0xcbf43926);
    expect(crc32(new TextEncoder().encode('hello'))).toBe(0x3610a686);
  });
});

describe('zipFiles', () => {
  const files = [
    { path: 'MYSONG.IT', contents: new Uint8Array([1, 2, 3]) },
    { path: 'TUNE.S3M', contents: new TextEncoder().encode('SCRM') },
  ];

  it('packs the files, stored, under their names', () => {
    const zip = zipFiles(files);

    expect(String.fromCharCode(...zip.subarray(0, 4))).toBe('PK\x03\x04');
    expect(zipEntryNames(zip)).toEqual(['MYSONG.IT', 'TUNE.S3M']);
  });

  it("keeps each file's bytes as they are, after its header", () => {
    const zip = zipFiles(files);
    const view = new DataView(zip.buffer, zip.byteOffset, zip.byteLength);
    const nameLength = view.getUint16(26, true);

    // Method 0 (stored), the CRC and both sizes of the first file
    expect(view.getUint16(8, true)).toBe(0);
    expect(view.getUint32(14, true)).toBe(crc32(new Uint8Array([1, 2, 3])));
    expect([view.getUint32(18, true), view.getUint32(22, true)]).toEqual([3, 3]);
    expect([...zip.subarray(30 + nameLength, 30 + nameLength + 3)]).toEqual([1, 2, 3]);
  });

  it('packs nothing into an empty archive', () => {
    expect(zipEntryNames(zipFiles([]))).toEqual([]);
  });
});
