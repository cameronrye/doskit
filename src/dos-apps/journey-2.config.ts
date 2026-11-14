/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * Journey 2 Configuration
 * Configuration for running Journey 2, Purple Motion's musicdisk for Future Crew (1993)
 */

import { presets } from '../utils/dosboxConfigBuilder';

/**
 * Journey 2 (hosted locally)
 * The second part of Journey, Purple Motion's musicdisk, released by Future Crew at The Party 1993
 *
 * Source: https://files.scene.org/view/mirrors/hornet/music/disks/1993/journey2.zip
 * License: Freeware (FCINFO12.TXT; see public/demos/README.md)
 */
export const journey2ZipUrl = '/demos/journey-2.zip';

/**
 * DOSBox configuration for Journey 2
 *
 * Its requirements (MDP.DOC):
 * - A Gravis UltraSound, a Sound Blaster Pro or a Sound Blaster: its player, MDP.EXE, looks for
 *   them in that order
 *
 * This configuration uses:
 * - The demo preset: the simple CPU core at a fixed 30000 cycles
 * - A Gravis UltraSound, which the player finds first
 * - The preset's Sound Blaster 16
 * - DOSBox's default 16 MB of memory
 */
export const journey2DosboxConf = presets
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
    'echo   Journey 2 by Future Crew',
    'echo   1993 - Music by Purple Motion',
    'echo ========================================',
    'echo.',
    'echo Released at The Party 1993',
    'echo.',
    'echo Audio: Gravis UltraSound + Sound Blaster 16',
    'echo CPU: 30000 cycles',
    'echo.',
    'echo Mounting C: drive...',
    'mount c .',
    'c:',
    'echo.',
    'echo Starting Journey 2...',
    'echo.',
    'MDP.EXE'
  )
  .build();

/** The config under the name the registry reads */
export { journey2DosboxConf as dosboxConf };
