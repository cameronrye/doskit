/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * Adlib Tracker II Configuration
 * Configuration for running Adlib Tracker II G3 2.3.58, an OPL3 music tracker by subz3ro (2026)
 */

import { presets } from '../utils/dosboxConfigBuilder';

/**
 * Adlib Tracker II G3 2.3.58 (hosted locally)
 * subz3ro's tracker for OPL3 FM music, in its rebuild of 2 June 2026, with its songs and
 * instruments
 *
 * Source: https://adlibtracker.net/files/at2g3r58.zip
 * License: GNU GPL v3 or later; its source is at /sources/at2_sourcecode_06-02-2026.zip (see
 * public/demos/README.md)
 */
export const adlibTracker2ZipUrl = '/demos/adlib-tracker-2.zip';

/**
 * DOSBox configuration for Adlib Tracker II
 *
 * Adlib Tracker II requirements (ADTRACK2.DOC, "System Requirements"):
 * - A 386DX, a Pentium recommended, and a VGA card, SVGA recommended
 * - 16 MB of memory or more; REVISION.TXT says 2.3.58 needs "16MB+ for tracker"
 * - A Yamaha YMF262 (OPL3) or compatible sound card
 * - MS-DOS 3.0 or compatible. It runs in protected mode under CWSDPMI, which it ships.
 *
 * This configuration uses:
 * - The musicTracker() preset: fixed cycles (18000) on the simple CPU core, and a Sound
 *   Blaster 16, whose OPL3 it plays through
 * - 32 MB of memory: with DOSBox's default 16 MB it stops with "Insufficient extended memory!"
 * - Its files are in the archive's AT2 folder, which the autoexec changes to before it starts
 *   ADTRACK2.EXE: its file browser first opens in the current folder (dialogio.pas, in its
 *   source), so C:\AT2, where the Files panel puts songs and instruments
 */
export const adlibTracker2DosboxConf = presets
  .musicTracker()
  .setMachine({ memsize: 32 })
  .addAutoexec(
    '@echo off',
    'echo.',
    'echo ========================================',
    'echo   Adlib Tracker II G3 2.3.58',
    'echo   by subz3ro of Altair (2026)',
    'echo ========================================',
    'echo.',
    'echo A tracker for OPL3 FM music',
    'echo.',
    'echo CPU: 18000 cycles',
    'echo Audio: Sound Blaster 16 (OPL3 FM)',
    'echo Memory: 32 MB',
    'echo.',
    'echo Mounting C: drive...',
    'mount c .',
    'c:',
    'cd AT2',
    'echo.',
    'echo Starting Adlib Tracker II...',
    'echo.',
    'ADTRACK2.EXE'
  )
  .build();

/** The config under the name the registry reads */
export { adlibTracker2DosboxConf as dosboxConf };
