/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * BlasterSound BBS Intro #2 Configuration
 * Configuration for running Iguana's second BlasterSound BBS intro (1994)
 */

import { presets } from '../utils/dosboxConfigBuilder';

/**
 * BlasterSound BBS Intro #2 (hosted locally)
 * Iguana's second intro for BlasterSound, their home BBS, with its source
 *
 * Source: https://files.scene.org/view/mirrors/hornet/demos/1994/b/blaster2.zip
 * License: public domain, by Iguana's RELEASES.TXT (see public/demos/README.md)
 * Size: 8379 bytes
 */
export const blastersound2ZipUrl = '/demos/blastersound-2.zip';

/**
 * DOSBox configuration optimized for BlasterSound BBS Intro #2
 *
 * BlasterSound BBS Intro #2 requirements (FILE_ID.DIZ and BLASTER2.NFO):
 * - An XT or better, and VGA graphics: it draws in 640x480 with 16 colors
 * - For its music, an AdLib or compatible, such as a Sound Blaster, or a General MIDI device
 *   on an MPU-401; it plays on both when it finds both
 *
 * This configuration uses:
 * - Fixed cycles (30000) on the simple CPU core, the demo() preset's
 * - Sound Blaster 16, whose FM chip plays the AdLib music
 * - Standard VGA graphics
 *
 * DosKit sends it no keys: any key ends it.
 */
export const blastersound2DosboxConf = presets
  .demo()
  .addAutoexec(
    '@echo off',
    'echo.',
    'echo ========================================',
    'echo   BlasterSound BBS Intro #2',
    'echo   by Iguana (1994)',
    'echo ========================================',
    'echo.',
    'echo Design and text by Jare, snowfall by JCAB',
    'echo Tune by COI',
    'echo.',
    'echo Audio: AdLib FM',
    'echo CPU: 30000 cycles',
    'echo Graphics: VGA',
    'echo.',
    'echo Mounting C: drive...',
    'mount c .',
    'c:',
    'echo.',
    'echo Starting BlasterSound BBS Intro #2...',
    'echo.',
    'BLASTER2.EXE'
  )
  .build();

/** The config under the name the registry reads */
export { blastersound2DosboxConf as dosboxConf };
