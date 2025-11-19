/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * Panic Configuration
 * Configuration for running the Panic demo by Future Crew (1992)
 */

import { loadZipArchive as loadZip } from "../utils/diskLoader";
import { presets } from "../utils/dosboxConfigBuilder";

// Re-export for lazy loading
export { loadZip as loadZipArchive };

/**
 * Panic demo (hosted locally)
 * A classic demo by Future Crew (1992)
 *
 * Source: https://files.scene.org/view/demos/groups/future_crew/demos/panic.zip
 * License: Freeware
 * Released at The Party 1992 (2nd place)
 */
export const panicZipUrl = "/demos/panic.zip";

/**
 * DOSBox configuration optimized for Panic
 *
 * Panic requirements:
 * - 386 CPU minimum (486 recommended)
 * - VGA graphics
 * - Sound Blaster compatible sound card
 * - Memory: 4MB RAM
 * - Requires EMS memory
 *
 * This configuration uses:
 * - 486 CPU with auto cycles
 * - Sound Blaster 16 for audio
 * - Standard VGA graphics
 * - 4MB memory with EMS enabled
 *
 * Based on the original demo requirements
 */
export const panicDosboxConf = presets
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
    "echo   Panic by Future Crew",
    "echo   1992 - The Party 1992 (2nd place)",
    "echo ========================================",
    "echo.",
    "echo A classic demo featuring:",
    "echo - Voxel fractals",
    "echo - Shadebobs",
    "echo - Hard techno music by Purple Motion",
    "echo - Dark atmosphere",
    "echo.",
    "echo Audio: Sound Blaster 16",
    "echo CPU: 486 (Auto Cycles)",
    "echo.",
    "echo Mounting C: drive...",
    "mount c .",
    "c:",
    "echo.",
    "echo Starting Panic...",
    "echo.",
    "PANIC.EXE",
  )
  .build();

/**
 * Configuration metadata
 */
export const panicMetadata = {
  name: "Panic",
  author: "Future Crew",
  year: 1992,
  description:
    "A classic demo that came 2nd at The Party 1992. Features voxel fractals, shadebobs, and hard techno music with a dark atmosphere.",
  requirements: {
    cpu: "386 or better (486 recommended)",
    memory: "4MB RAM",
    graphics: "VGA",
    sound: "Sound Blaster compatible",
  },
  license: "Freeware",
  party: "The Party 1992",
  ranking: "2nd place",
  notes: [
    "Came 2nd place at The Party 1992",
    "Features impressive voxel fractal rendering",
    "Music by Purple Motion (Jonne Valtonen)",
    "Known for its dark atmosphere and hard techno soundtrack",
    "Released between Unreal and Second Reality",
  ],
};
