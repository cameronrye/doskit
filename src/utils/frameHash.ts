/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * A frame's fingerprint: the 32-bit FNV-1a hash of every byte of the RGB frame js-dos hands
 * out. The emulator draws the same bytes for the same screen in every browser and at every
 * window size, so a setup screen can be recognised by its fingerprint alone.
 */

export function fnv1a(bytes: Uint8Array): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < bytes.length; i++) {
    hash ^= bytes[i]!;
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}
