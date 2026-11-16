/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 */

import { describe, expect, it } from 'vitest';
import { playLabelOf } from './playLabel';

describe('playLabelOf', () => {
  it('says Start for a tracker, Read for the diskmag and Play for the rest', () => {
    expect(playLabelOf('tracker')).toBe('Start');
    expect(playLabelOf('diskmag')).toBe('Read');
    expect(playLabelOf('demo')).toBe('Play');
  });
});
