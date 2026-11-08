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
 * - Maximum cycles (best performance) on the simple CPU core
 * - DOSBox's default 16 MB of memory, with EMS/XMS enabled
 * - Sound Blaster as fallback
 *
 * Based on Archive.org's working configuration and Second Reality README.1ST
 */
export const secondRealityDosboxConf = presets
  .demo()
  .setCPU({ core: 'simple', cputype: 'auto', cycles: 'max' })
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
    'echo CPU: Maximum Cycles',
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
