/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * Panic Configuration
 * Configuration for running the Panic demo by Future Crew (1993)
 */

import { presets } from '../utils/dosboxConfigBuilder';

/**
 * Panic demo (hosted locally)
 * A classic demo by Future Crew (1993)
 *
 * Source: https://files.scene.org/view/demos/groups/future_crew/demos/panic.zip
 * License: Freeware
 * Shown at The Party 1992 (2nd place), released on 4 February 1993
 */
export const panicZipUrl = '/demos/panic.zip';

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
 * - Auto CPU core, type and cycles
 * - Sound Blaster 16 for audio
 * - Standard VGA graphics
 * - DOSBox's default 16 MB of memory, with EMS enabled
 *
 * Based on the original demo requirements
 */
export const panicDosboxConf = presets
  .demo()
  .setCPU({ core: 'auto', cputype: 'auto', cycles: 'auto' })
  .setSoundBlaster({
    sbtype: 'sb16',
    sbbase: 220,
    irq: 7,
    dma: 1,
    hdma: 5,
    oplmode: 'auto',
  })
  .setJoystick({ joysticktype: 'none' })
  .addAutoexec(
    '@echo off',
    'echo.',
    'echo ========================================',
    'echo   Panic by Future Crew',
    'echo   1993 - 2nd at The Party 1992',
    'echo ========================================',
    'echo.',
    'echo A classic demo featuring:',
    'echo - Voxel fractals',
    'echo - Shadebobs',
    'echo - Hard techno music by Purple Motion',
    'echo - Dark atmosphere',
    'echo.',
    'echo Audio: Sound Blaster 16',
    'echo CPU: Auto Cycles',
    'echo.',
    'echo Mounting C: drive...',
    'mount c .',
    'c:',
    'echo.',
    'echo Starting Panic...',
    'echo.',
    'PANIC.EXE'
  )
  .build();
