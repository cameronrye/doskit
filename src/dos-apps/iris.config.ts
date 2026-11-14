/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * Iris Configuration
 * Configuration for running Iris, a plasma effect by Jare of VangeliSTeam (1993)
 */

import { presets } from '../utils/dosboxConfigBuilder';

/**
 * Iris (hosted locally)
 * Jare's plasma effect of May 1993, with its source
 *
 * Source: https://files.scene.org/view/demos/compilations/lost_found_and_more/iris.zip
 * License: public domain, by Iguana's RELEASES.TXT (see public/demos/README.md)
 */
export const irisZipUrl = '/demos/iris.zip';

/**
 * DOSBox configuration optimized for Iris
 *
 * Iris requirements (IRIS.ASM):
 * - VGA graphics: it draws its plasma in an unchained 320x200 mode
 * - No sound card: it has no sound
 *
 * This configuration uses:
 * - Fixed cycles (30000) on the simple CPU core, the demo() preset's
 * - Standard VGA graphics
 * - cd BIG, the folder that holds the release of May 1993. The IRIS.EXE beside it is a later
 *   build by an unknown hand, which prints "Cool message goes here" in place of the credits.
 */
export const irisDosboxConf = presets
  .demo()
  .addAutoexec(
    '@echo off',
    'echo.',
    'echo ========================================',
    'echo   Iris',
    'echo   by Jare of VangeliSTeam (1993)',
    'echo ========================================',
    'echo.',
    'echo A plasma effect, with its source',
    'echo.',
    'echo CPU: 30000 cycles',
    'echo Graphics: VGA',
    'echo.',
    'echo Mounting C: drive...',
    'mount c .',
    'c:',
    'cd BIG',
    'echo.',
    'echo Starting Iris...',
    'echo.',
    'IRIS.EXE'
  )
  .build();

/** The config under the name the registry reads */
export { irisDosboxConf as dosboxConf };
