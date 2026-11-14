/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * DX Project Configuration
 * Configuration for running DX Project by Realtech (1995)
 */

import { presets } from '../utils/dosboxConfigBuilder';

/**
 * DX Project by Realtech (hosted locally)
 * Realtech's demo, third in the PC demo competition at Assembly '95, in its official release
 *
 * Source: https://files.scene.org/get/parties/1995/assembly95/demo/dxproj.zip
 * License: Freeware
 */
export const dxProjectZipUrl = '/demos/dx-project.zip';

/**
 * DOSBox configuration for DX Project
 *
 * DX Project requirements (DX.NFO):
 * - A 386DX or better, a Pentium preferred
 * - 384 KB of conventional memory and 1700 KB of free extended memory
 * - A 256-colour VGA, an SVGA preferred: it runs in 640x480 through VESA
 * - A sound card with a valid BLASTER or ULTRASND setting: Sound Blaster, Sound Blaster Pro,
 *   Sound Blaster 16, Windows Sound System, Pro Audio Spectrum or Gravis UltraSound
 *
 * This configuration uses:
 * - The demo preset: simple CPU core, auto CPU type, a fixed 30000 cycles
 * - Gravis UltraSound at 240h, IRQ 5, DMA 3, and the preset's Sound Blaster 16
 * - DOSBox's default SVGA machine (svga_s3), for its VESA 640x480 mode
 * - DOSBox's default 16 MB of memory, with EMS, XMS and UMB enabled
 */
export const dxProjectDosboxConf = presets
  .demo()
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
    'echo   DX Project',
    'echo   by Realtech (1995)',
    'echo ========================================',
    'echo.',
    "echo 3rd Place at Assembly '95",
    'echo Code and design by Execom',
    'echo.',
    'echo Audio: Gravis UltraSound + Sound Blaster 16',
    'echo CPU: 30000 cycles',
    'echo Graphics: S3 SVGA, VESA 640x480',
    'echo.',
    'echo Mounting C: drive...',
    'mount c .',
    'c:',
    'echo.',
    'echo Starting DX Project...',
    'echo.',
    'DX.EXE'
  )
  .build();

/** The config under the name the registry reads */
export { dxProjectDosboxConf as dosboxConf };
