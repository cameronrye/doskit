/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * Chaotic Mind Configuration
 * Configuration for running Chaotic Mind, Skaven's musicdisk for Future Crew (1994)
 */

import { presets } from '../utils/dosboxConfigBuilder';

/**
 * Chaotic Mind (hosted locally)
 * Skaven's musicdisk, released by Future Crew on 20 February 1994
 *
 * Source: https://files.scene.org/view/mirrors/hornet/music/disks/1994/chmind.zip
 * License: Freeware (FCINFO13.TXT; see public/demos/README.md)
 */
export const chaoticMindZipUrl = '/demos/chaotic-mind.zip';

/**
 * DOSBox configuration for Chaotic Mind
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
export const chaoticMindDosboxConf = presets
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
    'echo   Chaotic Mind by Future Crew',
    'echo   1994 - Music by Skaven',
    'echo ========================================',
    'echo.',
    'echo Audio: Gravis UltraSound + Sound Blaster 16',
    'echo CPU: 30000 cycles',
    'echo.',
    'echo Mounting C: drive...',
    'mount c .',
    'c:',
    'echo.',
    'echo Starting Chaotic Mind...',
    'echo.',
    'MDP.EXE'
  )
  .build();

/** The config under the name the registry reads */
export { chaoticMindDosboxConf as dosboxConf };
