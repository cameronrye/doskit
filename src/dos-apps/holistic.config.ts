/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * Holistic Configuration
 * Configuration for running Holistic by Cascada VR Section (1994)
 */

import { presets } from '../utils/dosboxConfigBuilder';

/**
 * Holistic (hosted locally)
 * Cascada VR Section's demo, second in the PC demo competition at Assembly '94
 *
 * Source: https://files.scene.org/view/parties/1994/assembly94/demo/holistic.zip
 * License: Freeware (HOLISTIC.NFO; see public/demos/README.md)
 */
export const holisticZipUrl = '/demos/holistic.zip';

/**
 * DOSBox configuration for Holistic
 *
 * Holistic requirements (HOLISTIC.NFO):
 * - A 386 with a standard VGA card; a 486DX/66 with VLB recommended
 * - 4 MB of memory: 2.8 MB of extended memory and 590 KB of conventional memory
 * - Sound, chosen in its setup: Gravis UltraSound (recommended), Sound Blaster, Sound Blaster
 *   16 or Covox. "SoundBlaster16 owners MUST choose SoundBlaster16 in the Setup."
 *
 * This configuration uses:
 * - The demo preset: the simple CPU core at a fixed 30000 cycles
 * - The preset's Sound Blaster 16 at 220h, IRQ 7, high DMA 5, which its setup's Sound
 *   Blaster 16 choice takes (220, DMA 5, IRQ 7)
 * - No Gravis UltraSound: with one, its music hung at a random point in DOSBox
 * - DOSBox's default 16 MB of memory
 */
export const holisticDosboxConf = presets
  .demo()
  .addAutoexec(
    '@echo off',
    'echo.',
    'echo ========================================',
    'echo   Holistic',
    'echo   by Cascada VR Section (1994)',
    'echo ========================================',
    'echo.',
    "echo 2nd Place at Assembly '94",
    'echo Code by Hellraiser and Robban',
    'echo Graphics by Mirage, music by Zodiak',
    'echo.',
    'echo Audio: Sound Blaster 16',
    'echo CPU: 30000 cycles',
    'echo.',
    'echo Mounting C: drive...',
    'mount c .',
    'c:',
    'echo.',
    'echo Starting Holistic...',
    'echo.',
    'HOLISTIC.EXE'
  )
  .build();

/** The config under the name the registry reads */
export { holisticDosboxConf as dosboxConf };
