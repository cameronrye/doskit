/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 */

import { describe, expect, it } from 'vitest';
import { describeProgress } from './describeProgress';

describe('describeProgress', () => {
  it('says the download is starting until the first progress arrives', () => {
    expect(describeProgress(null)).toEqual({ percent: null, text: 'Starting download…' });
  });

  // As loadZipArchive reports at its request, and for an answer that gives no size
  it('says the download is starting while neither bytes nor a size have arrived', () => {
    expect(describeProgress({ loadedBytes: 0, totalBytes: null })).toEqual({
      percent: null,
      text: 'Starting download…',
    });
  });

  it('gives the share downloaded when the size is known', () => {
    expect(describeProgress({ loadedBytes: 913_000, totalBytes: 2_000_000 })).toEqual({
      percent: 45,
      text: 'Downloading… 45%',
    });
  });

  it('says 0% once the size is known and before any bytes', () => {
    expect(describeProgress({ loadedBytes: 0, totalBytes: 2_000_000 })).toEqual({
      percent: 0,
      text: 'Downloading… 0%',
    });
  });

  // Rounded down, so that 100% means every byte is in
  it('says 100% only once every byte is in, and never more', () => {
    expect(describeProgress({ loadedBytes: 1_999_999, totalBytes: 2_000_000 }).percent).toBe(99);
    expect(describeProgress({ loadedBytes: 2_000_000, totalBytes: 2_000_000 }).percent).toBe(100);
    expect(describeProgress({ loadedBytes: 2_500_000, totalBytes: 2_000_000 }).percent).toBe(100);
  });

  it('gives the megabytes received, with no share, when the size is unknown', () => {
    expect(describeProgress({ loadedBytes: 1_250_000, totalBytes: null })).toEqual({
      percent: null,
      text: 'Downloading… 1.3 MB',
    });
  });
});
