/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * Assembly '94 Invitation Dentro Configuration
 * Configuration for running the Assembly '94 Invitation Dentro by Future Crew and Sonic PC (1994)
 */

import { presets } from '../utils/dosboxConfigBuilder';

/**
 * Assembly '94 Invitation Dentro (hosted locally)
 * Future Crew and Sonic PC's second invitation to Assembly '94, released on 3 July 1994, with a
 * small Space Invaders game
 *
 * Source: https://files.scene.org/view/demos/groups/future_crew/intros/asm-94_2.zip
 * License: Freeware (README.1ST; see public/demos/README.md)
 */
export const assembly94InviteZipUrl = '/demos/assembly-94-invite.zip';

/**
 * DOSBox configuration for the Assembly '94 Invitation Dentro
 *
 * Its requirements (README.1ST):
 * - A 386 and around 570,000 bytes of free memory
 * - Sound Blaster, Sound Blaster Pro or Gravis UltraSound, which it tries to detect, or which
 *   its -c switch picks: -c2 is the Gravis UltraSound
 *
 * This configuration uses:
 * - The demo preset: the simple CPU core at a fixed 30000 cycles
 * - A Gravis UltraSound, which -c2 picks
 * - The preset's Sound Blaster 16
 * - Its -q switch, "Quick mode - runs thru both parts automatically"
 * - DOSBox's default 16 MB of memory
 *
 * Its second part, with the game, whose ship the arrow keys move, loops until Escape.
 */
export const assembly94InviteDosboxConf = presets
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
    "echo   Assembly '94 Invitation Dentro",
    'echo   by Future Crew and Sonic PC (1994)',
    'echo ========================================',
    'echo.',
    'echo Code by Mik of Sonic PC',
    'echo Music by Skaven, graphics by Marvel',
    'echo.',
    'echo Audio: Gravis UltraSound + Sound Blaster 16',
    'echo CPU: 30000 cycles',
    'echo.',
    'echo Mounting C: drive...',
    'mount c .',
    'c:',
    'echo.',
    "echo Starting the Assembly '94 Invitation Dentro...",
    'echo.',
    'ASM-94_2.EXE -q -c2'
  )
  .build();

/** The config under the name the registry reads */
export { assembly94InviteDosboxConf as dosboxConf };
