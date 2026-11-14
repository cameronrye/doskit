/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * StarPort BBS Intro Configuration
 * Configuration for running the first StarPort BBS intro by Future Crew (1992)
 */

import { presets } from '../utils/dosboxConfigBuilder';

/**
 * StarPort BBS Intro (hosted locally)
 * Future Crew's first intro for StarPort, their home BBS, with AdLib music
 *
 * Source: https://files.scene.org/get/demos/groups/future_crew/intros/starprt1.zip
 * License: Freeware (Future Crew's FCINFO files; see public/demos/README.md)
 */
export const starportBbstro1ZipUrl = '/demos/starport-bbstro-1.zip';

/**
 * DOSBox configuration for StarPort BBS Intro
 *
 * StarPort BBS Intro requirements (Future Crew's release list: "VGA/AdLib"):
 * - A VGA: it draws its text on a 640x350, 16-color graphics screen
 * - An AdLib-compatible card, for its music
 *
 * This configuration uses:
 * - The demo preset's simple CPU core at a fixed 30000 cycles
 * - The preset's Sound Blaster 16, whose FM chip plays its AdLib music
 * - Standard VGA graphics
 */
export const starportBbstro1DosboxConf = presets
  .demo()
  .addAutoexec(
    '@echo off',
    'echo.',
    'echo ========================================',
    'echo   StarPort BBS Intro',
    'echo   by Future Crew (1992)',
    'echo ========================================',
    'echo.',
    'echo Code by Psi, music by Purple Motion',
    'echo.',
    'echo Audio: Sound Blaster 16',
    'echo CPU: 30000 cycles',
    'echo Graphics: VGA',
    'echo.',
    'echo Mounting C: drive...',
    'mount c .',
    'c:',
    'echo.',
    'echo Starting StarPort BBS Intro...',
    'echo.',
    'STARPORT.EXE'
  )
  .build();

/** The config under the name the registry reads */
export { starportBbstro1DosboxConf as dosboxConf };
