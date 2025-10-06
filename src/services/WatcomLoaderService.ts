/**
 * WatcomLoaderService
 * 
 * Loads Open Watcom compiler files into the js-dos filesystem
 * Files are fetched from /watcom/ (public/watcom/) and written to the DOS filesystem
 */

import type { CommandInterface } from '../types/js-dos.d';

export interface WatcomFile {
  dosPath: string;  // Path in DOS filesystem (e.g., '/WATCOM/BINW/WCC.EXE')
  url: string;      // URL to fetch from (e.g., '/watcom/BINW/wcc.exe')
}

export class WatcomLoaderService {
  private ci: CommandInterface;
  private loaded: boolean = false;

  // Essential files needed for compilation
  private static readonly ESSENTIAL_FILES: WatcomFile[] = [
    // DOS extender (required for 32-bit protected mode executables)
    { dosPath: '/WATCOM/BINW/DOS4GW.EXE', url: '/watcom/BINW/dos4gw.exe' },

    // Compiler binaries
    { dosPath: '/WATCOM/BINW/WCC.EXE', url: '/watcom/BINW/wcc.exe' },
    { dosPath: '/WATCOM/BINW/WLINK.EXE', url: '/watcom/BINW/wlink.exe' },
    { dosPath: '/WATCOM/BINW/WLIB.EXE', url: '/watcom/BINW/wlib.exe' },

    // Essential header files
    { dosPath: '/WATCOM/H/stdio.h', url: '/watcom/H/stdio.h' },
    { dosPath: '/WATCOM/H/stdlib.h', url: '/watcom/H/stdlib.h' },
    { dosPath: '/WATCOM/H/string.h', url: '/watcom/H/string.h' },
    { dosPath: '/WATCOM/H/dos.h', url: '/watcom/H/dos.h' },
    { dosPath: '/WATCOM/H/conio.h', url: '/watcom/H/conio.h' },
    { dosPath: '/WATCOM/H/stddef.h', url: '/watcom/H/stddef.h' },
    { dosPath: '/WATCOM/H/stdarg.h', url: '/watcom/H/stdarg.h' },

    // Essential library files
    { dosPath: '/WATCOM/LIB286/DOS/clibs.lib', url: '/watcom/LIB286/DOS/clibs.lib' },
  ];

  constructor(ci: CommandInterface) {
    this.ci = ci;
  }

  /**
   * Load WATCOM files into the DOS filesystem
   * This should be called once after the emulator is ready
   */
  async loadWatcomFiles(): Promise<void> {
    if (this.loaded) {
      console.log('[WatcomLoader] WATCOM files already loaded');
      return;
    }

    console.log('[WatcomLoader] Loading WATCOM compiler files...');
    const startTime = Date.now();

    try {
      // Load files in parallel for better performance
      await Promise.all(
        WatcomLoaderService.ESSENTIAL_FILES.map(file => this.loadFile(file))
      );

      this.loaded = true;
      const elapsed = Date.now() - startTime;
      console.log(`[WatcomLoader] Successfully loaded ${WatcomLoaderService.ESSENTIAL_FILES.length} files in ${elapsed}ms`);
    } catch (error) {
      console.error('[WatcomLoader] Failed to load WATCOM files:', error);
      throw new Error('Failed to load WATCOM compiler files');
    }
  }

  /**
   * Load a single file from URL and write to DOS filesystem
   */
  private async loadFile(file: WatcomFile): Promise<void> {
    try {
      // Fetch file from URL
      if (import.meta.env.DEV) {
        console.log(`[WatcomLoader] Fetching: ${file.url}`);
      }

      const response = await fetch(file.url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Convert to Uint8Array
      const arrayBuffer = await response.arrayBuffer();
      const data = new Uint8Array(arrayBuffer);

      if (import.meta.env.DEV) {
        console.log(`[WatcomLoader] Fetched ${data.length} bytes from ${file.url}`);
      }

      // Write to DOS filesystem
      await this.ci.fsWriteFile(file.dosPath, data);

      // Verify the write by reading back
      const written = await this.ci.fsReadFile(file.dosPath);

      if (import.meta.env.DEV) {
        console.log(`[WatcomLoader] Wrote to ${file.dosPath}: ${data.length} bytes, verified: ${written.length} bytes`);
      }
    } catch (error) {
      console.error(`[WatcomLoader] Failed to load ${file.url}:`, error);
      throw error;
    }
  }

  /**
   * Check if WATCOM files are loaded
   */
  isLoaded(): boolean {
    return this.loaded;
  }
}

