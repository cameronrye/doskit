/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * Disk Loader Utility
 * Downloads the ZIP archives that DOS applications are packaged in
 */

import { fetchWithRetry } from './fetchWithRetry';

/** How much of an archive has arrived */
export interface LoadProgress {
  /** Bytes received so far */
  loadedBytes: number;
  /**
   * The archive's size from the response's Content-Length, or null when it gives none
   * that can be read, or once more bytes have arrived than it said
   */
  totalBytes: number | null;
}

/** The size in a Content-Length header, or null for a missing or malformed one */
function parseContentLength(header: string | null): number | null {
  const value = header?.trim();
  return value && /^\d+$/.test(value) ? Number(value) : null;
}

/** The chunks of a download, joined in one array */
function joinChunks(chunks: Uint8Array[], length: number): Uint8Array {
  const data = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    data.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return data;
}

/**
 * Load a ZIP archive for js-dos
 * js-dos can automatically extract ZIP files
 * @param zipUrl URL to the ZIP file
 * @param onProgress Optional progress callback: once the response arrives, and after each
 *   chunk of the archive
 * @param signal Optional AbortSignal to cancel the operation
 * @returns Uint8Array of the ZIP file
 */
export async function loadZipArchive(
  zipUrl: string,
  onProgress?: (progress: LoadProgress) => void,
  signal?: AbortSignal
): Promise<Uint8Array> {
  try {
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
      // Name the code: HTTP/2, which GitHub Pages serves, sends no status text
      const status = `HTTP ${response.status} ${response.statusText}`.trim();
      throw new Error(`Failed to load ZIP: ${status}`);
    }

    // Read the body chunk by chunk, to report the bytes as they arrive
    let totalBytes = parseContentLength(response.headers.get('Content-Length'));
    let loadedBytes = 0;
    const chunks: Uint8Array[] = [];
    onProgress?.({ loadedBytes, totalBytes });
    const reader = response.body?.getReader();
    if (reader) {
      for (let chunk = await reader.read(); !chunk.done; chunk = await reader.read()) {
        chunks.push(chunk.value);
        loadedBytes += chunk.value.byteLength;
        // Content-Length can count fewer bytes than the body gives, as for a compressed
        // response: the size is then unknown
        if (totalBytes !== null && loadedBytes > totalBytes) totalBytes = null;
        onProgress?.({ loadedBytes, totalBytes });
      }
    }
    const zipData = joinChunks(chunks, loadedBytes);

    if (import.meta.env.DEV) {
      console.log(`[DiskLoader] Loaded ZIP archive: ${zipUrl} (${zipData.length} bytes)`);
    }

    return zipData;
  } catch (error) {
    // An abort is the caller's own doing (the selector's Cancel, a navigation that
    // supersedes the load): it still rejects, but is no failure to log
    if (!signal?.aborted) {
      console.error(`[DiskLoader] Error loading ZIP:`, error);
    }
    throw error;
  }
}
