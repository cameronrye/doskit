/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * Mental Surgery Configuration
 * Configuration for running the Mental Surgery demo by Future Crew (1991)
 */

import { presets } from '../utils/dosboxConfigBuilder';

/**
 * Mental Surgery (hosted locally)
 * Future Crew's demo of July 1991, with four-channel Sound Blaster music
 *
 * Source: https://files.scene.org/get/demos/groups/future_crew/demos/mental_s.zip
 * License: Freeware (Future Crew's FCINFO files; see public/demos/README.md)
 */
export const mentalSurgeryZipUrl = '/demos/mental-surgery.zip';

/**
 * DOSBox configuration for Mental Surgery
 *
 * Mental Surgery requirements (MENTAL.EXE):
 * - "an AT class computer with VGA installed"
 * - For sound, a Sound Blaster, whose I/O address and IRQ (2, 3, 5 or 7) its setup asks for;
 *   Future Crew's release list also names Covox and the PC speaker
 *
 * This configuration uses:
 * - The demo preset's simple CPU core at a fixed 30000 cycles
 * - The preset's Sound Blaster 16 at 220h, IRQ 7, the answers DosKit gives its setup
 * - Standard VGA graphics
 */
export const mentalSurgeryDosboxConf = presets
  .demo()
  .addAutoexec(
    '@echo off',
    'echo.',
    'echo ========================================',
    'echo   Mental Surgery by Future Crew (1991)',
    'echo ========================================',
    'echo.',
    'echo Code by Psi, graphics by Dr. Venkman',
    'echo Music by Lord Soth',
    'echo.',
    'echo Audio: Sound Blaster 16',
    'echo CPU: 30000 cycles',
    'echo Graphics: VGA',
    'echo.',
    'echo Mounting C: drive...',
    'mount c .',
    'c:',
    'echo.',
    'echo Starting Mental Surgery...',
    'echo.',
    'MENTAL.EXE'
  )
  .build();

/** The config under the name the registry reads */
export { mentalSurgeryDosboxConf as dosboxConf };
