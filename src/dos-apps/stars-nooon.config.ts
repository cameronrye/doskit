/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * Stars: Wonders of the World Configuration
 * Configuration for running Stars: Wonders of the World by NoooN (1995)
 */

import { presets } from '../utils/dosboxConfigBuilder';

/**
 * Stars: Wonders of the World by NoooN (hosted locally)
 * NoooN's demo that won the PC demo competition at Assembly '95, in its final release
 *
 * Source: https://files.scene.org/get/demos/groups/nooon/nooonstf.zip
 * License: none found (see public/demos/README.md)
 */
export const starsNooonZipUrl = '/demos/stars-nooon.zip';

/**
 * DOSBox configuration for Stars: Wonders of the World
 *
 * Stars requirements (STARS.NFO):
 * - A 386 or better; a 486DX2-66 with VLB or PCI recommended
 * - 2.9 MB of free high memory
 * - A Gravis UltraSound with a valid ULTRASND setting, which it recommends; the final release
 *   also supports the Sound Blaster and Sound Blaster 16, or no sound, and says it runs slower
 *   with a Sound Blaster
 *
 * This configuration uses:
 * - The demo preset: simple CPU core, auto CPU type, a fixed 30000 cycles
 * - Gravis UltraSound at 240h, IRQ 5, DMA 3, and the preset's Sound Blaster 16
 * - DOSBox's default SVGA machine and 16 MB of memory, with EMS, XMS and UMB enabled
 *
 * It takes no start keys, and Space and Escape neither skip nor stop it.
 */
export const starsNooonDosboxConf = presets
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
    'echo   Stars: Wonders of the World',
    'echo   by NoooN (1995)',
    'echo ========================================',
    'echo.',
    "echo 1st Place at Assembly '95",
    'echo Music by Groo',
    'echo.',
    'echo Audio: Gravis UltraSound + Sound Blaster 16',
    'echo CPU: 30000 cycles',
    'echo.',
    'echo Mounting C: drive...',
    'mount c .',
    'c:',
    'echo.',
    'echo Starting Stars: Wonders of the World...',
    'echo.',
    'STARS.EXE'
  )
  .build();

/** The config under the name the registry reads */
export { starsNooonDosboxConf as dosboxConf };
