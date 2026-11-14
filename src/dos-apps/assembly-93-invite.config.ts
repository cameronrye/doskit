/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * Assembly '93 Invitation Intro Configuration
 * Configuration for running Future Crew's invitation intro to Assembly '93 (1993)
 */

import { presets } from '../utils/dosboxConfigBuilder';

/**
 * Assembly '93 Invitation Intro (hosted locally)
 * Future Crew's invitation to Assembly '93, released on 15 June 1993
 *
 * Source: https://files.scene.org/view/demos/groups/future_crew/intros/asm-93.zip
 * License: Freeware, by Future Crew's information files (see public/demos/README.md)
 */
export const assembly93InviteZipUrl = '/demos/assembly-93-invite.zip';

/**
 * DOSBox configuration for the Assembly '93 Invitation Intro
 *
 * Its requirements (readme.1st):
 * - A fast 386 and a fast VGA board; it runs in 640x480 with 16 colors
 * - Sound Blaster, Sound Blaster Pro or Gravis UltraSound, which it tries to detect
 *
 * This configuration uses:
 * - The demo preset: the simple CPU core at a fixed 30000 cycles
 * - A Gravis UltraSound, which it finds and plays through with no setup screen; without one
 *   it asks for a mixing rate
 * - The preset's Sound Blaster 16
 * - DOSBox's default 16 MB of memory
 */
export const assembly93InviteDosboxConf = presets
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
    "echo   Assembly '93 Invitation Intro",
    'echo   by Future Crew (1993)',
    'echo ========================================',
    'echo.',
    'echo Code by Trug, music by Purple Motion',
    'echo Graphics by Marvel',
    'echo.',
    'echo Audio: Gravis UltraSound + Sound Blaster 16',
    'echo CPU: 30000 cycles',
    'echo.',
    'echo Mounting C: drive...',
    'mount c .',
    'c:',
    'echo.',
    "echo Starting the Assembly '93 Invitation Intro...",
    'echo.',
    'ASM-93.EXE'
  )
  .build();

/** The config under the name the registry reads */
export { assembly93InviteDosboxConf as dosboxConf };
