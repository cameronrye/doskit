/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * Machines of Madness Configuration
 * Configuration for running Machines of Madness by Dubius (1996)
 */

import { presets } from '../utils/dosboxConfigBuilder';

/**
 * Machines of Madness (hosted locally)
 * Dubius's demo that won the PC demo competition at Assembly '96
 *
 * Source: https://files.scene.org/get/parties/1996/assembly96/demo/machines.zip
 * License: not freeware; free to copy for non-commercial use (MACHINES.NFO; see
 * public/demos/README.md)
 */
export const machinesOfMadnessZipUrl = '/demos/machines-of-madness.zip';

/**
 * DOSBox configuration for Machines of Madness
 *
 * Machines of Madness requirements (MACHINES.NFO):
 * - A 386 or better with a 387 FPU or better, a P75 recommended
 * - 5,600 KB of extended memory and 300 KB of base memory
 * - A Gravis UltraSound with 256 KB to 1 MB; with a Sound Blaster, another 1,200 KB of
 *   EMS/VCPI and 500 KB of base memory
 *
 * This configuration uses:
 * - The demo preset's simple CPU core, at maximum cycles: at a fixed 30000 it played with
 *   about half its frames when it was vetted
 * - A Gravis UltraSound, which it picks by itself, and the preset's Sound Blaster 16: its
 *   Sound Blaster mode stops here with "EMS Error!"
 * - The preset's SVGA machine (svga_s3), for its 640x480 VESA title picture
 * - DOSBox's default 16 MB of memory, with EMS/XMS enabled
 */
export const machinesOfMadnessDosboxConf = presets
  .demo()
  .setCPU({ cycles: 'max' })
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
    'echo   Machines of Madness',
    'echo   by Dubius (1996)',
    'echo ========================================',
    'echo.',
    "echo 1st Place at Assembly '96",
    'echo.',
    'echo Code by Tremor, music by Nitro',
    'echo Graphics by Tonic and Lazur',
    'echo.',
    'echo Audio: Gravis UltraSound + Sound Blaster 16',
    'echo CPU: Maximum Cycles',
    'echo.',
    'echo Mounting C: drive...',
    'mount c .',
    'c:',
    'echo.',
    'echo Starting Machines of Madness...',
    'echo.',
    'MACHINES.EXE'
  )
  .build();

/** The config under the name the registry reads */
export { machinesOfMadnessDosboxConf as dosboxConf };
