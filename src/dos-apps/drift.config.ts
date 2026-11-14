/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * Drift Configuration
 * Configuration for running Drift by Wild Light (1995)
 */

import { presets } from '../utils/dosboxConfigBuilder';

/**
 * Drift (hosted locally)
 * Wild Light's 64K intro that won the PC 64K intro competition at Assembly '95
 *
 * Source: https://files.scene.org/view/parties/1995/assembly95/in64/drift.zip
 * License: free to copy for non-commercial use; "not freeware" (DRIFT.TXT; see
 * public/demos/README.md)
 */
export const driftZipUrl = '/demos/drift.zip';

/**
 * DOSBox configuration for Drift
 *
 * Drift requirements (DRIFT.TXT):
 * - A 386 and 4 MB of memory; a 486/66 with a fast graphics card and a GUS recommended
 * - For music, a Gravis UltraSound, Sound Blaster or Sound Blaster Pro, chosen in its setup
 *
 * This configuration uses:
 * - The demo preset: the simple CPU core at a fixed 30000 cycles
 * - A Gravis UltraSound at 240h, IRQ 5, DMA 3, which DosKit picks in its setup. Its Sound
 *   Blaster Pro choice did not work on the emulated Sound Blaster 16.
 * - The preset's Sound Blaster 16
 * - DOSBox's default 16 MB of memory
 */
export const driftDosboxConf = presets
  .demo()
  .setGUS({
    gus: true,
    gusbase: 240,
    gusirq: 5,
    gusdma: 3,
    ultradir: 'C:\\ULTRASND',
  })
  .addAutoexec(
    '@echo off',
    'echo.',
    'echo ========================================',
    'echo   Drift',
    'echo   by Wild Light (1995)',
    'echo ========================================',
    'echo.',
    "echo 1st Place, 64K intro, Assembly '95",
    'echo Code by Asmu and Vulture, music by Nobody',
    'echo Graphics by Odd Monk and Preacher',
    'echo.',
    'echo Audio: Gravis UltraSound + Sound Blaster 16',
    'echo CPU: 30000 cycles',
    'echo.',
    'echo Mounting C: drive...',
    'mount c .',
    'c:',
    'echo.',
    'echo Starting Drift...',
    'echo.',
    'DRIFT.EXE'
  )
  .build();

/** The config under the name the registry reads */
export { driftDosboxConf as dosboxConf };
