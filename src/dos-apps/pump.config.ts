/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * Pump Configuration
 * Configuration for running the Pump demo by Iguana (1995)
 */

import { presets } from '../utils/dosboxConfigBuilder';

/**
 * Pump demo (hosted locally)
 * Iguana's demo that won the PC demo competition at Euskal Party 1995
 *
 * Source: https://files.scene.org/view/parties/1995/euskal95/demo/pump.zip
 * License: free to distribute unmodified (PUMP.NFO)
 * Released: October 25, 1995
 */
export const pumpZipUrl = '/demos/pump.zip';

/**
 * DOSBox configuration optimized for Pump
 *
 * Pump requirements (README.TXT):
 * - A 486: it has not been tried on a 386, where it would be "slow as hell"
 * - About 2.5 MB of free memory
 * - A Gravis UltraSound or a Sound Blaster, or no sound card; a Sound Blaster needs more
 *   memory, which EMS can give
 *
 * This configuration uses:
 * - Fixed cycles (30000) on the simple CPU core, the demo() preset's
 * - A Gravis UltraSound at 240, IRQ 5, DMA 3, which its setup finds from ULTRASND; the preset's
 *   Sound Blaster 16 stays
 * - SET WINDIR=KK, README.TXT's fix for a demo that goes "jumpy and slow" under Windows: without
 *   it, it runs at less than half its speed here
 * - DOSBox's default 16 MB of memory, with EMS enabled
 */
export const pumpDosboxConf = presets
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
    'echo   Pump by Iguana',
    'echo   1995 - 1st at the Euskal Party',
    'echo ========================================',
    'echo.',
    'echo Code by Jare, Yann and Captain Bit',
    'echo Music by Noisy Man',
    'echo.',
    'echo Audio: Gravis UltraSound',
    'echo CPU: 30000 cycles',
    'echo.',
    'echo Mounting C: drive...',
    'mount c .',
    'c:',
    'SET WINDIR=KK',
    'echo.',
    'echo Starting Pump...',
    'echo.',
    'PUMP.EXE'
  )
  .build();

/** The config under the name the registry reads */
export { pumpDosboxConf as dosboxConf };
