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
 * - 486 CPU with auto cycles
 * - Sound Blaster 16 for audio
 * - Standard VGA graphics
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
    'echo   Crystal Dream 2',
    'echo   by Triton (1993)',
    'echo ========================================',
    'echo.',
    'echo 1st Place at The Computer Crossroads 1993',
    'echo.',
    'echo Audio: Sound Blaster 16',
    'echo CPU: 486 (Auto Cycles)',
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

/**
 * Configuration metadata
 */
export const crystalDream2Metadata = {
  name: 'Crystal Dream 2',
  author: 'Triton',
  year: 1993,
  description:
    'Legendary 1993 demo featuring stunning 3D graphics, fractal zoomer, and raytraced scenes. Won 1st place at The Computer Crossroads 1993. One of the most influential PC demos of the early 90s.',
  requirements: {
    cpu: '486 DX-50 recommended (runs on 386-40)',
    memory: '4MB RAM',
    graphics: 'VGA',
    sound: 'Sound Blaster compatible',
  },
  license: 'Scene/Historical',
  party: 'The Computer Crossroads 1993',
  ranking: '1st place',
  notes: [
    'One of the most quoted demos of the early-mid 90s',
    'Competed with Second Reality for impact',
    "Features music by Lizardking ('Trans Atlantic') and Vogue",
    'Includes fractal zoomer that keeps zooming',
    '3D chess scene is a technical masterpiece',
    'Vector slime effect is highly regarded',
    'Triton later became Starbreeze Studios (game company)',
    'Also created FastTracker 2 music tracker',
  ],
};
