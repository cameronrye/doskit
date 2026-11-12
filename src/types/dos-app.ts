/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * DOS Application Type Definitions
 */

import type { LoadProgress } from '../utils/diskLoader';

/** What a production is, which decides where the selector lists it */
export type AppKind = 'demo' | 'intro' | 'tracker' | 'effect';

/**
 * What an app's data file, src/apps/<id>.json, holds: the facts the registry, the selector and
 * the build's pages share. Its text for visitors is in <id>.page.json beside it.
 */
export interface AppData {
  /** Its id, also the name of its archive in public/demos and of its config in src/dos-apps */
  id: string;
  /** Its place in the selector: the four demos first, then the intros, trackers and effects */
  order: number;
  kind: AppKind;
  name: string;
  /** One line for the selector: facts, no praise */
  description: string;
  /** The release's author and year, from the archive's own files; left out when unknown */
  author?: string;
  year?: number;
  /** The size of public/demos/<id>.zip, shown on its disk */
  archiveBytes: number;
  /** Whether it flashes more than three times a second over a large part of the picture */
  flashing?: boolean;
  /** See DosApp.warnBeforeLeaving */
  warnBeforeLeaving?: boolean;
}

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
  /** What it is: a demo, an intro, a tracker or an effect */
  kind: AppKind;
  /** The size of the archive it downloads, in bytes */
  archiveBytes: number;
  /**
   * Whether it flashes more than three times a second over a large part of the picture, the
   * limit of WCAG 2.3.1: the selector and the Play screen warn of it
   */
  flashing?: boolean;
  /** How the application's files arrive, shown on its disk in the selector: every app is a ZIP */
  loadMethod: 'zip';
  /** DOSBox configuration string */
  dosboxConf: string;
  /**
   * Ask before the page is closed or reloaded while this app runs. For apps whose work a
   * closed page loses, such as a song in a tracker: on Windows, Linux and ChromeOS, browsers
   * keep Ctrl+W, Ctrl+N and Ctrl+T for themselves, so a DOS program's Ctrl-W can close the
   * tab at once.
   */
  warnBeforeLeaving?: boolean;
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
