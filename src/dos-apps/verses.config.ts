/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * Verses Configuration
 * Configuration for running Verses by Electromotive Force, Revision II (1995)
 */

import { presets } from '../utils/dosboxConfigBuilder';

/**
 * Verses (hosted locally)
 * Electromotive Force's demo that won the PC demo competition at Assembly '94, in its
 * Revision II of 26 April 1995
 *
 * Source: https://files.scene.org/view/parties/1994/assembly94/demo/emf_vrs2.zip
 * License: Freeware (VERSES.NFO; see public/demos/README.md)
 */
export const versesZipUrl = '/demos/verses.zip';

/**
 * DOSBox configuration for Verses
 *
 * Verses requirements (VERSES.NFO):
 * - A 386SX, a 486 or faster recommended
 * - VGA graphics
 * - For music, a Gravis UltraSound (recommended), Sound Blaster or Sound Blaster Pro
 * - 1 MB of free extended memory (2 MB recommended) and 450 KB of conventional memory
 *
 * This configuration uses:
 * - The demo preset: the simple CPU core at a fixed 30000 cycles
 * - A Gravis UltraSound at 240h, IRQ 5, DMA 3. The autoexec starts it as "VERSES.EXE !",
 *   its "no questions asked" mode, which finds the GUS and skips the setup's questions.
 * - The preset's Sound Blaster 16
 * - DOSBox's default 16 MB of memory
 */
export const versesDosboxConf = presets
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
    'echo   Verses, Revision II',
    'echo   by Electromotive Force (1995)',
    'echo ========================================',
    'echo.',
    "echo 1st Place at Assembly '94",
    'echo Code by Saracen, The Grim Reaper,',
    'echo Devastator and Saint',
    'echo Music by Whalebone',
    'echo.',
    'echo Audio: Gravis UltraSound + Sound Blaster 16',
    'echo CPU: 30000 cycles',
    'echo.',
    'echo Mounting C: drive...',
    'mount c .',
    'c:',
    'echo.',
    'echo Starting Verses...',
    'echo.',
    'VERSES.EXE !'
  )
  .build();

/** The config under the name the registry reads */
export { versesDosboxConf as dosboxConf };
