/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * Fire Demo Configuration
 * Configuration for running the Fire Demo by Jare of VangeliSTeam (1993)
 */

import { presets } from '../utils/dosboxConfigBuilder';

/**
 * Fire Demo (hosted locally)
 * Jare's fire effect of May 1993, with its source, played to Elysium, a module by Jester of
 * Sanity
 *
 * Source: https://files.scene.org/view/mirrors/hornet/demos/1993/f/firedemo.zip
 * License: public domain, by Iguana's RELEASES.TXT; The Mod Archive lists Elysium under
 * CC BY-NC-SA 4.0 (see public/demos/README.md)
 */
export const fireDemoZipUrl = '/demos/fire-demo.zip';

/**
 * DOSBox configuration optimized for the Fire Demo
 *
 * Fire Demo requirements (RUNDEMO.PAS and FIRE.ASM):
 * - VGA graphics
 * - A sound device for ShellVT, VangeliSTracker 1.2b's player, which plays ELYSIUM.MOD and runs
 *   FIRE.EXE while it plays: the PC speaker, an AdLib, a DAC on the printer ports, or a Sound
 *   Blaster, with or without DMA
 *
 * This configuration uses:
 * - Fixed cycles (30000) on the simple CPU core, the demo() preset's
 * - Sound Blaster 16 for audio
 * - ShellVT started directly, with the command RUNDEMO.EXE builds from the answers for its
 *   DMA Stereo SB Pro or SB 16 driver at 22000 Hz, without stereo mixing or a volume boost.
 *   RUNDEMO asks for them with digit keys, and saves them in FIRE.CFG, which holds a setup for
 *   the PC speaker here.
 * - DOSBox's default 16 MB of memory
 */
export const fireDemoDosboxConf = presets
  .demo()
  .addAutoexec(
    '@echo off',
    'echo.',
    'echo ========================================',
    'echo   Fire Demo',
    'echo   by Jare of VangeliSTeam (1993)',
    'echo ========================================',
    'echo.',
    'echo Music: Elysium by Jester of Sanity',
    'echo Player: ShellVT, from VangeliSTracker 1.2b',
    'echo.',
    'echo Audio: Sound Blaster 16',
    'echo CPU: 30000 cycles',
    'echo.',
    'echo Mounting C: drive...',
    'mount c .',
    'c:',
    'echo.',
    'echo Starting the Fire Demo...',
    'echo.',
    'SHELLVT.EXE /d:DMA-SB-Stereo /f:22000 /v:63 /hq * /sh:Fire.Exe'
  )
  .build();

/** The config under the name the registry reads */
export { fireDemoDosboxConf as dosboxConf };
