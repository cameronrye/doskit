/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * Starport BBS Intro II Configuration
 * Configuration for running the Starport BBS intro by Future Crew (1993)
 */

import { presets } from '../utils/dosboxConfigBuilder';

/**
 * Starport BBS Intro II (hosted locally)
 * A small BBS intro by Future Crew (1993)
 *
 * Source: https://files.scene.org/view/demos/groups/future_crew/code/fcsp2src.zip
 * License: Public Domain (SP2.ASM; see public/demos/README.md)
 * Size: 1993 bytes (the year it was released!)
 */
export const starportBbstroZipUrl = '/demos/starport-bbstro.zip';

/**
 * DOSBox configuration optimized for Starport BBS Intro II
 *
 * Starport BBS requirements:
 * - 386 CPU minimum (SP2.ASM is written for the 386)
 * - VGA graphics
 * - AdLib compatible sound card (FCINFO12.TXT lists it as "VGA/Adlib")
 * - Memory: Minimal (runs in 640KB)
 *
 * This configuration uses:
 * - Auto CPU core and type, at a fixed 30000 cycles. 'auto' would give it 3,000 cycles/ms, at
 *   which it draws only 35 of its 70 frames a second: SP2.ASM's 70 Hz timer keeps the motion
 *   and the music at speed, but the motion stutters.
 * - Sound Blaster 16 for audio
 * - Standard VGA graphics
 *
 * Based on the original README and source code comments
 */
export const starportBbstroDosboxConf = presets
  .demo()
  .setCPU({ core: 'auto', cputype: 'auto', cycles: 30000 })
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
    'echo   Starport BBS Intro II by Future Crew',
    'echo   1993 - Public Domain',
    'echo ========================================',
    'echo.',
    'echo Audio: Sound Blaster 16',
    'echo CPU: 30000 cycles',
    'echo Size: 1993 bytes!',
    'echo.',
    'echo Mounting C: drive...',
    'mount c .',
    'c:',
    'echo.',
    'echo Starting Starport BBS Intro...',
    'echo.',
    'SP2.COM'
  )
  .build();

/** The config under the name the registry reads */
export { starportBbstroDosboxConf as dosboxConf };
