/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * Bussimatkaintro 93 Configuration
 * Configuration for running Future Crew's invitation to the bus trip to The Party 1993 (1993)
 */

import { presets } from '../utils/dosboxConfigBuilder';

/**
 * Bussimatkaintro 93 (hosted locally)
 * Future Crew's Finnish invitation to a bus trip from Finland to The Party 1993
 *
 * Source: https://files.scene.org/view/demos/groups/future_crew/intros/busmatka.zip
 * License: Freeware, by Future Crew's information files (see public/demos/README.md)
 */
export const bussimatkaintro93ZipUrl = '/demos/bussimatkaintro-93.zip';

/**
 * DOSBox configuration for Bussimatkaintro 93
 *
 * The archive states no requirements. INTRO.EXE runs in 640x400 and plays its music through a
 * Gravis UltraSound, or through a Sound Blaster without one.
 *
 * This configuration uses:
 * - The demo preset: the simple CPU core at a fixed 30000 cycles
 * - A Gravis UltraSound, which it finds and plays through with no setup screen
 * - The preset's Sound Blaster 16
 * - DOSBox's default 16 MB of memory
 *
 * Down shows its next page, Up the one before, and Escape returns to DOS.
 */
export const bussimatkaintro93DosboxConf = presets
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
    'echo   Bussimatkaintro 93',
    'echo   by Future Crew (1993)',
    'echo ========================================',
    'echo.',
    'echo A bus trip to The Party in Denmark',
    'echo Down: next page, Up: previous page',
    'echo Escape: back to DOS',
    'echo.',
    'echo Audio: Gravis UltraSound + Sound Blaster 16',
    'echo CPU: 30000 cycles',
    'echo.',
    'echo Mounting C: drive...',
    'mount c .',
    'c:',
    'echo.',
    'echo Starting Bussimatkaintro 93...',
    'echo.',
    'INTRO.EXE'
  )
  .build();

/** The config under the name the registry reads */
export { bussimatkaintro93DosboxConf as dosboxConf };
