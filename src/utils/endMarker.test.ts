/**
 * Tests for the line that tells DosKit a program has returned to DOS
 */

import { describe, it, expect } from 'vitest';
import { endMarkerFor, withEndMarker } from './endMarker';

describe('endMarkerFor', () => {
  it('is a sentence a visitor may read on the DOS screen', () => {
    expect(endMarkerFor('Second Reality')).toBe('Second Reality has ended.');
  });
});

describe('withEndMarker', () => {
  const conf = '[cpu]\ncycles=24000\n\n[autoexec]\n@echo off\nmount c .\nc:\nSECOND.EXE\n';

  it('prints the marker once the program returns to DOS', () => {
    expect(withEndMarker(conf, 'Second Reality has ended.')).toBe(
      '[cpu]\ncycles=24000\n\n[autoexec]\n@echo off\nmount c .\nc:\nSECOND.EXE\necho.\necho Second Reality has ended.\n'
    );
  });

  it('leaves a config without an autoexec as it is', () => {
    expect(withEndMarker('[cpu]\ncycles=24000\n', 'Stars has ended.')).toBe(
      '[cpu]\ncycles=24000\n'
    );
  });

  it('refuses an autoexec that is not the last section, where the marker would go astray', () => {
    expect(() => withEndMarker('[autoexec]\nSTARS.EXE\n[cpu]\ncycles=1\n', 'x')).toThrow(
      /autoexec/
    );
  });

  it('keeps characters DOS would read as redirection out of the marker', () => {
    expect(withEndMarker('[autoexec]\nA.EXE\n', 'Tom & Jerry <2> | more')).toBe(
      '[autoexec]\nA.EXE\necho.\necho Tom and Jerry 2 more\n'
    );
  });
});
