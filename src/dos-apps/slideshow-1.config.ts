/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * Slideshow I Configuration
 * Configuration for running Slideshow I by Future Crew (1990)
 */

import { presets } from '../utils/dosboxConfigBuilder';

/**
 * Slideshow I (hosted locally)
 * Future Crew's slideshow of nine VGA pictures with Sound Blaster music, released in July 1990
 *
 * Source: https://files.scene.org/view/demos/groups/future_crew/grfx/fcslide1.zip
 * License: Freeware, by Future Crew's information files (see public/demos/README.md)
 */
export const slideshow1ZipUrl = '/demos/slideshow-1.zip';

/**
 * DOSBox configuration for Slideshow I
 *
 * Its requirements (README):
 * - About 580 KB of memory
 * - A VGA or MCGA card; without one it plays only the music, on a text screen
 * - For sound, a Sound Blaster, picked in its sound menu
 *
 * This configuration uses:
 * - The demo preset: the simple CPU core at a fixed 30000 cycles
 * - The preset's Sound Blaster 16, which its sound menu's "9" plays through
 * - DOSBox's default 16 MB of memory
 */
export const slideshow1DosboxConf = presets
  .demo()
  .addAutoexec(
    '@echo off',
    'echo.',
    'echo ========================================',
    'echo   Slideshow I by Future Crew',
    'echo   1990 - Nine pictures, with music',
    'echo ========================================',
    'echo.',
    'echo Code by Psi, music by BIG',
    'echo Graphics by Hal and Jpm',
    'echo.',
    'echo Audio: Sound Blaster 16',
    'echo CPU: 30000 cycles',
    'echo.',
    'echo Mounting C: drive...',
    'mount c .',
    'c:',
    'echo.',
    'echo Starting Slideshow I...',
    'echo.',
    'FCSLIDE1.EXE'
  )
  .build();

/** The config under the name the registry reads */
export { slideshow1DosboxConf as dosboxConf };
