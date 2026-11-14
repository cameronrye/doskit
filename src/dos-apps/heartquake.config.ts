/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * Heartquake Configuration
 * Configuration for running Heartquake by Iguana (1994)
 */

import { presets } from '../utils/dosboxConfigBuilder';

/**
 * Heartquake (hosted locally)
 * Iguana's demo, third in the PC demo competition at Assembly '94, from BlasterSound, Iguana's
 * home BBS
 *
 * Source: https://files.scene.org/view/mirrors/scenesp.org/compilations/blastersound_bbs/IGUANA/HEARTQ.ZIP
 * License: free to distribute unmodified (HEARTQ.NFO; see public/demos/README.md)
 */
export const heartquakeZipUrl = '/demos/heartquake.zip';

/**
 * DOSBox configuration for Heartquake
 *
 * Heartquake requirements (HEARTQ.NFO):
 * - A 386 or above with at least 4 MB of memory, a VGA card and a hard disk; a 486/33 and a
 *   local bus video card recommended
 * - For music, a Gravis UltraSound with 512 KB (recommended), or a Sound Blaster, Sound Blaster
 *   Pro or Sound Blaster 16, which needs 2400 KB of EMS
 *
 * This configuration uses:
 * - The demo preset: the simple CPU core at a fixed 30000 cycles
 * - A Gravis UltraSound at 240h, IRQ 5, DMA 3, which its setup finds from ULTRASND
 * - The preset's Sound Blaster 16
 * - DOSBox's default 16 MB of memory, with EMS enabled
 */
export const heartquakeDosboxConf = presets
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
    'echo   Heartquake',
    'echo   by Iguana (1994)',
    'echo ========================================',
    'echo.',
    "echo 3rd Place at Assembly '94",
    'echo Code by JCAB, Jare, ARM and COI',
    'echo Music by Noisy Man, COI and Ryan Cramer',
    'echo.',
    'echo Audio: Gravis UltraSound + Sound Blaster 16',
    'echo CPU: 30000 cycles',
    'echo.',
    'echo Mounting C: drive...',
    'mount c .',
    'c:',
    'echo.',
    'echo Starting Heartquake...',
    'echo.',
    'HEARTQ.EXE'
  )
  .build();

/** The config under the name the registry reads */
export { heartquakeDosboxConf as dosboxConf };
