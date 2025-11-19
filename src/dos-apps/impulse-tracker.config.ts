/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * Impulse Tracker Configuration
 * Configuration for running Impulse Tracker, a music tracker for DOS (1997)
 */

import { loadZipArchive as loadZip } from "../utils/diskLoader";
import { presets } from "../utils/dosboxConfigBuilder";

// Re-export for lazy loading
export { loadZip as loadZipArchive };

/**
 * Impulse Tracker compiled application (hosted locally)
 * This is the actual compiled tracker application
 * Originally from Archive.org
 *
 * Source: https://archive.org/details/demoscene_ImpulseTracker214
 * File: it214v3.zip
 * Contains: IT.EXE and related files
 */
export const impulseTrackerZipUrl = "/demos/impulse-tracker.zip";

/**
 * DOSBox configuration optimized for Impulse Tracker
 *
 * Impulse Tracker requirements:
 * - 386 CPU minimum, 486+ recommended
 * - VGA graphics (text mode)
 * - Sound card: Sound Blaster, Gravis UltraSound, or compatible
 * - Memory: 4MB RAM recommended
 *
 * This configuration uses:
 * - Pentium CPU with fixed cycles (18000) for stable audio playback
 * - Dynamic core for better performance
 * - Sound Blaster 16 for audio output with optimized mixer settings
 * - 16MB RAM with EMS/XMS enabled
 * - Text mode display (minimal video memory needed)
 * - Optimized mixer settings to prevent audio stuttering
 *
 * Performance optimizations:
 * - Fixed cycles prevent audio timing issues common with auto/max cycles
 * - Mixer blocksize=2048 and prebuffer=64 provide smooth audio buffering (max 8192)
 * - Pentium CPU type provides better instruction set for audio processing
 * - Dynamic core offers best balance of speed and compatibility
 *
 * Based on community recommendations for music tracker applications
 */
export const impulseTrackerDosboxConf = presets
  .musicTracker()
  .addAutoexec(
    "@echo off",
    "echo.",
    "echo ========================================",
    "echo   Impulse Tracker 2.14",
    "echo   by Jeffrey Lim (1997)",
    "echo ========================================",
    "echo.",
    "echo A music tracker for creating MOD/IT music",
    "echo.",
    "echo CPU: Pentium (18000 cycles)",
    "echo Audio: Sound Blaster 16 (44.1kHz, prebuffer=64)",
    "echo.",
    "echo Mounting C: drive...",
    "mount c .",
    "c:",
    "echo.",
    "echo Starting Impulse Tracker...",
    "echo.",
    "IT.EXE",
  )
  .build();

/**
 * Alternative configuration for Gravis UltraSound
 * Use this if you want to enable GUS support
 *
 * GUS provides superior audio quality for trackers with:
 * - Hardware wavetable synthesis
 * - 32 hardware mixing channels
 * - Better sample playback quality
 *
 * This configuration is optimized for GUS with the same
 * performance settings as the Sound Blaster configuration
 */
export const impulseTrackerGUSConf = presets
  .musicTracker()
  .setGUS({
    gus: true,
    gusrate: 44100,
    gusbase: 240,
    gusirq: 5,
    gusdma: 3,
    ultradir: "C:\\ULTRASND",
  })
  .addAutoexec(
    "@echo off",
    "echo.",
    "echo ========================================",
    "echo   Impulse Tracker 2.14",
    "echo   by Jeffrey Lim (1997)",
    "echo ========================================",
    "echo.",
    "echo CPU: Pentium (15000 cycles)",
    "echo Audio: Gravis UltraSound (44.1kHz)",
    "echo.",
    "echo Mounting C: drive...",
    "mount c .",
    "c:",
    "echo.",
    "echo Starting Impulse Tracker...",
    "echo.",
    "IT.EXE",
  )
  .build();

/**
 * Minimal configuration for testing
 * Just boots to DOS prompt with Impulse Tracker files available
 * Uses the same optimized CPU settings for consistency
 */
export const impulseTrackerTestConf = presets
  .musicTracker()
  .addAutoexec(
    "@echo off",
    "mount c .",
    "c:",
    "echo.",
    "echo Impulse Tracker 2.14 loaded.",
    "echo Type 'IT' to start the tracker.",
    "echo Type 'dir' to see available files.",
    "echo.",
  )
  .build();

/**
 * Configuration metadata
 */
export const impulseTrackerMetadata = {
  name: "Impulse Tracker",
  author: "Jeffrey Lim",
  year: 1997,
  version: "2.14",
  description:
    "A legendary music tracker for creating MOD/IT music. One of the most popular trackers in the demoscene.",
  category: "tracker",
  requirements: {
    cpu: "486 or better",
    memory: "4MB RAM",
    graphics: "VGA (text mode)",
    sound: "Sound Blaster or compatible (optional)",
  },
  license: "BSD-3-Clause",
  repository: "https://github.com/jthlim/impulse-tracker",
  pouet: "https://www.pouet.net/prod.php?which=13366",
  archive: "https://archive.org/details/demoscene_ImpulseTracker214",
  notes: [
    "Source code released in 2014 under BSD-3-Clause license",
    "One of the most influential music trackers in the demoscene",
    "Supports advanced features like filters, NNA (New Note Actions), and more",
    "Created the .IT module format",
  ],
};
