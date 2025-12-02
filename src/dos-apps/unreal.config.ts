/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * Unreal Configuration
 * Configuration for running the Unreal demo by Future Crew (1992)
 */

import { loadZipArchive as loadZip } from "../utils/diskLoader";
import { presets } from "../utils/dosboxConfigBuilder";

// Re-export for lazy loading
export { loadZip as loadZipArchive };

/**
 * Unreal demo (hosted locally)
 * A groundbreaking demo by Future Crew (1992)
 *
 * Source: https://archive.org/details/unreal_zip
 * License: Freeware
 * Released at Assembly 1992 (1st place)
 */
export const unrealZipUrl = "/demos/unreal.zip";

/**
 * DOSBox configuration optimized for Unreal
 *
 * Unreal requirements:
 * - 386 CPU minimum (486 recommended)
 * - VGA graphics
 * - Sound Blaster compatible sound card
 * - Memory: 4MB RAM
 *
 * This configuration uses:
 * - 486 CPU with auto cycles
 * - Sound Blaster 16 for audio
 * - Standard VGA graphics
 * - 4MB memory
 *
 * Based on the original demo requirements
 */
export const unrealDosboxConf = presets
  .demo()
  .setCPU({ core: "auto", cputype: "486", cycles: "auto" })
  .setMemory({ memsize: 4 })
  .setSoundBlaster({
    sbtype: "sb16",
    sbbase: 220,
    irq: 7,
    dma: 1,
    hdma: 5,
    oplmode: "auto",
  })
  .setJoystick({ joysticktype: "none" })
  .addAutoexec(
    "@echo off",
    "echo.",
    "echo ========================================",
    "echo   Unreal by Future Crew",
    "echo   1992 - Assembly 1992 Winner",
    "echo ========================================",
    "echo.",
    "echo A groundbreaking demo featuring:",
    "echo - Advanced 3D graphics",
    "echo - Smooth animations",
    "echo - Excellent music by Purple Motion",
    "echo.",
    "echo Audio: Sound Blaster 16",
    "echo CPU: 486 (Auto Cycles)",
    "echo.",
    "echo Mounting C: drive...",
    "mount c .",
    "c:",
    "echo.",
    "echo Starting Unreal...",
    "echo.",
    "UNREAL.EXE",
  )
  .build();

/**
 * Configuration metadata
 */
export const unrealMetadata = {
  name: "Unreal",
  author: "Future Crew",
  year: 1992,
  description:
    "A groundbreaking demo that won Assembly 1992. Features advanced 3D graphics, smooth animations, and excellent music.",
  requirements: {
    cpu: "386 or better (486 recommended)",
    memory: "4MB RAM",
    graphics: "VGA",
    sound: "Sound Blaster compatible",
  },
  license: "Freeware",
  party: "Assembly 1992",
  ranking: "1st place",
  notes: [
    "Won 1st place at Assembly 1992",
    "One of the most influential PC demos of the early 90s",
    "Features music by Purple Motion (Jonne Valtonen)",
    "Two versions exist: 1.0 and 1.1 (with GUS support)",
  ],
};
