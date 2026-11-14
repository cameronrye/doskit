/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * Assembly '94 Pre-Invitation Intro Configuration
 * Configuration for running the Assembly '94 Pre-Invitation Intro by Future Crew and Sonic PC (1994)
 */

import { presets } from '../utils/dosboxConfigBuilder';

/**
 * Assembly '94 Pre-Invitation Intro (hosted locally)
 * Future Crew and Sonic PC's pre-invitation to Assembly '94, released on 8 April 1994
 *
 * Source: https://files.scene.org/view/mirrors/hornet/party/invites/1994/asm-94.zip
 * License: Freeware (README.1ST; see public/demos/README.md)
 */
export const assembly94PreinviteZipUrl = '/demos/assembly-94-preinvite.zip';

/**
 * DOSBox configuration for the Assembly '94 Pre-Invitation Intro
 *
 * Its requirements (README.1ST):
 * - A 386 and around 570,000 bytes of free memory; it runs in VCPI mode under Tran's PMODE
 * - Sound Blaster, Sound Blaster Pro, ProAudio Spectrum+ or Gravis UltraSound, chosen in a
 *   menu when it starts, which also offers GUS autodetection
 *
 * This configuration uses:
 * - The demo preset: the simple CPU core at a fixed 30000 cycles
 * - A Gravis UltraSound and no Sound Blaster (sbtype none), as it was vetted: Enter at its
 *   sound card menu takes autodetection, which finds the GUS
 * - DOSBox's default 16 MB of memory
 */
export const assembly94PreinviteDosboxConf = presets
  .demo()
  .setSoundBlaster({ sbtype: 'none' })
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
    "echo   Assembly '94 Pre-Invitation Intro",
    'echo   by Future Crew and Sonic PC (1994)',
    'echo ========================================',
    'echo.',
    'echo Code by Mik of Sonic PC',
    'echo Music by Purple Motion, graphics by Marvel',
    'echo.',
    'echo Audio: Gravis UltraSound',
    'echo CPU: 30000 cycles',
    'echo.',
    'echo Mounting C: drive...',
    'mount c .',
    'c:',
    'echo.',
    "echo Starting the Assembly '94 Pre-Invitation Intro...",
    'echo.',
    'ASM-94.EXE'
  )
  .build();

/** The config under the name the registry reads */
export { assembly94PreinviteDosboxConf as dosboxConf };
