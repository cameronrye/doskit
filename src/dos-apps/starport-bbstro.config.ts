/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * Starport BBS Intro II Configuration
 * Configuration for running the Starport BBS intro by Future Crew (1993)
 */

import { loadZipArchive as loadZip } from '../utils/diskLoader';
import { presets } from '../utils/dosboxConfigBuilder';

// Re-export for lazy loading
export { loadZip as loadZipArchive };

/**
 * Starport BBS Intro II (hosted locally)
 * A small BBS intro by Future Crew (1993)
 *
 * Source: https://github.com/sceners/starport-bbstro-future-crew
 * License: Public Domain
 * Size: 1993 bytes (the year it was released!)
 */
export const starportBbstroZipUrl = '/demos/starport-bbstro.zip';

/**
 * DOSBox configuration optimized for Starport BBS Intro II
 *
 * Starport BBS requirements:
 * - 286 CPU minimum (very lightweight)
 * - VGA graphics
 * - Sound Blaster compatible sound card
 * - Memory: Minimal (runs in 640KB)
 *
 * This configuration uses:
 * - 486 CPU with auto cycles (more than enough)
 * - Sound Blaster 16 for audio
 * - Standard VGA graphics
 *
 * Based on the original README and source code comments
 */
export const starportBbstroDosboxConf = presets
  .demo()
  .setCPU({ core: 'auto', cputype: '486', cycles: 'auto' })
  .setMemory({ memsize: 4 })
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
    'echo CPU: 486 (Auto Cycles)',
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
