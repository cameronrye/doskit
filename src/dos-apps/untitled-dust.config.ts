/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * Untitled Configuration
 * Configuration for running Untitled by Dust (1994)
 */

import { presets } from '../utils/dosboxConfigBuilder';

/**
 * Untitled by Dust (hosted locally)
 * Dust's demo that won the PC demo competition at The Party '93, in its bugfixed release
 *
 * Source: https://files.scene.org/get/parties/1993/theparty93/demo/dust_unt.zip
 * License: Freeware
 */
export const untitledDustZipUrl = '/demos/untitled-dust.zip';

/**
 * DOSBox configuration for Untitled
 *
 * Untitled requirements (UNTITLED.NFO):
 * - A 386, preferably a 486
 * - About 544 KB of base memory and 2360 KB of XMS
 * - Sound, which it can do without: a Gravis UltraSound, a Sound Blaster Pro or a Sound
 *   Blaster, found through the ULTRASND or BLASTER setting
 *
 * This configuration uses:
 * - The demo preset: simple CPU core, auto CPU type, a fixed 30000 cycles
 * - Gravis UltraSound at 240h, IRQ 5, DMA 3, and the preset's Sound Blaster 16
 * - DOSBox's default SVGA machine and 16 MB of memory, with EMS, XMS and UMB enabled
 * - UNTITLED.EXE /NS: the switch its NFO gives for skipping the setup screen, which it then
 *   starts at the dungeon. Its setup's Enter only takes while its own mouse pointer rests on
 *   "start", and DosKit does not capture the mouse.
 */
export const untitledDustDosboxConf = presets
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
    'echo   Untitled',
    'echo   by Dust (1994)',
    'echo ========================================',
    'echo.',
    "echo 1st Place at The Party '93",
    'echo Code by Stone, music by B-Man',
    'echo.',
    'echo Audio: Gravis UltraSound + Sound Blaster 16',
    'echo CPU: 30000 cycles',
    'echo.',
    'echo Mounting C: drive...',
    'mount c .',
    'c:',
    'echo.',
    'echo Starting Untitled...',
    'echo.',
    'UNTITLED.EXE /NS'
  )
  .build();

/** The config under the name the registry reads */
export { untitledDustDosboxConf as dosboxConf };
