/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * Disk Loader Utility
 * Utilities for loading DOS files and disk images into the emulator
 */

import type { InitFileEntry } from '../types/js-dos';

export interface DosFile {
  path: string;
  url: string;
}

export interface LoadProgress {
  loaded: number;
  total: number;
  currentFile: string;
}

/**
 * Load multiple files from URLs and prepare them for js-dos initFs
 * @param files Array of file definitions with path and URL
 * @param onProgress Optional progress callback
 * @returns Array of InitFileEntry objects ready for js-dos
 */
export async function loadFilesFromUrls(
  files: DosFile[],
  onProgress?: (progress: LoadProgress) => void
): Promise<InitFileEntry[]> {
  const initFs: InitFileEntry[] = [];
  let loaded = 0;
  const total = files.length;

  for (const file of files) {
    try {
      if (onProgress) {
        onProgress({ loaded, total, currentFile: file.path });
      }

      const response = await fetch(file.url);
      if (!response.ok) {
        throw new Error(`Failed to load ${file.path}: ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      initFs.push({
        path: file.path,
        contents: new Uint8Array(arrayBuffer),
      });

      loaded++;
      if (import.meta.env.DEV) {
        console.log(`[DiskLoader] Loaded ${file.path} (${loaded}/${total})`);
      }
    } catch (error) {
      console.error(`[DiskLoader] Error loading ${file.path}:`, error);
      throw error;
    }
  }

  if (onProgress) {
    onProgress({ loaded, total, currentFile: 'Complete' });
  }

  return initFs;
}

/**
 * Load a ZIP archive for js-dos
 * js-dos can automatically extract ZIP files
 * @param zipUrl URL to the ZIP file
 * @returns Uint8Array of the ZIP file
 */
export async function loadZipArchive(zipUrl: string): Promise<Uint8Array> {
  try {
    const response = await fetch(zipUrl);
    if (!response.ok) {
      throw new Error(`Failed to load ZIP: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const zipData = new Uint8Array(arrayBuffer);

    if (import.meta.env.DEV) {
      console.log(`[DiskLoader] Loaded ZIP archive: ${zipUrl} (${zipData.length} bytes)`);
    }

    return zipData;
  } catch (error) {
    console.error(`[DiskLoader] Error loading ZIP:`, error);
    throw error;
  }
}

/**
 * Load a disk image file (.img, .ima, .iso)
 * @param imageUrl URL to the disk image
 * @param mountPath Path where the image will be stored in the virtual FS
 * @returns InitFileEntry for the disk image
 */
export async function loadDiskImage(
  imageUrl: string,
  mountPath: string = '/disk.img'
): Promise<InitFileEntry> {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to load disk image: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const imageData = new Uint8Array(arrayBuffer);

    if (import.meta.env.DEV) {
      console.log(
        `[DiskLoader] Loaded disk image: ${imageUrl} (${imageData.length} bytes)`
      );
    }

    return {
      path: mountPath,
      contents: imageData,
    };
  } catch (error) {
    console.error(`[DiskLoader] Error loading disk image:`, error);
    throw error;
  }
}

/**
 * Load files from a directory structure
 * Useful for loading entire application directories
 * @param baseUrl Base URL for the files
 * @param fileList List of relative file paths
 * @param basePath Base path in the virtual file system (default: '/')
 * @returns Array of InitFileEntry objects
 */
export async function loadDirectory(
  baseUrl: string,
  fileList: string[],
  basePath: string = '/'
): Promise<InitFileEntry[]> {
  const files: DosFile[] = fileList.map((file) => ({
    path: `${basePath}${file}`,
    url: `${baseUrl}${file}`,
  }));

  return loadFilesFromUrls(files);
}

/**
 * Create a text file in memory
 * Useful for creating config files, batch files, etc.
 * @param path Path in the virtual file system
 * @param content Text content
 * @returns InitFileEntry for the text file
 */
export function createTextFile(path: string, content: string): InitFileEntry {
  const encoder = new TextEncoder();
  return {
    path,
    contents: encoder.encode(content),
  };
}

/**
 * Validate file size before loading
 * @param url URL to check
 * @param maxSizeMB Maximum allowed size in megabytes
 * @returns true if file is within size limit
 */
export async function validateFileSize(
  url: string,
  maxSizeMB: number = 50
): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    const contentLength = response.headers.get('content-length');

    if (!contentLength) {
      console.warn(`[DiskLoader] Could not determine file size for ${url}`);
      return true; // Allow if we can't determine size
    }

    const sizeMB = parseInt(contentLength) / (1024 * 1024);
    const isValid = sizeMB <= maxSizeMB;

    if (!isValid) {
      console.warn(
        `[DiskLoader] File ${url} exceeds size limit: ${sizeMB.toFixed(2)}MB > ${maxSizeMB}MB`
      );
    }

    return isValid;
  } catch (error) {
    console.error(`[DiskLoader] Error validating file size:`, error);
    return true; // Allow on error
  }
}

/**
 * Cache files in browser storage for offline use
 * Uses IndexedDB via Cache API
 * @param files Array of file definitions
 * @param cacheName Name for the cache
 */
export async function cacheFiles(
  files: DosFile[],
  cacheName: string = 'doskit-files'
): Promise<void> {
  if (!('caches' in window)) {
    console.warn('[DiskLoader] Cache API not available');
    return;
  }

  try {
    const cache = await caches.open(cacheName);
    const urls = files.map((f) => f.url);
    await cache.addAll(urls);

    if (import.meta.env.DEV) {
      console.log(`[DiskLoader] Cached ${urls.length} files`);
    }
  } catch (error) {
    console.error('[DiskLoader] Error caching files:', error);
  }
}

/**
 * Load files with caching support
 * Tries to load from cache first, falls back to network
 * @param files Array of file definitions
 * @param cacheName Name for the cache
 * @returns Array of InitFileEntry objects
 */
export async function loadFilesWithCache(
  files: DosFile[],
  cacheName: string = 'doskit-files'
): Promise<InitFileEntry[]> {
  const initFs: InitFileEntry[] = [];

  for (const file of files) {
    try {
      let response: Response;

      // Try cache first
      if ('caches' in window) {
        const cache = await caches.open(cacheName);
        const cachedResponse = await cache.match(file.url);

        if (cachedResponse) {
          response = cachedResponse;
          if (import.meta.env.DEV) {
            console.log(`[DiskLoader] Loaded ${file.path} from cache`);
          }
        } else {
          response = await fetch(file.url);
          // Cache for next time
          await cache.put(file.url, response.clone());
          if (import.meta.env.DEV) {
            console.log(`[DiskLoader] Loaded ${file.path} from network and cached`);
          }
        }
      } else {
        response = await fetch(file.url);
      }

      const arrayBuffer = await response.arrayBuffer();
      initFs.push({
        path: file.path,
        contents: new Uint8Array(arrayBuffer),
      });
    } catch (error) {
      console.error(`[DiskLoader] Error loading ${file.path}:`, error);
      throw error;
    }
  }

  return initFs;
}

