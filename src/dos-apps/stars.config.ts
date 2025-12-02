/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * Starfield Effect Configuration
 * Configuration for running the starfield demo from Grumpy's collection
 */

import { loadZipArchive as loadZip } from '../utils/diskLoader';
import { presets } from '../utils/dosboxConfigBuilder';

// Re-export for lazy loading
export { loadZip as loadZipArchive };

/**
 * Starfield Effect Demo (hosted locally)
 * A classic starfield effect demo
 *
 * Source: https://github.com/sceners/grumpys-source-pack-collection
 * License: Scene/Historical
 */
export const starsZipUrl = '/demos/stars.zip';

/**
 * DOSBox configuration optimized for Starfield Effect
 *
 * Requirements:
 * - 286 CPU minimum
 * - VGA graphics
 * - Memory: Minimal (runs in 640KB)
 *
 * This configuration uses:
 * - 486 CPU with auto cycles
 * - Standard VGA graphics
 */
export const starsDosboxConf = presets
  .demo()
  .setCPU({ core: 'auto', cputype: '486', cycles: 'auto' })
  .setMemory({ memsize: 4 })
  .setJoystick({ joysticktype: 'none' })
  .addAutoexec(
    '@echo off',
    'echo.',
    'echo ========================================',
    'echo   Starfield Effect Demo',
    "echo   From Grumpy's Source Pack Collection",
    'echo ========================================',
    'echo.',
    'echo CPU: 486 (Auto Cycles)',
    'echo Graphics: VGA',
    'echo.',
    'echo Mounting C: drive...',
    'mount c .',
    'c:',
    'echo.',
    'echo Starting Starfield Effect...',
    'echo.',
    'STARS.EXE'
  )
  .build();

/**
 * Configuration metadata
 */
export const starsMetadata = {
  name: 'Starfield Effect',
  author: "Grumpy's Collection",
  year: 1990,
  description:
    'Classic starfield effect demo simulating flying through space. A fundamental demo scene effect.',
  requirements: {
    cpu: '286 or better',
    memory: '640KB RAM',
    graphics: 'VGA',
    sound: 'None',
  },
  license: 'Scene/Historical',
  repository: 'https://github.com/sceners/grumpys-source-pack-collection',
  notes: [
    "Part of Grumpy's extensive demo effects collection",
    'Educational example of 3D projection',
    'Demonstrates perspective calculations',
    'Classic space simulation effect',
  ],
};
