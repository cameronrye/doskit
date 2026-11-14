/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * YO! Configuration
 * Configuration for running YO! by Future Crew (1990)
 */

import { presets } from '../utils/dosboxConfigBuilder';

/**
 * YO! (hosted locally)
 * Future Crew's second PC demo, in VGA text mode with PC-speaker music
 *
 * Source: https://files.scene.org/get/demos/groups/future_crew/intros/yo.zip
 * License: Freeware (Future Crew's FCINFO files; see public/demos/README.md). Its tunes are
 * David Whittaker's.
 */
export const yoZipUrl = '/demos/yo.zip';

/**
 * DOSBox configuration for YO!
 *
 * YO! requirements (Future Crew's release list: "VGA textmode/PC-speaker"):
 * - A VGA: it runs in an 80x50 text mode, with the 8x8 font
 * - The PC speaker, for its music
 *
 * This configuration uses:
 * - The demo preset's simple CPU core at a fixed 30000 cycles
 * - The preset's PC speaker, for its music
 * - Standard VGA graphics
 */
export const yoDosboxConf = presets
  .demo()
  .addAutoexec(
    '@echo off',
    'echo.',
    'echo ========================================',
    'echo   YO! by Future Crew (1990)',
    'echo ========================================',
    'echo.',
    'echo Code by Psi, graphics by Hal',
    'echo Music by David Whittaker',
    'echo.',
    'echo Audio: PC speaker',
    'echo CPU: 30000 cycles',
    'echo Graphics: VGA text mode',
    'echo.',
    'echo Mounting C: drive...',
    'mount c .',
    'c:',
    'echo.',
    'echo Starting YO!...',
    'echo.',
    'YO.EXE'
  )
  .build();

/** The config under the name the registry reads */
export { yoDosboxConf as dosboxConf };
