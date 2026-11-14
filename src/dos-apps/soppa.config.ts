/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * SOPPA! Configuration
 * Configuration for running SOPPA!, Future Crew's 64K intro for Assembly '94 (1994)
 */

import { presets } from '../utils/dosboxConfigBuilder';

/**
 * SOPPA! (hosted locally)
 * Future Crew's 64K intro for Assembly '94, which failed the party's pre-selection
 *
 * Source: https://files.scene.org/view/parties/1994/assembly94/in64/soppa.zip
 * License: Freeware (FCINFO16.TXT; see public/demos/README.md)
 */
export const soppaZipUrl = '/demos/soppa.zip';

/**
 * DOSBox configuration for SOPPA!
 *
 * The archive states no requirements. SOPPA.EXE runs in 320x240, with a 640x480 title, and
 * plays its music through a Gravis UltraSound, or through a Sound Blaster without one.
 *
 * This configuration uses:
 * - The demo preset: the simple CPU core at a fixed 30000 cycles
 * - A Gravis UltraSound, which it finds by itself. On the Sound Blaster 16 alone its pauses
 *   stretch its two minutes to about 150 seconds.
 * - The preset's Sound Blaster 16
 * - DOSBox's default 16 MB of memory
 */
export const soppaDosboxConf = presets
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
    'echo   SOPPA! by Future Crew',
    "echo   1994 - A 64K intro for Assembly '94",
    'echo ========================================',
    'echo.',
    'echo Code by Psi, music by Purple Motion',
    'echo Graphics by Marvel',
    'echo.',
    'echo Audio: Gravis UltraSound + Sound Blaster 16',
    'echo CPU: 30000 cycles',
    'echo.',
    'echo Mounting C: drive...',
    'mount c .',
    'c:',
    'echo.',
    'echo Starting SOPPA!...',
    'echo.',
    'SOPPA.EXE'
  )
  .build();

/** The config under the name the registry reads */
export { soppaDosboxConf as dosboxConf };
