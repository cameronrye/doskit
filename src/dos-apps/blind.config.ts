/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * blind Configuration
 * Configuration for running blind by Eufrosyne, the final version (1997)
 */

import { presets } from '../utils/dosboxConfigBuilder';

/**
 * blind (hosted locally)
 * Eufrosyne's 64K intro that won the PC 64K intro competition at Assembly '96, in its final
 * version of 5 January 1997
 *
 * Source: https://files.scene.org/view/demos/groups/eufrosyne/frs_blfn.zip
 * License: "you can spread this intro freely" (BLIND.NFO; see public/demos/README.md)
 */
export const blindZipUrl = '/demos/blind.zip';

/**
 * DOSBox configuration for blind
 *
 * blind requirements (BLIND.NFO):
 * - A 386 with VGA; a Pentium or fast 486 with a GUS recommended
 * - No sound card required. It "uses gravis ultrasound for audio. sound blaster supported only
 *   due to the competition rules. music is not the same on sb and gus."
 *
 * This configuration uses:
 * - The demo preset: the simple CPU core at a fixed 30000 cycles
 * - A Gravis UltraSound at 240h, IRQ 5, DMA 3. DosKit picks the GUS and port 240h in its
 *   setup, so the GUS has to stay at 240h.
 * - The preset's Sound Blaster 16
 * - DOSBox's default 16 MB of memory
 */
export const blindDosboxConf = presets
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
    'echo   blind, the final version',
    'echo   by Eufrosyne (1997)',
    'echo ========================================',
    'echo.',
    "echo 1st Place, 64K intro, Assembly '96",
    'echo Code by Suckho',
    'echo Graphics and music by Duke',
    'echo.',
    'echo Audio: Gravis UltraSound + Sound Blaster 16',
    'echo CPU: 30000 cycles',
    'echo.',
    'echo Mounting C: drive...',
    'mount c .',
    'c:',
    'echo.',
    'echo Starting blind...',
    'echo.',
    'BLIND.EXE'
  )
  .build();

/** The config under the name the registry reads */
export { blindDosboxConf as dosboxConf };
