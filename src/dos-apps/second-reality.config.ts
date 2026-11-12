/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * Second Reality Demo Configuration
 * Configuration for running the famous Second Reality demo by Future Crew (1993)
 */

import { presets } from '../utils/dosboxConfigBuilder';

/**
 * DOSBox configuration optimized for Second Reality
 *
 * Second Reality requirements (README.1ST):
 * - 386 CPU minimum, a 486 and a fast VGA card recommended
 * - Sound card, chosen in its setup: Gravis UltraSound, Sound Blaster or Sound Blaster Pro, or
 *   no sound
 * - Memory: 570,000 bytes conventional, and 1 MB of EMS with a Sound Blaster (none with a GUS)
 *
 * This configuration uses:
 * - Gravis UltraSound (the backend's always has 1 MB of memory, and js-dos plays its sound in
 *   mono)
 * - A fixed 24000 cycles on the simple CPU core, about a 486DX2-66, the machine its setup
 *   says it was made for ("33Mhz 486 computers"). At 'max' it showed the default VGA palette
 *   for about 12 s near 1:30 in most runs; at 24000 it never did, and its timeline stays
 *   within about 1% of a capture made on a real 486DX2-66.
 * - DOSBox's default 16 MB of memory, with EMS/XMS enabled
 * - Sound Blaster 16 too, for the setup's other card
 */
export const secondRealityDosboxConf = presets
  .demo()
  .setCPU({ core: 'simple', cputype: 'auto', cycles: 24000 })
  .setGUS({
    gus: true,
    gusbase: 240,
    gusirq: 5,
    gusdma: 3,
    ultradir: 'C:\\ULTRASND',
  })
  .setJoystick({ joysticktype: 'none' })
  .addAutoexec(
    '@echo off',
    'echo.',
    'echo ========================================',
    'echo   Second Reality by Future Crew (1993)',
    'echo ========================================',
    'echo.',
    'echo Audio: Gravis UltraSound',
    'echo CPU: 24000 cycles',
    'echo.',
    'echo Mounting C: drive...',
    'mount c .',
    'c:',
    'echo.',
    'echo Starting Second Reality...',
    'echo.',
    'SECOND.EXE'
  )
  .build();

/**
 * Second Reality compiled demo (hosted locally)
 * This is the actual compiled demo (not source code)
 * Originally from Archive.org, now hosted locally to avoid CORS issues
 *
 * Source: https://archive.org/details/demoscene_SecondReality-FutureCrew
 * File: 2nd_real.zip (2.1 MB)
 * Contains: SECOND.EXE, REALITY.FC, README.1ST, FCINFO10.TXT, FILE_ID.DIZ
 */
export const secondRealityZipUrl = '/demos/second-reality.zip';

/** The config under the name the registry reads */
export { secondRealityDosboxConf as dosboxConf };
