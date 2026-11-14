/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * Worldcharts #1 Configuration
 * Configuration for running Worldcharts #1, Future Crew's diskmag (1993)
 */

import { presets } from '../utils/dosboxConfigBuilder';

/**
 * Worldcharts #1 (hosted locally)
 * Future Crew's diskmag of PC demo scene charts and articles, its only issue, from May 1993
 *
 * Source: https://files.scene.org/view/demos/groups/future_crew/other/wcharts.zip
 * License: Freeware, by Future Crew's information files (see public/demos/README.md)
 */
export const worldcharts1ZipUrl = '/demos/worldcharts-1.zip';

/**
 * DOSBox configuration for Worldcharts #1
 *
 * Its requirements (WCHARTS.EXE's messages):
 * - 580 KB of free memory
 * - VGA graphics
 * - For its music, a Sound Blaster, Sound Blaster Pro or Gravis UltraSound, which it detects
 *   by itself, with no setup screen
 *
 * This configuration uses:
 * - The demo preset: the simple CPU core at a fixed 30000 cycles
 * - A Gravis UltraSound, which it plays its music through
 * - The preset's Sound Blaster 16
 * - A plain VGA (machine vgaonly): on DOSBox's default SVGA machine, half its 16 colors show
 *   as pure lime
 * - DOSBox's default 16 MB of memory
 */
export const worldcharts1DosboxConf = presets
  .demo()
  .setMachine({ machine: 'vgaonly' })
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
    'echo   Worldcharts #1 by Future Crew',
    "echo   1993 - Future Crew's diskmag",
    'echo ========================================',
    'echo.',
    'echo Edited by GORE, code by Psi',
    'echo Graphics by Pixel',
    'echo Music by Purple Motion and C.C.Catch',
    'echo.',
    'echo Audio: Gravis UltraSound + Sound Blaster 16',
    'echo CPU: 30000 cycles',
    'echo.',
    'echo Mounting C: drive...',
    'mount c .',
    'c:',
    'echo.',
    'echo Starting Worldcharts #1...',
    'echo.',
    'WCHARTS.EXE'
  )
  .build();

/** The config under the name the registry reads */
export { worldcharts1DosboxConf as dosboxConf };
