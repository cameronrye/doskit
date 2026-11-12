/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * Scream Tracker 3 Configuration
 * Configuration for running Scream Tracker 3.21, a music tracker for DOS (1994)
 */

import { presets } from '../utils/dosboxConfigBuilder';

/**
 * Scream Tracker 3.21 (hosted locally)
 * Future Crew's music tracker, for which the S3M module format was made
 *
 * Source: https://archive.org/details/scrmt321_202207
 * License: Freeware
 * Released: December 25, 1994
 */
export const screamTrackerZipUrl = '/demos/scream-tracker.zip';

/**
 * DOSBox configuration optimized for Scream Tracker 3
 *
 * Scream Tracker 3 requirements (ST3.DOC, section 1.2):
 * - At least a 386SX, and a VGA display (it runs in text mode)
 * - Sound card: Sound Blaster, Sound Blaster Pro or Gravis Ultrasound; its FM options work only
 *   on the Sound Blasters
 * - Some EMS, where it keeps the samples, even with a GUS
 *
 * This configuration uses:
 * - Fixed cycles (12000) on the simple CPU core
 * - A Sound Blaster 16 and a Gravis UltraSound, two of the cards ST3.DOC names. ST3 looks for
 *   a card when it starts and plays through the GUS ("Output: CARD:Gravis Ultrasound IO:240").
 * - DOSBox's default 16 MB of memory, with EMS/XMS enabled
 */
export const screamTrackerDosboxConf = presets
  .musicTracker()
  .setCPU({ core: 'simple', cputype: 'auto', cycles: 12000 })
  .setSoundBlaster({
    sbtype: 'sb16',
    sbbase: 220,
    irq: 7,
    dma: 1,
    hdma: 5,
    oplmode: 'auto',
  })
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
    'echo   Scream Tracker 3.21',
    'echo   by Future Crew (1994)',
    'echo ========================================',
    'echo.',
    'echo Where the S3M module format began',
    'echo Code by Psi (Sami Tammilehto)',
    'echo.',
    'echo CPU: 12000 cycles',
    'echo Audio: Sound Blaster 16 + Gravis UltraSound',
    'echo.',
    'echo Mounting C: drive...',
    'mount c .',
    'c:',
    'echo.',
    'echo Starting Scream Tracker 3...',
    'echo.',
    'ST3.EXE'
  )
  .build();

/** The config under the name the registry reads */
export { screamTrackerDosboxConf as dosboxConf };
