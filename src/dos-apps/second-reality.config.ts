/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * Second Reality Demo Configuration
 * Configuration for running the famous Second Reality demo by Future Crew (1993)
 */

import { loadZipArchive as loadZip } from '../utils/diskLoader';
import { presets } from '../utils/dosboxConfigBuilder';

// Re-export for lazy loading
export { loadZip as loadZipArchive };

/**
 * DOSBox configuration optimized for Second Reality
 *
 * Second Reality requirements:
 * - 386 CPU minimum, 486+ recommended
 * - VGA graphics
 * - Sound card: Gravis UltraSound (recommended), Sound Blaster, or no sound
 * - Memory: 570KB conventional, 1MB EMS for SB (GUS doesn't need EMS)
 *
 * This configuration uses:
 * - Gravis UltraSound with 512KB stereo memory (optimal audio quality)
 * - Pentium CPU with maximum cycles (best performance)
 * - 16MB RAM with EMS/XMS enabled
 * - Sound Blaster as fallback
 *
 * Based on Archive.org's working configuration and Second Reality README.1ST
 */
export const secondRealityDosboxConf = presets
  .demo()
  .setCPU({ core: 'dynamic', cputype: 'pentium', cycles: 'max' })
  .setMemory({ memsize: 16 })
  .setGUS({
    gus: true,
    gusrate: 44100,
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
    'echo Audio: Gravis UltraSound (512KB Stereo)',
    'echo CPU: Pentium (Maximum Cycles)',
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
