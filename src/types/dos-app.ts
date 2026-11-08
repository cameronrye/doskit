/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * DOS Application Type Definitions
 */

import type { LoadProgress } from '../utils/diskLoader';

/**
 * Represents a DOS application that can be loaded and run in the emulator
 */
export interface DosApp {
  /** Unique identifier for the application */
  id: string;
  /** Display name of the application */
  name: string;
  /** Description of the application */
  description: string;
  /** Author or publisher of the application */
  author?: string;
  /** Year of release */
  year?: number;
  /** How the application's files arrive, shown on its disk in the selector: every app is a ZIP */
  loadMethod: 'zip';
  /** DOSBox configuration string */
  dosboxConf: string;
  /**
   * Function to load the application files
   * @param onProgress - Optional callback for progress updates
   * @param signal - Optional AbortSignal that cancels the download
   * @returns Promise resolving to the bytes of the app's ZIP archive
   */
  loader: (
    onProgress?: (progress: LoadProgress) => void,
    signal?: AbortSignal
  ) => Promise<Uint8Array>;
  /**
   * Lazy load the DOSBox configuration
   * @returns Promise resolving to DOSBox configuration string
   */
  loadDosboxConf?: () => Promise<string>;
}
