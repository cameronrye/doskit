/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * Starfield Effect Configuration
 * Configuration for running Draeden of VLA's starfield demo (1993), from Grumpy's source
 * pack collection
 */

import { presets } from '../utils/dosboxConfigBuilder';

/**
 * Starfield Effect Demo (hosted locally)
 * A classic starfield effect demo, from VLA's "Intro To Starfields" by Draeden
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
 * - Auto CPU core, type and cycles
 * - Standard VGA graphics
 */
export const starsDosboxConf = presets
  .demo()
  .setCPU({ core: 'auto', cputype: 'auto', cycles: 'auto' })
  .setJoystick({ joysticktype: 'none' })
  .addAutoexec(
    '@echo off',
    'echo.',
    'echo ========================================',
    'echo   Starfield Effect Demo',
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
    'echo Starting Starfield Effect...',
    'echo.',
    'STARS.EXE'
  )
  .build();
