/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * Timeless Configuration
 * Configuration for running the Timeless demo by Tran (1994)
 */

import { presets } from '../utils/dosboxConfigBuilder';

/**
 * Timeless demo (hosted locally)
 * Tran's demo of February 1994, which he made alone in 32-bit protected-mode assembly
 *
 * Source: https://files.scene.org/view/mirrors/hornet/demos/1994/t/timeless.zip
 * License: free to distribute and use, with all its files, unmodified (TIMELESS.DOC)
 */
export const timelessZipUrl = '/demos/timeless.zip';

/**
 * DOSBox configuration optimized for Timeless
 *
 * Timeless requirements (FILE_ID.DIZ and TIMELESS.DOC):
 * - A 386 or better. It redraws the whole screen every frame, so the speed of the video card
 *   counts, and it picks one of three background resolutions to suit the machine.
 * - A Sound Blaster or a Gravis UltraSound
 *
 * This configuration uses:
 * - Fixed cycles (30000) on the simple CPU core, the demo() preset's
 * - A Gravis UltraSound at 240, IRQ 5, DMA 3, which its /S343 switch picks, so that it starts
 *   with no sound card menu; the preset's Sound Blaster 16 stays
 * - /L1, which plays the demo once and then shows its end screen and returns to DOS: without
 *   it, the demo loops until Escape
 * - DOSBox's default 16 MB of memory
 */
export const timelessDosboxConf = presets
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
    'echo   Timeless',
    'echo   by Tran (1994)',
    'echo ========================================',
    'echo.',
    'echo Design, code, graphics and music by Tran',
    'echo.',
    'echo Audio: Gravis UltraSound',
    'echo CPU: 30000 cycles',
    'echo.',
    'echo Mounting C: drive...',
    'mount c .',
    'c:',
    'echo.',
    'echo Starting Timeless...',
    'echo.',
    'TIMELESS.EXE /S343 /L1'
  )
  .build();

/** The config under the name the registry reads */
export { timelessDosboxConf as dosboxConf };
