/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * Scream Tracker 3 Configuration
 * Configuration for running Scream Tracker 3.21, a music tracker for DOS (1994)
 */

import { loadZipArchive as loadZip } from "../utils/diskLoader";
import { presets } from "../utils/dosboxConfigBuilder";

// Re-export for lazy loading
export { loadZip as loadZipArchive };

/**
 * Scream Tracker 3.21 (hosted locally)
 * The legendary tracker by Future Crew that created the S3M format
 *
 * Source: https://archive.org/details/scrmt321_202207
 * License: Freeware
 * Released: December 25, 1994
 */
export const screamTrackerZipUrl = "/demos/scream-tracker.zip";

/**
 * DOSBox configuration optimized for Scream Tracker 3
 *
 * Scream Tracker 3 requirements:
 * - 286 CPU minimum, 386+ recommended
 * - VGA graphics (text mode)
 * - Sound card: Sound Blaster, Gravis UltraSound, or AdLib
 * - Memory: 640KB RAM minimum, 2MB+ recommended
 *
 * This configuration uses:
 * - 486 CPU with fixed cycles (12000) for stable audio playback
 * - Dynamic core for better performance
 * - Sound Blaster 16 for digital audio
 * - Gravis UltraSound for superior wavetable playback
 * - 8MB RAM with EMS/XMS enabled
 * - Text mode display
 *
 * ST3 is famous for its excellent GUS support, so we enable both
 * Sound Blaster (for compatibility) and GUS (for quality)
 *
 * Based on the original documentation and community recommendations
 */
export const screamTrackerDosboxConf = presets
  .musicTracker()
  .setCPU({ core: "dynamic", cputype: "486", cycles: 12000 })
  .setMemory({ memsize: 8 })
  .setSoundBlaster({
    sbtype: "sb16",
    sbbase: 220,
    irq: 7,
    dma: 1,
    hdma: 5,
    oplmode: "auto",
  })
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
    "echo   Scream Tracker 3.21",
    "echo   by Future Crew (1994)",
    "echo ========================================",
    "echo.",
    "echo The legendary S3M tracker",
    "echo Code by Psi (Sami Tammilehto)",
    "echo.",
    "echo CPU: 486 (12000 cycles)",
    "echo Audio: Sound Blaster 16 + Gravis UltraSound",
    "echo.",
    "echo Mounting C: drive...",
    "mount c .",
    "c:",
    "echo.",
    "echo Starting Scream Tracker 3...",
    "echo.",
    "ST3.EXE",
  )
  .build();

/**
 * Configuration metadata
 */
export const screamTrackerMetadata = {
  name: "Scream Tracker 3",
  author: "Future Crew (Psi)",
  year: 1994,
  version: "3.21",
  description:
    "The legendary music tracker that created the S3M format. Features 32 channels and excellent Gravis UltraSound support.",
  category: "tracker",
  requirements: {
    cpu: "286 or better (386+ recommended)",
    memory: "640KB RAM minimum",
    graphics: "VGA (text mode)",
    sound: "Sound Blaster, Gravis UltraSound, or AdLib",
  },
  license: "Freeware",
  archive: "https://archive.org/details/scrmt321_202207",
  pouet: "https://www.pouet.net/prod.php?which=13351",
  notes: [
    "Created by Future Crew (same group as Second Reality)",
    "Introduced the S3M (ScreamTracker 3 Module) format",
    "Supports up to 32 channels of digital audio",
    "Can play PCM samples and FM instruments simultaneously",
    "Excellent Gravis UltraSound support with hardware mixing",
    "Includes sample module: ARMANI.S3M",
    "Last version released December 25, 1994",
  ],
};
