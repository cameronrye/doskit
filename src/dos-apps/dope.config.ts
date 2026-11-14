/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * Dope Configuration
 * Configuration for running Dope by Complex (1995)
 */

import { presets } from '../utils/dosboxConfigBuilder';

/**
 * Dope by Complex (hosted locally)
 * Complex's demo that won the PC demo competition at The Gathering '95, in its final release
 *
 * Source: https://files.scene.org/get/parties/1995/thegathering95/demo/clx_dope.zip
 * License: none found (see public/demos/README.md)
 */
export const dopeZipUrl = '/demos/dope.zip';

/**
 * DOSBox configuration for Dope
 *
 * Dope requirements (DOPE.TXT):
 * - 550 KB of base memory and 600 KB of extended memory
 * - A Gravis UltraSound with 512 KB of memory, for the music
 *
 * This configuration uses:
 * - The demo preset's simple CPU core and auto CPU type, at maximum cycles: at a fixed 30000
 *   its later parts fall seconds behind a capture made on a Pentium III with a Gravis
 *   UltraSound, and at 'max' they keep pace within a few seconds
 * - Gravis UltraSound at 240h, IRQ 5, DMA 3, the only card it plays through, and the preset's
 *   Sound Blaster 16
 * - DOSBox's default SVGA machine and 16 MB of memory, with EMS, XMS and UMB enabled
 */
export const dopeDosboxConf = presets
  .demo()
  .setCPU({ cycles: 'max' })
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
    'echo   Dope',
    'echo   by Complex (1995)',
    'echo ========================================',
    'echo.',
    "echo 1st Place at The Gathering '95",
    'echo Code by jmagic, graphics and music by jugi',
    'echo.',
    'echo Audio: Gravis UltraSound + Sound Blaster 16',
    'echo CPU: Maximum Cycles',
    'echo.',
    'echo Mounting C: drive...',
    'mount c .',
    'c:',
    'echo.',
    'echo Starting Dope...',
    'echo.',
    'DOPE.EXE'
  )
  .build();

/** The config under the name the registry reads */
export { dopeDosboxConf as dosboxConf };
