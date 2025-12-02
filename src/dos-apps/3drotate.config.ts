/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * 3D Rotate Demo Configuration
 * Configuration for running the 3D rotation demo from Grumpy's collection
 */

import { loadZipArchive as loadZip } from '../utils/diskLoader';
import { presets } from '../utils/dosboxConfigBuilder';

// Re-export for lazy loading
export { loadZip as loadZipArchive };

/**
 * 3D Rotate Demo (hosted locally)
 * A classic 3D rotation demo effect
 *
 * Source: https://github.com/sceners/grumpys-source-pack-collection
 * License: Scene/Historical
 */
export const rotate3dZipUrl = '/demos/3drotate.zip';

/**
 * DOSBox configuration optimized for 3D Rotate Demo
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
export const rotate3dDosboxConf = presets
  .demo()
  .setCPU({ core: 'auto', cputype: '486', cycles: 'auto' })
  .setMemory({ memsize: 4 })
  .setJoystick({ joysticktype: 'none' })
  .addAutoexec(
    '@echo off',
    'echo.',
    'echo ========================================',
    'echo   3D Rotation Demo',
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
    'echo Starting 3D Rotation Demo...',
    'echo.',
    '3DROTATE.EXE'
  )
  .build();

/**
 * Configuration metadata
 */
export const rotate3dMetadata = {
  name: '3D Rotation Demo',
  author: "Grumpy's Collection",
  year: 1990,
  description:
    'Classic 3D rotation demo effect showcasing real-time 3D object rotation in VGA mode.',
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
    'Educational example of 3D graphics programming',
    'Demonstrates real-time 3D rotation algorithms',
  ],
};
