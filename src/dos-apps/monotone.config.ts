/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * MONOTONE Configuration
 * Configuration for running MONOTONE 0.3.9, a PC speaker tracker by Trixter of Hornet (2017)
 */

import { presets } from '../utils/dosboxConfigBuilder';

/**
 * MONOTONE 0.3.9 (hosted locally)
 * Trixter's tracker for the PC speaker and other simple sound devices, built 8 July 2017
 *
 * Source: https://github.com/MobyGamer/MONOTONE/releases/download/0.3.9/MONOTONE.ZIP
 * License: the Unlicense, of its repository (see public/demos/README.md)
 */
export const monotoneZipUrl = '/demos/monotone.zip';

/**
 * DOSBox configuration for MONOTONE
 *
 * MONOTONE requirements (MONOTONE.TXT, "Design and Concepts"):
 * - Any IBM PC or true compatible, with 128 KB of RAM and a color display
 * - For sound, the PC speaker; its setup also offers the AdLib and the Tandy 1000/PCjr chip
 *
 * This configuration is the musicTracker() preset as it is:
 * - Fixed cycles (18000) on the simple CPU core
 * - The PC speaker, which DosKit picks in its setup, and a Sound Blaster 16
 * - DOSBox's default 16 MB of memory
 */
export const monotoneDosboxConf = presets
  .musicTracker()
  .addAutoexec(
    '@echo off',
    'echo.',
    'echo ========================================',
    'echo   MONOTONE 0.3.9',
    'echo   by Trixter of Hornet (2017)',
    'echo ========================================',
    'echo.',
    'echo A tracker for the PC speaker',
    'echo.',
    'echo CPU: 18000 cycles',
    'echo Audio: PC speaker + Sound Blaster 16',
    'echo.',
    'echo Mounting C: drive...',
    'mount c .',
    'c:',
    'echo.',
    'echo Starting MONOTONE...',
    'echo.',
    'MT.EXE'
  )
  .build();

/** The config under the name the registry reads */
export { monotoneDosboxConf as dosboxConf };
