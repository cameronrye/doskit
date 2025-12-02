/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * Squid BBS Intro Configuration
 * Configuration for running the Squid BBS intro by cld & The Doctor (1994)
 */

import { loadZipArchive as loadZip } from '../utils/diskLoader';
import { presets } from '../utils/dosboxConfigBuilder';

// Re-export for lazy loading
export { loadZip as loadZipArchive };

/**
 * Squid BBS Intro (hosted locally)
 * A tiny BBS intro by cld & The Doctor (1994)
 *
 * Source: https://github.com/sceners/squid-bbstro
 * License: Scene/Historical
 * Size: 1899 bytes
 */
export const squidBbstroZipUrl = '/demos/squid-bbstro.zip';

/**
 * DOSBox configuration optimized for Squid BBS Intro
 *
 * Squid BBS requirements:
 * - 286 CPU minimum (very lightweight)
 * - VGA graphics
 * - AdLib compatible sound card
 * - Memory: Minimal (runs in 640KB)
 *
 * This configuration uses:
 * - 486 CPU with auto cycles (more than enough)
 * - AdLib for audio (as specified in the source)
 * - Standard VGA graphics
 *
 * Features:
 * - Character smoother effect
 * - Mini AdLib player
 * - 8x16 custom charset
 */
export const squidBbstroDosboxConf = presets
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
    'echo   Squid BBS Intro',
    'echo   by cld and The Doctor (1994)',
    'echo ========================================',
    'echo.',
    'echo Audio: AdLib FM',
    'echo CPU: 486 (Auto Cycles)',
    'echo Size: 1899 bytes!',
    'echo.',
    'echo Features:',
    'echo - Character smoother',
    'echo - Mini AdLib player',
    'echo - 8x16 custom charset',
    'echo.',
    'echo Mounting C: drive...',
    'mount c .',
    'c:',
    'echo.',
    'echo Starting Squid BBS Intro...',
    'echo.',
    'SQUID1.COM'
  )
  .build();

/**
 * Configuration metadata
 */
export const squidBbstroMetadata = {
  name: 'Squid BBS Intro',
  author: 'cld & The Doctor',
  year: 1994,
  description:
    'A tiny BBS intro (1899 bytes) featuring character smoothing, AdLib music, and custom charset. A classic example of size-optimized demo coding.',
  requirements: {
    cpu: '286 or better',
    memory: '640KB RAM',
    graphics: 'VGA',
    sound: 'AdLib compatible',
  },
  license: 'Scene/Historical',
  repository: 'https://github.com/sceners/squid-bbstro',
  notes: [
    'Includes ASM source code (SQUID1.ASM)',
    'Features a mini AdLib FM player',
    'Character smoother effect for text',
    '8x16 custom charset',
    'Optimized for size - only 1899 bytes',
    'A BBStro (BBS intro) used to promote a BBS',
    "Includes 'incomprehensible comments' according to FILE_ID.DIZ",
  ],
};
