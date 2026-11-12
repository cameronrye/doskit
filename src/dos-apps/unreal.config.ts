/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * Unreal Configuration
 * Configuration for running the Unreal demo by Future Crew (1992)
 */

import { presets } from '../utils/dosboxConfigBuilder';

/**
 * Unreal demo (hosted locally)
 * A groundbreaking demo by Future Crew (1992)
 *
 * Source: https://archive.org/details/unreal_zip
 * License: Freeware
 * Released at Assembly 1992 (1st place)
 */
export const unrealZipUrl = '/demos/unreal.zip';

/**
 * DOSBox configuration optimized for Unreal
 *
 * Unreal requirements (README.NOW):
 * - A 386 or a 486, "preferably the latter"
 * - VGA graphics
 * - 600,000 bytes of memory
 * - For sound, a Sound Blaster, Sound Blaster Pro or Soundmaster II; it also runs without one
 *
 * This configuration uses:
 * - Auto CPU core and type, at a fixed 30000 cycles. 'auto' would give it 3,000 cycles/ms, at
 *   which its text scroller falls a phrase behind within a minute.
 * - Sound Blaster 16 for audio
 * - Standard VGA graphics
 * - DOSBox's default 16 MB of memory
 */
export const unrealDosboxConf = presets
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
    'echo   Unreal by Future Crew',
    'echo   1992 - Assembly 1992 Winner',
    'echo ========================================',
    'echo.',
    'echo A groundbreaking demo featuring:',
    'echo - Advanced 3D graphics',
    'echo - Smooth animations',
    'echo - Excellent music by Purple Motion',
    'echo.',
    'echo Audio: Sound Blaster 16',
    'echo CPU: 30000 cycles',
    'echo.',
    'echo Mounting C: drive...',
    'mount c .',
    'c:',
    'echo.',
    'echo Starting Unreal...',
    'echo.',
    'UNREAL.EXE'
  )
  .build();

/** The config under the name the registry reads */
export { unrealDosboxConf as dosboxConf };
