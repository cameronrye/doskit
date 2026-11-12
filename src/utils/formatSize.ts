/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * Sizes as the selector shows them, in decimal units like the download progress: one decimal
 * under 10 of a unit, whole numbers above
 */

export function formatSize(bytes: number): string {
  if (bytes < 1000) {
    return `${bytes} B`;
  }
  if (bytes < 999_500) {
    const kilobytes = bytes / 1000;
    return kilobytes < 9.95 ? `${kilobytes.toFixed(1)} KB` : `${Math.round(kilobytes)} KB`;
  }
  const megabytes = bytes / 1_000_000;
  return megabytes < 9.95 ? `${megabytes.toFixed(1)} MB` : `${Math.round(megabytes)} MB`;
}
