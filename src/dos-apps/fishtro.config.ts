/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * Fishtro Configuration
 * Configuration for running Fishtro, the Assembly '92 invitation intro by Future Crew (1992)
 */

import { presets } from '../utils/dosboxConfigBuilder';

/**
 * Fishtro (hosted locally)
 * Future Crew's invitation intro for Assembly '92
 *
 * Source: https://files.scene.org/get/demos/groups/future_crew/intros/fishtro.zip
 * License: Freeware (Future Crew's FCINFO files and PANIC.NFO; see public/demos/README.md)
 */
export const fishtroZipUrl = '/demos/fishtro.zip';

/**
 * DOSBox configuration for Fishtro
 *
 * Fishtro requirements (its setup and Future Crew's release list):
 * - VGA graphics
 * - A Sound Blaster: its setup's defaults are a 486 and a Sound Blaster at 220h, IRQ 7
 *
 * This configuration uses:
 * - The demo preset's simple CPU core at a fixed 30000 cycles
 * - The preset's Sound Blaster 16 at 220h, IRQ 7, its setup's defaults
 * - Standard VGA graphics
 */
export const fishtroDosboxConf = presets
  .demo()
  .addAutoexec(
    '@echo off',
    'echo.',
    'echo ========================================',
    'echo   Fishtro by Future Crew (1992)',
    "echo   Invitation intro for Assembly '92",
    'echo ========================================',
    'echo.',
    'echo Code by Psi, music by Purple Motion',
    'echo Graphics by Pixel, Marvel and Skaven',
    'echo.',
    'echo Audio: Sound Blaster 16',
    'echo CPU: 30000 cycles',
    'echo Graphics: VGA',
    'echo.',
    'echo Mounting C: drive...',
    'mount c .',
    'c:',
    'echo.',
    'echo Starting Fishtro...',
    'echo.',
    'FISHTRO.EXE'
  )
  .build();

/** The config under the name the registry reads */
export { fishtroDosboxConf as dosboxConf };
