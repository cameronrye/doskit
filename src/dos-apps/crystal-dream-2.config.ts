/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * Crystal Dream 2 Configuration
 * Configuration for running Crystal Dream 2 by Triton (1993)
 */

import { loadZipArchive as loadZip } from '../utils/diskLoader';
import { presets } from '../utils/dosboxConfigBuilder';

// Re-export for lazy loading
export { loadZip as loadZipArchive };

/**
 * Crystal Dream 2 by Triton (hosted locally)
 * A legendary 1993 demo that won 1st place at The Computer Crossroads 1993
 *
 * Source: https://files.scene.org/get/demos/groups/triton/cd2-trn.zip
 * License: Scene/Historical
 * Size: ~2MB
 */
export const crystalDream2ZipUrl = '/demos/crystal-dream-2.zip';

/**
 * DOSBox configuration optimized for Crystal Dream 2
 *
 * Crystal Dream 2 requirements:
 * - 486 DX-50 recommended (runs on 386-40)
 * - VGA graphics
 * - Sound Blaster compatible sound card
 * - Memory: 4MB recommended
 *
 * This configuration uses:
 * - Auto CPU core, type and cycles
 * - Sound Blaster 16 for audio
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
    'echo   Crystal Dream 2',
    'echo   by Triton (1993)',
    'echo ========================================',
    'echo.',
    'echo 1st Place at The Computer Crossroads 1993',
    'echo.',
    'echo Audio: Sound Blaster 16',
    'echo CPU: Auto Cycles',
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
