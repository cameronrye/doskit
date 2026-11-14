/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * The Globe Configuration
 * Configuration for running The Globe by Jare of VangeliSTeam (1993)
 */

import { presets } from '../utils/dosboxConfigBuilder';

/**
 * The Globe (hosted locally)
 * Jare's PC version of the Globe demo for the Atari ST by Axel of XXX International, whose idea
 * it is, with its source
 *
 * Source: https://files.scene.org/view/mirrors/hornet/code/effects/globe/vtglobe.zip
 * License: public domain, by Iguana's RELEASES.TXT (see public/demos/README.md)
 */
export const theGlobeZipUrl = '/demos/the-globe.zip';

/**
 * DOSBox configuration optimized for The Globe
 *
 * The Globe requirements (GLOBE.NFO and GLOBE.ASM):
 * - VGA graphics; it runs in real mode, on "any PC"
 * - No sound card: it has no sound
 *
 * This configuration uses:
 * - Fixed cycles (30000) on the simple CPU core, the demo() preset's
 * - Standard VGA graphics
 *
 * DosKit sends it no keys: the first key stops its cycle of figures and hands the globe to the
 * keyboard.
 */
export const theGlobeDosboxConf = presets
  .demo()
  .addAutoexec(
    '@echo off',
    'echo.',
    'echo ========================================',
    'echo   The Globe',
    'echo   by Jare of VangeliSTeam (1993)',
    'echo ========================================',
    'echo.',
    'echo Idea by Axel of XXX International',
    'echo.',
    'echo CPU: 30000 cycles',
    'echo Graphics: VGA',
    'echo.',
    'echo Mounting C: drive...',
    'mount c .',
    'c:',
    'echo.',
    'echo Starting The Globe...',
    'echo.',
    'GLOBE.EXE'
  )
  .build();

/** The config under the name the registry reads */
export { theGlobeDosboxConf as dosboxConf };
