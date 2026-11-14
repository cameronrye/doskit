/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * Solstice Configuration
 * Configuration for running Solstice by Valhalla (1995)
 */

import { presets } from '../utils/dosboxConfigBuilder';

/**
 * Solstice by Valhalla (hosted locally)
 * Valhalla's demo that won the PC demo competition at Wired '95
 *
 * Source: https://files.scene.org/get/demos/groups/valhalla/solstice.zip
 * License: "public domain", in its readme's words, free of charge
 */
export const solsticeZipUrl = '/demos/solstice.zip';

/**
 * DOSBox configuration for Solstice
 *
 * Solstice requirements (README.TXT and FILE_ID.DIZ):
 * - A 486, a 486DX2 or better recommended, and a fairly fast VGA
 * - 4 MB of memory
 * - A Gravis UltraSound, Sound Blaster, Sound Blaster Pro, Pro Audio Spectrum or Windows
 *   Sound System, chosen in its MIDAS sound setup
 *
 * This configuration uses:
 * - The demo preset: simple CPU core, auto CPU type, a fixed 30000 cycles
 * - Gravis UltraSound at 240h, IRQ 5, DMA 3, which its sound setup takes with three Enters,
 *   and the preset's Sound Blaster 16
 * - DOSBox's default SVGA machine and 16 MB of memory, with EMS, XMS and UMB enabled
 */
export const solsticeDosboxConf = presets
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
    'echo   Solstice',
    'echo   by Valhalla (1995)',
    'echo ========================================',
    'echo.',
    "echo 1st Place at Wired '95",
    'echo Code by Sandman, music by Big Jim',
    'echo.',
    'echo Audio: Gravis UltraSound + Sound Blaster 16',
    'echo CPU: 30000 cycles',
    'echo.',
    'echo Mounting C: drive...',
    'mount c .',
    'c:',
    'echo.',
    'echo Starting Solstice...',
    'echo.',
    'SOLSTICE.EXE'
  )
  .build();

/** The config under the name the registry reads */
export { solsticeDosboxConf as dosboxConf };
