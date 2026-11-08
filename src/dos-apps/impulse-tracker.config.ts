/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * Impulse Tracker Configuration
 * Configuration for running Impulse Tracker, a music tracker for DOS (1997)
 */

import { presets } from '../utils/dosboxConfigBuilder';

/**
 * Impulse Tracker compiled application (hosted locally)
 * This is the actual compiled tracker application
 * Originally from Archive.org
 *
 * Source: https://archive.org/details/demoscene_ImpulseTracker214
 * File: it214v3.zip
 * Contains: IT.EXE and related files
 */
export const impulseTrackerZipUrl = '/demos/impulse-tracker.zip';

/**
 * DOSBox configuration optimized for Impulse Tracker
 *
 * Impulse Tracker requirements (IT.TXT, section 1.1):
 * - A 386 or later, a 486 recommended, and a VGA card (it runs in text mode)
 * - For sound, one of the cards it has drivers for, among them the Sound Blasters and the Gravis
 *   UltraSound
 * - About 500 KB of conventional memory, 600 KB to load almost any song, and an EMM driver for
 *   EMS, where it keeps the samples
 *
 * This configuration uses:
 * - Fixed cycles (18000) on the simple CPU core, for stable audio playback
 * - Sound Blaster 16 for audio output with optimized mixer settings
 * - DOSBox's default 16 MB of memory, with EMS/XMS enabled
 * - Text mode display
 * - Optimized mixer settings to prevent audio stuttering
 *
 * Performance optimizations:
 * - Fixed cycles prevent audio timing issues common with auto/max cycles
 * - Mixer prebuffer=64 provides smooth audio buffering (it goes up to 100)
 *
 * Based on community recommendations for music tracker applications
 */
export const impulseTrackerDosboxConf = presets
  .musicTracker()
  .addAutoexec(
    '@echo off',
    'echo.',
    'echo ========================================',
    'echo   Impulse Tracker 2.14',
    'echo   by Jeffrey Lim (1997)',
    'echo ========================================',
    'echo.',
    'echo A music tracker for creating MOD/IT music',
    'echo.',
    'echo CPU: 18000 cycles',
    'echo Audio: Sound Blaster 16 (44.1kHz, prebuffer=64)',
    'echo.',
    'echo Mounting C: drive...',
    'mount c .',
    'c:',
    'echo.',
    'echo Starting Impulse Tracker...',
    'echo.',
    'IT.EXE'
  )
  .build();
