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
 * Future Crew's demo, shown at The Party 1992 and released in February 1993
 *
 * Source: https://files.scene.org/view/demos/groups/future_crew/demos/panic.zip
 * License: Freeware
 * Shown at The Party 1992 (2nd place), released on 4 February 1993
 */
export const panicZipUrl = '/demos/panic.zip';

/**
 * DOSBox configuration optimized for Panic
 *
 * Panic requirements (PANIC.NFO):
 * - A fast 386 or 486, and a fast VGA adapter
 * - About 600 KB of conventional memory
 * - For the music, a Sound Blaster or Sound Blaster Pro and 1 MB of EMS
 *
 * This configuration uses:
 * - Auto CPU core and type, at a fixed 30000 cycles. 'auto' would give it 3,000 cycles/ms, at
 *   which its opening runs seconds behind and some effects drop to 22-45 frames a second; at
 *   'max' it plays no sound.
 * - Sound Blaster 16 for audio
 * - A plain VGA (machine vgaonly): Panic changes the palette while a frame is drawn, which
 *   DOSBox's default SVGA machine applies once a frame, tearing its chrome-letter scroller and
 *   striping its plasma
 * - DOSBox's default 16 MB of memory, with EMS enabled
 */
export const panicDosboxConf = presets
  .demo()
  .setMachine({ machine: 'vgaonly' })
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
    'echo   Panic by Future Crew',
    'echo   1993 - 2nd at The Party 1992',
    'echo ========================================',
    'echo.',
    'echo Code by Wildfire, Psi and Trug',
    'echo Music by Purple Motion, graphics by Pixel',
    'echo.',
    'echo Audio: Sound Blaster 16',
    'echo CPU: 30000 cycles',
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

/** The config under the name the registry reads */
export { panicDosboxConf as dosboxConf };
