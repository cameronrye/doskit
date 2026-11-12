/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * Crystal Dream 2 Configuration
 * Configuration for running Crystal Dream 2 by Triton (1993)
 */

import { presets } from '../utils/dosboxConfigBuilder';

/**
 * Crystal Dream 2 by Triton (hosted locally)
 * A legendary 1993 demo that won 1st place at The Computer Crossroads 1993
 *
 * Source: https://files.scene.org/get/demos/groups/triton/cd2-trn.zip
 * License: none found (see public/demos/README.md)
 * Size: ~2MB
 */
export const crystalDream2ZipUrl = '/demos/crystal-dream-2.zip';

/**
 * DOSBox configuration optimized for Crystal Dream 2
 *
 * Crystal Dream 2 requirements: the archive has no readme and CD2.EXE is packed, so these are
 * what the program shows when it runs
 * - VGA graphics
 * - Sound device, chosen in its setup: Ultrasound, SoundBlaster (mixing at 32000 to 44000 Hz),
 *   or a mono DAC on LPT1 or LPT2
 * - A fast enough processor: on a slower one it stops with "System overloaded! Too heavy tasks
 *   for a too weak processor!"
 *
 * This configuration uses:
 * - Auto CPU core and type, at maximum cycles. CD2.EXE unpacks itself in real mode, where
 *   'auto' cycles would hold it at 3,000 cycles/ms for about 46 s before its setup appears;
 *   at a fixed 30000 cycles the demo stops with "System overloaded!"
 * - Gravis UltraSound, the setup's first choice: without one, DOSBox sets no ULTRASND and
 *   that choice ends at the DOS prompt
 * - Sound Blaster 16 for the setup's second choice, which does not work here: it asks for a
 *   mixing rate and then crashes. DosKit starts the demo on Ultrasound.
 * - Standard VGA graphics
 * - DOSBox's default 16 MB of memory
 *
 * Features:
 * - 3D wireframe and filled vector graphics
 * - Fractal zoomer (Mandelbrot set)
 * - Vector slime effect
 * - Raytraced graphics
 * - Texture-mapped 3D chess scene
 * - Music by Lizardking and Vogue
 */
export const crystalDream2DosboxConf = presets
  .demo()
  .setCPU({ core: 'auto', cputype: 'auto', cycles: 'max' })
  .setSoundBlaster({
    sbtype: 'sb16',
    sbbase: 220,
    irq: 7,
    dma: 1,
    hdma: 5,
    oplmode: 'auto',
  })
  .setGUS({
    gus: true,
    gusbase: 240,
    gusirq: 5,
    gusdma: 3,
    ultradir: 'C:\\ULTRASND',
  })
  .setJoystick({ joysticktype: 'none' })
  .addAutoexec(
    '@echo off',
    'echo.',
    'echo ========================================',
    'echo   Crystal Dream 2',
    'echo   by Triton (1993)',
    'echo ========================================',
    'echo.',
    'echo 1st Place at The Computer Crossroads 1993',
    'echo.',
    'echo Audio: Gravis UltraSound + Sound Blaster 16',
    'echo CPU: Maximum Cycles',
    'echo Graphics: VGA',
    'echo.',
    'echo Features:',
    'echo - 3D vector graphics',
    'echo - Fractal zoomer',
    'echo - Vector slime',
    'echo - Raytraced scenes',
    'echo - 3D chess scene',
    'echo - Music by Lizardking and Vogue',
    'echo.',
    'echo Mounting C: drive...',
    'mount c .',
    'c:',
    'echo.',
    'echo Starting Crystal Dream 2...',
    'echo.',
    'CD2.EXE'
  )
  .build();
