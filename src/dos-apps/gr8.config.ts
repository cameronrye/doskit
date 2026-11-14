/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * GR8 Configuration
 * Configuration for running GR8 by Future Crew (1990)
 */

import { presets } from '../utils/dosboxConfigBuilder';

/**
 * GR8 (hosted locally)
 * Future Crew's first PC demo, an EGA sine scroller with no sound
 *
 * Source: https://files.scene.org/get/mirrors/hornet/demos/1989/gr8.zip
 * License: Freeware (Future Crew's FCINFO files; see public/demos/README.md)
 */
export const gr8ZipUrl = '/demos/gr8.zip';

/**
 * DOSBox configuration for GR8
 *
 * GR8 requirements (Future Crew's release list: "EGA/No sound"):
 * - EGA graphics: it draws in the 320x200, 16-color EGA mode, which a VGA has too
 * - No sound card: it has no sound
 *
 * This configuration uses:
 * - The demo preset's simple CPU core at a fixed 30000 cycles. Its scroll text keeps its
 *   pace by its own timer.
 * - DOSBox's default SVGA machine, which runs its EGA mode as a VGA does
 */
export const gr8DosboxConf = presets
  .demo()
  .addAutoexec(
    '@echo off',
    'echo.',
    'echo ========================================',
    'echo   GR8 by Future Crew (1990)',
    'echo ========================================',
    'echo.',
    'echo Code by Psi',
    'echo.',
    'echo CPU: 30000 cycles',
    'echo Graphics: EGA',
    'echo.',
    'echo Mounting C: drive...',
    'mount c .',
    'c:',
    'echo.',
    'echo Starting GR8...',
    'echo.',
    'GR8.EXE'
  )
  .build();

/** The config under the name the registry reads */
export { gr8DosboxConf as dosboxConf };
