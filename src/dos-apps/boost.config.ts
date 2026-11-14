/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * Boost Configuration
 * Configuration for running Boost by Doomsday (1997)
 */

import { presets } from '../utils/dosboxConfigBuilder';

/**
 * Boost (hosted locally)
 * Doomsday's demo that won the PC demo competition at Assembly '97, in its final version
 *
 * Source: https://files.scene.org/get/parties/1997/assembly97/demo/boostfin.zip
 * License: free to copy and distribute if no money is charged (BOOST.NFO; see
 * public/demos/README.md)
 */
export const boostZipUrl = '/demos/boost.zip';

/**
 * DOSBox configuration for Boost
 *
 * Boost requirements (BOOST.NFO):
 * - A Pentium, "strongly recommended"; it might run on a fast 486
 * - About 12 MB of memory, or 8 MB when started with -pfs
 * - A video card with low-resolution hi-color modes through VESA: it runs in 320x200 at 15 or
 *   16 bits, and falls back to an 8-bit mode that its NFO says looks very bad
 * - For music, a sound card MIDAS 1.1.1 drives: Gravis UltraSound, Audio Pro Spectrum,
 *   Windows Sound System or Sound Blaster, which it detects by itself
 *
 * This configuration uses:
 * - The demo preset's simple CPU core, at maximum cycles
 * - A Gravis UltraSound, which MIDAS picks, and the preset's Sound Blaster 16
 * - The preset's SVGA machine (svga_s3), whose VESA modes give it hi-color
 * - DOSBox's default 16 MB of memory, with EMS/XMS enabled
 */
export const boostDosboxConf = presets
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
    'echo   Boost',
    'echo   by Doomsday (1997)',
    'echo ========================================',
    'echo.',
    "echo 1st Place at Assembly '97",
    'echo.',
    'echo Code by Doom and MRI',
    'echo Music by Illusion and Swallow',
    'echo.',
    'echo Audio: Gravis UltraSound + Sound Blaster 16',
    'echo CPU: Maximum Cycles',
    'echo.',
    'echo Mounting C: drive...',
    'mount c .',
    'c:',
    'echo.',
    'echo Starting Boost...',
    'echo.',
    'BOOST.EXE'
  )
  .build();

/** The config under the name the registry reads */
export { boostDosboxConf as dosboxConf };
