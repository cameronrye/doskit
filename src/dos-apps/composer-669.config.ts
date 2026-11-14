/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * Composer 669 Configuration
 * Configuration for running Composer 669 1.3, Tran's music tracker for DOS (1992)
 */

import { presets } from '../utils/dosboxConfigBuilder';

/**
 * Composer 669 1.3 (hosted locally)
 * Tran's eight-channel music tracker for the Sound Blaster, for which the 669 format was made
 *
 * Source: https://files.scene.org/view/mirrors/hornet/music/programs/trackers/compsd13.zip
 * License: Freeware (FREEWARE.TXT)
 * Released: December 4, 1992
 */
export const composer669ZipUrl = '/demos/composer-669.zip';

/**
 * DOSBox configuration optimized for Composer 669
 *
 * Composer 669 requirements (COMPOSD.DOC, section 1-B):
 * - A 386 or better, a VGA card (it runs in 80x50 text mode) and DOS 3.0 or above
 * - A Sound Blaster (mono) or a Sound Blaster Pro (stereo), on IRQ 3, 5 or 7
 * - 2 MB of memory, 1408 KB of it extended, and no memory manager or other program that runs
 *   the machine in V86 mode, nor DOS loaded high
 *
 * This configuration uses:
 * - Fixed cycles (18000) on the simple CPU core, the musicTracker() preset's
 * - A Sound Blaster Pro 2 at 220, IRQ 7, DMA 1: on a Sound Blaster 16 it plays almost silently
 * - EMS, XMS and UMB off: with them it stops at once, "Not enough extended memory to run this
 *   program!!!"
 * - DOSBox's default 16 MB of memory
 * - /SC: and /IC:, which make C:\ its song and instrument directory, where the Files button puts
 *   the songs it brings in. The archive holds no song.
 */
export const composer669DosboxConf = presets
  .musicTracker()
  .setDOS({ ems: false, xms: false, umb: false })
  .setSoundBlaster({ sbtype: 'sbpro2' })
  .addAutoexec(
    '@echo off',
    'echo.',
    'echo ========================================',
    'echo   Composer 669 1.3',
    'echo   by Tran of Renaissance (1992)',
    'echo ========================================',
    'echo.',
    'echo An eight-channel tracker for .669 songs',
    'echo.',
    'echo CPU: 18000 cycles',
    'echo Audio: Sound Blaster Pro 2',
    'echo Memory: no EMS, XMS or UMB',
    'echo.',
    'echo Mounting C: drive...',
    'mount c .',
    'c:',
    'echo.',
    'echo Starting Composer 669...',
    'echo.',
    'COMPOSD.EXE /SC: /IC:'
  )
  .build();

/** The config under the name the registry reads */
export { composer669DosboxConf as dosboxConf };
