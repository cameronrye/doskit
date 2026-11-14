/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * Animate Configuration
 * Configuration for running Animate by Schwartz (1995)
 */

import { presets } from '../utils/dosboxConfigBuilder';

/**
 * Animate (hosted locally)
 * Schwartz's 4K intro that won the PC 4K intro competition at Assembly '95
 *
 * Source: https://files.scene.org/view/parties/1995/assembly95/in4k/animate.zip
 * License: MIT, from its author since 2020 (github.com/mtreinik/animate; see
 * public/demos/README.md)
 * Size: 4034 bytes
 */
export const animateZipUrl = '/demos/animate.zip';

/**
 * DOSBox configuration for Animate
 *
 * Animate requirements (ANIMATE.TXT):
 * - A 386 or greater
 * - A VGA
 * - Under 256 KB of conventional memory
 *
 * This configuration uses:
 * - The demo preset: the simple CPU core at a fixed 30000 cycles
 * - The preset's Sound Blaster 16, which it does not use: it has no sound
 * - DOSBox's default 16 MB of memory
 */
export const animateDosboxConf = presets
  .demo()
  .addAutoexec(
    '@echo off',
    'echo.',
    'echo ========================================',
    'echo   Animate',
    'echo   by Schwartz (1995)',
    'echo ========================================',
    'echo.',
    "echo 1st Place, 4K intro, Assembly '95",
    'echo.',
    'echo CPU: 30000 cycles',
    'echo Graphics: VGA',
    'echo Size: 4034 bytes',
    'echo.',
    'echo Mounting C: drive...',
    'mount c .',
    'c:',
    'echo.',
    'echo Starting Animate...',
    'echo.',
    'ANIMATE.COM'
  )
  .build();

/** The config under the name the registry reads */
export { animateDosboxConf as dosboxConf };
