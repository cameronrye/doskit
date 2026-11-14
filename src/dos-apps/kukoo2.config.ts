/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * Kukoo2 Configuration
 * Configuration for running Kukoo2 by Type One of The FLamoots (1994)
 */

import { presets } from '../utils/dosboxConfigBuilder';

/**
 * Kukoo2 by Type One (hosted locally)
 * Type One's advertising intro for the Pleasure Access BBS, version 2.43 "short"
 *
 * Source: https://files.scene.org/get/mirrors/hornet/demos/1994/k/kukoo2.zip
 * License: MIT, from the author's repository, github.com/type-one/t1-1994-kukoo2 (see
 * public/demos/README.md)
 */
export const kukoo2ZipUrl = '/demos/kukoo2.zip';

/**
 * DOSBox configuration for Kukoo2
 *
 * Kukoo2 requirements (the program, and its author's README of 2022):
 * - A 386 or better, and a VGA: it stops with "Sorry Dude, You must have VGA card" on less
 * - An AdLib-compatible card for its music, and the PC speaker for its pre-intro
 * - In DOSBox, machine=vgaonly
 *
 * This configuration uses:
 * - The demo preset: simple CPU core, auto CPU type, a fixed 30000 cycles
 * - The preset's Sound Blaster 16, whose OPL plays its AdLib music, and its PC speaker
 * - A plain VGA (machine vgaonly): on DOSBox's default SVGA machine its VGA part is garbled
 * - DOSBox's default 16 MB of memory, with EMS, XMS and UMB enabled
 */
export const kukoo2DosboxConf = presets
  .demo()
  .setMachine({ machine: 'vgaonly' })
  .addAutoexec(
    '@echo off',
    'echo.',
    'echo ========================================',
    'echo   Kukoo2',
    'echo   by Type One of The FLamoots (1994)',
    'echo ========================================',
    'echo.',
    'echo An intro for the Pleasure Access BBS',
    'echo Music: Crooner by Drax',
    'echo.',
    'echo Audio: Sound Blaster 16 (AdLib) + PC speaker',
    'echo CPU: 30000 cycles',
    'echo Graphics: plain VGA (vgaonly)',
    'echo.',
    'echo Mounting C: drive...',
    'mount c .',
    'c:',
    'echo.',
    'echo Starting Kukoo2...',
    'echo.',
    'KUKOO2.EXE'
  )
  .build();

/** The config under the name the registry reads */
export { kukoo2DosboxConf as dosboxConf };
