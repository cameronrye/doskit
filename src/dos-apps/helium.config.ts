/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * Helium Configuration
 * Configuration for running Helium by viznut (1997)
 */

import { presets } from '../utils/dosboxConfigBuilder';

/**
 * Helium (hosted locally)
 * viznut's 4K intro that won the PC 4K intro competition at Assembly '97
 *
 * Source: https://files.scene.org/view/parties/1997/assembly97/in4k/helium.zip
 * License: none in its own files; its source and a later build are under CC0 1.0 (see
 * public/demos/README.md)
 * Size: 3761 bytes
 */
export const heliumZipUrl = '/demos/helium.zip';

/**
 * DOSBox configuration for Helium
 *
 * Helium requirements (HELIUM.TXT):
 * - A 386; no FPU needed. It runs in real mode.
 * - A VGA, for its 256x256 chained mode ("helium 2" gives mode 13h instead)
 * - An AdLib or compatible, for its music ("helium s" gives silence)
 * - 400 KB of free conventional memory is "more than enough"
 *
 * This configuration uses:
 * - The demo preset: the simple CPU core at a fixed 30000 cycles
 * - The preset's Sound Blaster 16, whose FM chip plays its AdLib music
 * - DOSBox's default 16 MB of memory
 *
 * Its data file gives js-dos the AsIs aspect: DosKit's 4:3 would stretch its picture about
 * 35% wider.
 */
export const heliumDosboxConf = presets
  .demo()
  .addAutoexec(
    '@echo off',
    'echo.',
    'echo ========================================',
    'echo   Helium',
    'echo   by viznut (1997)',
    'echo ========================================',
    'echo.',
    "echo 1st Place, 4K intro, Assembly '97",
    'echo.',
    'echo Audio: AdLib FM',
    'echo CPU: 30000 cycles',
    'echo Size: 3761 bytes',
    'echo.',
    'echo Mounting C: drive...',
    'mount c .',
    'c:',
    'echo.',
    'echo Starting Helium...',
    'echo.',
    'HELIUM.COM'
  )
  .build();

/** The config under the name the registry reads */
export { heliumDosboxConf as dosboxConf };
