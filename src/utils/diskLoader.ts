/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * Disk Loader Utility
 * Downloads the ZIP archives that DOS applications are packaged in
 */

import { fetchWithRetry } from './fetchWithRetry';

export interface LoadProgress {
  loaded: number;
  total: number;
  currentFile: string;
}

/**
 * Load a ZIP archive for js-dos
 * js-dos can automatically extract ZIP files
 * @param zipUrl URL to the ZIP file
 * @param onProgress Optional progress callback
 * @param signal Optional AbortSignal to cancel the operation
 * @returns Uint8Array of the ZIP file
 */
export async function loadZipArchive(
  zipUrl: string,
  onProgress?: (progress: LoadProgress) => void,
  signal?: AbortSignal
): Promise<Uint8Array> {
  try {
    if (onProgress) {
      onProgress({
        loaded: 0,
        total: 1,
        currentFile: 'Downloading ZIP archive...',
      });
    }

    const response = await fetchWithRetry(
      zipUrl,
      { signal },
      {
        maxRetries: 3,
        initialDelay: 1000,
        onRetry: (attempt, error, delay) => {
          if (import.meta.env.DEV) {
            console.log(`[DiskLoader] Retry ${attempt} for ZIP after ${delay}ms:`, error.message);
          }
        },
        signal,
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to load ZIP: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const zipData = new Uint8Array(arrayBuffer);

    if (onProgress) {
      onProgress({ loaded: 1, total: 1, currentFile: 'ZIP archive loaded' });
    }

    if (import.meta.env.DEV) {
      console.log(`[DiskLoader] Loaded ZIP archive: ${zipUrl} (${zipData.length} bytes)`);
    }

    return zipData;
  } catch (error) {
    console.error(`[DiskLoader] Error loading ZIP:`, error);
    throw error;
  }
}
