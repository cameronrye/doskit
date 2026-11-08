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
   * The archive's size from the response's Content-Length, or null before the response,
   * when it gives none that can be read, or once more bytes have arrived than it said
   */
  totalBytes: number | null;
}

/** The size in a Content-Length header, or null for a missing or malformed one */
function parseContentLength(header: string | null): number | null {
  const value = header?.trim();
  return value && /^\d+$/.test(value) ? Number(value) : null;
}

/**
 * How long a download may receive nothing before it fails: from the start of the request,
 * retries included, and again from its response and from each chunk of the archive
 */
const STALL_TIMEOUT_MS = 20_000;

/**
 * Settle as the promise does, or reject with the signal's reason as soon as it aborts. A
 * body that does not come from the network, such as one built in a test, does not stop
 * when the request's signal aborts.
 */
function untilAborted<T>(promise: Promise<T>, signal: AbortSignal): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    // Firefox before 97 gives an abort no reason
    const abort = () =>
      reject(signal.reason ?? new DOMException('The operation was aborted.', 'AbortError'));
    signal.addEventListener('abort', abort, { once: true });
    promise.then(resolve, reject).finally(() => signal.removeEventListener('abort', abort));
    if (signal.aborted) abort();
  });
}

/** Read a response's body to its end, chunk by chunk, until the signal aborts */
async function readBody(
  response: Response,
  signal: AbortSignal,
  onChunk: (chunk: Uint8Array) => void
): Promise<void> {
  const reader = response.body?.getReader();
  if (!reader) return;
  const nextChunk = () => untilAborted(reader.read(), signal);
  try {
    for (let chunk = await nextChunk(); !chunk.done; chunk = await nextChunk()) {
      onChunk(chunk.value);
    }
  } catch (error) {
    // Let go of a body given up halfway
    reader.cancel().catch(() => {});
    throw error;
  }
}

/** How a ZIP archive starts: the signature of its first local file header, "PK\x03\x04" */
const ZIP_SIGNATURE = [0x50, 0x4b, 0x03, 0x04];

function isZipArchive(data: Uint8Array): boolean {
  return ZIP_SIGNATURE.every((byte, index) => data[index] === byte);
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
 * @param onProgress Optional progress callback: as the request starts, once the response
 *   arrives, and after each chunk of the archive, but never once the download is aborted
 * @param signal Optional AbortSignal to cancel the operation
 * @returns Uint8Array of the ZIP file
 * @throws {Error} A "TimeoutError" when no data arrives for 20 seconds
 */
export async function loadZipArchive(
  zipUrl: string,
  onProgress?: (progress: LoadProgress) => void,
  signal?: AbortSignal
): Promise<Uint8Array> {
  // Aborted by the caller, or when the download stalls
  const download = new AbortController();
  const abortWithCaller = () => download.abort(signal?.reason);
  if (signal?.aborted) abortWithCaller();
  signal?.addEventListener('abort', abortWithCaller, { once: true });

  const timedOut = Object.assign(
    new Error(`Download timed out: no data received for ${STALL_TIMEOUT_MS / 1000} seconds`),
    { name: 'TimeoutError' }
  );
  // Kept here rather than read from the signal's reason, which Firefox before 97 lacks
  let stalled = false;
  let stallTimer: ReturnType<typeof setTimeout> | undefined;
  const restartStallTimer = () => {
    clearTimeout(stallTimer);
    stallTimer = setTimeout(() => {
      stalled = true;
      download.abort(timedOut);
    }, STALL_TIMEOUT_MS);
  };
  // A chunk can arrive just before an abort and be handled after it: a caller that has
  // moved on gets no progress of the download it gave up
  const report = (progress: LoadProgress) => {
    if (!download.signal.aborted) onProgress?.(progress);
  };

  try {
    restartStallTimer();
    // From here on the download times itself out, which its caller may want to know
    report({ loadedBytes: 0, totalBytes: null });
    const response = await untilAborted(
      fetchWithRetry(
        zipUrl,
        { signal: download.signal },
        {
          maxRetries: 3,
          initialDelay: 1000,
          onRetry: (attempt, error, delay) => {
            // A retry follows an answer or a failed attempt, which a stalled request never gets
            restartStallTimer();
            if (import.meta.env.DEV) {
              console.log(`[DiskLoader] Retry ${attempt} for ZIP after ${delay}ms:`, error.message);
            }
          },
          signal: download.signal,
        }
      ),
      download.signal
    );
    restartStallTimer();

    if (!response.ok) {
      // Name the code: HTTP/2, which GitHub Pages serves, sends no status text
      const status = `HTTP ${response.status} ${response.statusText}`.trim();
      throw new Error(`Failed to load ZIP: ${status}`);
    }

    // Read the body chunk by chunk, to report the bytes as they arrive
    let totalBytes = parseContentLength(response.headers.get('Content-Length'));
    let loadedBytes = 0;
    const chunks: Uint8Array[] = [];
    report({ loadedBytes, totalBytes });
    await readBody(response, download.signal, (chunk) => {
      restartStallTimer();
      chunks.push(chunk);
      loadedBytes += chunk.byteLength;
      // Content-Length can count fewer bytes than the body gives, as for a compressed
      // response: the size is then unknown
      if (totalBytes !== null && loadedBytes > totalBytes) totalBytes = null;
      report({ loadedBytes, totalBytes });
    });
    const zipData = joinChunks(chunks, loadedBytes);

    // Vite's dev and preview servers answer a missing archive with 200 and index.html,
    // which js-dos would start as an empty C: drive
    if (!isZipArchive(zipData)) {
      const type = response.headers.get('Content-Type');
      throw new Error(`Failed to load ZIP: not a ZIP archive${type ? ` (${type})` : ''}`);
    }

    if (import.meta.env.DEV) {
      console.log(`[DiskLoader] Loaded ZIP archive: ${zipUrl} (${zipData.length} bytes)`);
    }

    return zipData;
  } catch (error) {
    // Whatever a stalled download failed with on its way out, it timed out
    const failure = stalled ? timedOut : error;
    // An abort is the caller's own doing (the selector's Cancel, a navigation that
    // supersedes the load): it still rejects, but is no failure to log
    if (!signal?.aborted) {
      console.error(`[DiskLoader] Error loading ZIP:`, failure);
    }
    throw failure;
  } finally {
    clearTimeout(stallTimer);
    signal?.removeEventListener('abort', abortWithCaller);
  }
}
