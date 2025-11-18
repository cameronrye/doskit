/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * DOS Application Type Definitions
 */

import type { InitFileEntry } from "./js-dos";
import type { LoadProgress } from "../utils/diskLoader";

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
  /** URL to thumbnail image */
  thumbnail?: string;
  /** Method used to load the application files */
  loadMethod: "files" | "zip" | "disk-image";
  /** DOSBox configuration string */
  dosboxConf: string;
  /**
   * Function to load the application files
   * @param onProgress - Optional callback for progress updates
   * @returns Promise resolving to file entries or disk image data
   */
  loader: (
    onProgress?: (progress: LoadProgress) => void,
  ) => Promise<InitFileEntry[] | Uint8Array>;
  /**
   * Lazy load the DOSBox configuration
   * @returns Promise resolving to DOSBox configuration string
   */
  loadDosboxConf?: () => Promise<string>;
}
