/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 */

import type { LoadProgress } from './diskLoader';

/**
 * What the progress bar shows: the share of the archive downloaded when its size is known,
 * or else the megabytes received, with no percentage for the bar
 */
export function describeProgress(progress: LoadProgress | null): {
  percent: number | null;
  text: string;
} {
  // Nothing yet, or a download that has only started, or an answer that gives no size
  if (!progress || (progress.loadedBytes === 0 && progress.totalBytes === null)) {
    return { percent: null, text: 'Starting download…' };
  }
  const { loadedBytes, totalBytes } = progress;
  if (totalBytes) {
    // Rounded down, so that 100% means every byte is in
    const percent = Math.min(100, Math.floor((loadedBytes / totalBytes) * 100));
    return { percent, text: `Downloading… ${percent}%` };
  }
  return { percent: null, text: `Downloading… ${(loadedBytes / 1_000_000).toFixed(1)} MB` };
}
