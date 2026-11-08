/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * Scream Tracker 3 Configuration
 * Configuration for running Scream Tracker 3.21, a music tracker for DOS (1994)
 */

import { loadZipArchive as loadZip } from '../utils/diskLoader';
import { presets } from '../utils/dosboxConfigBuilder';

// Re-export for lazy loading
export { loadZip as loadZipArchive };

/**
 * Scream Tracker 3.21 (hosted locally)
 * The legendary tracker by Future Crew that created the S3M format
 *
 * Source: https://archive.org/details/scrmt321_202207
 * License: Freeware
 * Released: December 25, 1994
 */
export const screamTrackerZipUrl = '/demos/scream-tracker.zip';

/**
 * DOSBox configuration optimized for Scream Tracker 3
 *
 * Scream Tracker 3 requirements:
 * - 286 CPU minimum, 386+ recommended
 * - VGA graphics (text mode)
 * - Sound card: Sound Blaster, Gravis UltraSound, or AdLib
 * - Memory: 640KB RAM minimum, 2MB+ recommended
 *
 * This configuration uses:
 * - Fixed cycles (12000) on the simple CPU core, for stable audio playback
 * - Sound Blaster 16 for digital audio
 * - Gravis UltraSound for superior wavetable playback
 * - DOSBox's default 16 MB of memory, with EMS/XMS enabled
 * - Text mode display
 *
 * ST3 is famous for its excellent GUS support, so we enable both
 * Sound Blaster (for compatibility) and GUS (for quality)
 *
 * Based on the original documentation and community recommendations
 */
export const screamTrackerDosboxConf = presets
  .musicTracker()
  .setCPU({ core: 'simple', cputype: 'auto', cycles: 12000 })
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
  .addAutoexec(
    '@echo off',
    'echo.',
    'echo ========================================',
    'echo   Scream Tracker 3.21',
    'echo   by Future Crew (1994)',
    'echo ========================================',
    'echo.',
    'echo The legendary S3M tracker',
    'echo Code by Psi (Sami Tammilehto)',
    'echo.',
    'echo CPU: 12000 cycles',
    'echo Audio: Sound Blaster 16 + Gravis UltraSound',
    'echo.',
    'echo Mounting C: drive...',
    'mount c .',
    'c:',
    'echo.',
    'echo Starting Scream Tracker 3...',
    'echo.',
    'ST3.EXE'
  )
  .build();
