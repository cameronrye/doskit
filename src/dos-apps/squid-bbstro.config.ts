/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * Squid BBS Intro Configuration
 * Configuration for running the Squid BBS intro by cld & The Doctor (1994)
 */

import { presets } from '../utils/dosboxConfigBuilder';

/**
 * Squid BBS Intro (hosted locally)
 * A tiny BBS intro by cld & The Doctor (1994)
 *
 * Source: https://github.com/sceners/squid-bbstro
 * License: Freeware (SQUID1.ASM; see public/demos/README.md)
 * Size: 1899 bytes
 */
export const squidBbstroZipUrl = '/demos/squid-bbstro.zip';

/**
 * DOSBox configuration optimized for Squid BBS Intro
 *
 * Squid BBS requirements:
 * - A fast 386: SQUID1.ASM calls a 33 MHz 386DX enough and a 33 MHz 386SX too slow
 * - VGA graphics
 * - AdLib compatible sound card
 * - Memory: Minimal (runs in 640KB)
 *
 * This configuration uses:
 * - Auto CPU core, type and cycles (more than enough)
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
    'echo   Squid BBS Intro',
    'echo   by cld and The Doctor (1994)',
    'echo ========================================',
    'echo.',
    'echo Audio: AdLib FM',
    'echo CPU: Auto Cycles',
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
