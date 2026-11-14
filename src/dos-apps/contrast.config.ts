/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * Contrast Configuration
 * Configuration for running Contrast by TFL-TDV (1994)
 */

import { presets } from '../utils/dosboxConfigBuilder';

/**
 * Contrast by TFL-TDV (hosted locally)
 * TFL-TDV's demo, second in the PC demo competition at Wired '94, in its fixed release
 *
 * Source: https://files.scene.org/get/mirrors/hornet/demos/1994/c/contrast.zip
 * License: MIT, from Type One's repository, github.com/type-one/t1-1994-contrast, and the
 * MIDAS Sound System license, section 3 (see public/demos/README.md)
 */
export const contrastZipUrl = '/demos/contrast.zip';

/**
 * DOSBox configuration for Contrast
 *
 * Contrast requirements (TECH.DOC):
 * - A 386 or better, and a VGA that is fully register-compatible, a VLB one better
 * - 600 KB of conventional memory
 * - A Gravis UltraSound, Sound Blaster, Sound Blaster Pro, Sound Blaster 16, Pro Audio
 *   Spectrum or Windows Sound System, which MIDAS Sound System finds; EMS with any of them
 *   but the Gravis UltraSound
 *
 * This configuration uses:
 * - The demo preset: simple CPU core, auto CPU type, a fixed 30000 cycles
 * - Gravis UltraSound at 240h, IRQ 5, DMA 3, which MIDAS finds, and the preset's Sound
 *   Blaster 16
 * - A plain VGA (machine vgaonly), which draws the raster gradient of its end screen; DOSBox's
 *   default SVGA machine loses it
 * - DOSBox's default 16 MB of memory, with EMS, XMS and UMB enabled
 */
export const contrastDosboxConf = presets
  .demo()
  .setMachine({ machine: 'vgaonly' })
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
    'echo   Contrast',
    'echo   by TFL-TDV (1994)',
    'echo ========================================',
    'echo.',
    "echo 2nd Place at Wired '94",
    'echo Music by Fred, using MIDAS Sound System',
    'echo.',
    'echo Audio: Gravis UltraSound + Sound Blaster 16',
    'echo CPU: 30000 cycles',
    'echo Graphics: plain VGA (vgaonly)',
    'echo.',
    'echo Mounting C: drive...',
    'mount c .',
    'c:',
    'echo.',
    'echo Starting Contrast...',
    'echo.',
    'CONTRAST.EXE'
  )
  .build();

/** The config under the name the registry reads */
export { contrastDosboxConf as dosboxConf };
