/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * 3D Rotate Demo Configuration
 * Configuration for running Draeden of VLA's 3D rotation demo (1993), from Grumpy's
 * source pack collection
 */

import { presets } from '../utils/dosboxConfigBuilder';

/**
 * 3D Rotate Demo (hosted locally)
 * A classic 3D rotation demo effect, from VLA's "Intro To 3d Rotations" by Draeden
 *
 * Source: https://github.com/sceners/grumpys-source-pack-collection
 * License: none found (see public/demos/README.md)
 */
export const rotate3dZipUrl = '/demos/3drotate.zip';

/**
 * DOSBox configuration optimized for 3D Rotate Demo
 *
 * Requirements:
 * - 386 CPU minimum (3DROTATE.TXT: "requires a 386 or better")
 * - VGA graphics
 * - Memory: Minimal (runs in 640KB)
 *
 * This configuration uses:
 * - Auto CPU core, type and cycles
 * - Standard VGA graphics
 */
export const rotate3dDosboxConf = presets
  .demo()
  .setCPU({ core: 'auto', cputype: 'auto', cycles: 'auto' })
  .setJoystick({ joysticktype: 'none' })
  .addAutoexec(
    '@echo off',
    'echo.',
    'echo ========================================',
    'echo   3D Rotation Demo',
    'echo   by Draeden of VLA (1993)',
    "echo   From Grumpy's Source Pack Collection",
    'echo ========================================',
    'echo.',
    'echo CPU: Auto Cycles',
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
