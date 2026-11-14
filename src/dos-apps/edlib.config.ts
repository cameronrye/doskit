/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * EdLib Configuration
 * Configuration for running EdLib 1.05a, an AdLib music editor by Jens-Christian Huus (1994)
 */

import { presets } from '../utils/dosboxConfigBuilder';

/**
 * EdLib 1.05a (hosted locally)
 * JCH of Vibrants' editor for AdLib FM music, with its example songs, in his own copy of 2007
 *
 * Source: https://chordian.net/files/programs/dos/EdLib_v1.05a.zip
 * License: copy unmodified, no commercial use of the player (EDLIB.TXT; see
 * public/demos/README.md)
 * Released: 20 December 1994
 */
export const edlibZipUrl = '/demos/edlib.zip';

/**
 * DOSBox configuration for EdLib
 *
 * EdLib requirements (EDLIB.TXT, "Requirements"):
 * - A PC with an 80x50 text screen
 * - An AdLib card or compatible: anything with an OPL2 chip or better, which includes every
 *   Sound Blaster
 * - An enhanced keyboard is optional: the keys on F11 and F12 have others as well
 *
 * This configuration is the musicTracker() preset as it is:
 * - Fixed cycles (18000) on the simple CPU core
 * - Sound Blaster 16, whose FM chip EdLib plays through
 * - DOSBox's default 16 MB of memory, with EMS/XMS enabled
 */
export const edlibDosboxConf = presets
  .musicTracker()
  .addAutoexec(
    '@echo off',
    'echo.',
    'echo ========================================',
    'echo   EdLib 1.05a',
    'echo   by Jens-Christian Huus (1994)',
    'echo ========================================',
    'echo.',
    'echo An AdLib music editor by JCH of Vibrants',
    'echo.',
    'echo CPU: 18000 cycles',
    'echo Audio: Sound Blaster 16 (FM)',
    'echo.',
    'echo Mounting C: drive...',
    'mount c .',
    'c:',
    'echo.',
    'echo Starting EdLib...',
    'echo.',
    'EDLIB.EXE'
  )
  .build();

/** The config under the name the registry reads */
export { edlibDosboxConf as dosboxConf };
