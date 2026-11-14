/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * Inconexia Configuration
 * Configuration for running the Inconexia demo by Iguana (1993)
 */

import { presets } from '../utils/dosboxConfigBuilder';

/**
 * Inconexia demo (hosted locally)
 * Iguana's trackmo, made for Assembly '93 but not shown there, as updated in October 1993
 *
 * Source: https://files.scene.org/view/mirrors/hornet/demos/1993/i/inconexi.zip
 * License: free to distribute (its setup screen); its main tune is not Iguana's (see
 * public/demos/README.md)
 */
export const inconexiaZipUrl = '/demos/inconexia.zip';

/**
 * DOSBox configuration optimized for Inconexia
 *
 * Inconexia requirements (FILE_ID.DIZ and README.TOO):
 * - A 386 or better, and VGA graphics
 * - A Sound Blaster, Sound Blaster Pro or Sound Blaster 16 ASP, a Gravis UltraSound, or a Pro
 *   Audio Spectrum in Sound Blaster mode; its setup reads BLASTER and ULTRASND
 *
 * This configuration uses:
 * - Fixed cycles (30000) on the simple CPU core, the demo() preset's
 * - A Sound Blaster Pro 2 at 220, IRQ 7, DMA 1: on a Sound Blaster 16 its music stops and its
 *   museum part waits for ever, and with a Gravis UltraSound its first part hangs
 * - A plain VGA (machine vgaonly): on DOSBox's default SVGA machine its greetings scroller is
 *   garbled
 * - DOSBox's default 16 MB of memory
 */
export const inconexiaDosboxConf = presets
  .demo()
  .setMachine({ machine: 'vgaonly' })
  .setSoundBlaster({ sbtype: 'sbpro2' })
  .addAutoexec(
    '@echo off',
    'echo.',
    'echo ========================================',
    'echo   Inconexia',
    'echo   by Iguana (1993)',
    'echo ========================================',
    'echo.',
    "echo Made for Assembly '93, not shown there",
    'echo Code by JCAB, Jare and ARM, graphics by COI',
    'echo.',
    'echo Audio: Sound Blaster Pro 2',
    'echo CPU: 30000 cycles',
    'echo Graphics: plain VGA',
    'echo.',
    'echo Mounting C: drive...',
    'mount c .',
    'c:',
    'echo.',
    'echo Starting Inconexia...',
    'echo.',
    'INCONEXI.EXE'
  )
  .build();

/** The config under the name the registry reads */
export { inconexiaDosboxConf as dosboxConf };
