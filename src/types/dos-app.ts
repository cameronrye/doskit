/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * DOS Application Type Definitions
 */

import type { LoadProgress } from '../utils/diskLoader';
import type { ReadySignal, StartRecipe } from '../utils/startRecipe';
import type { DosOptions } from './js-dos';

/** What a production is, which decides the start page's tab it is listed under */
export type AppKind = 'demo' | 'intro' | 'musicdisk' | 'diskmag' | 'tracker' | 'effect';

/**
 * The files a tracker's Files panel brings in, and where: Impulse Tracker and Scream Tracker 3
 * read modules from C:\, EdLib its songs from C:\SONGS
 */
export interface ModuleImport {
  /** The file name extensions it takes, such as ".edl" */
  accept: string[];
  /** The folder of C: they go to, such as "SONGS"; left out, C:\ itself */
  folder?: string;
}

/**
 * What an app's data file, src/apps/<id>.json, holds: the facts the registry, the start page and
 * the build's pages share. Its text for visitors is in <id>.page.json beside it.
 */
export interface AppData {
  /** Its id, also the name of its archive in public/demos and of its config in src/dos-apps */
  id: string;
  /**
   * Its place on the start page: the demos first, then the intros, musicdisks, diskmags,
   * trackers and effects
   */
  order: number;
  kind: AppKind;
  name: string;
  /** One line for the start page and the production's page: facts, no praise */
  description: string;
  /** The release's author and year, from the archive's own files; left out when unknown */
  author?: string;
  year?: number;
  /** The size of public/demos/<id>.zip, shown on the start page and the production's page */
  archiveBytes: number;
  /** Whether it flashes more than three times a second over a large part of the picture */
  flashing?: boolean;
  /** See DosApp.contentNote */
  contentNote?: string;
  /** See DosApp.warnBeforeLeaving */
  warnBeforeLeaving?: boolean;
  /** See DosApp.saveFiles */
  saveFiles?: boolean;
  /** See DosApp.modules */
  modules?: ModuleImport;
  /** See DosApp.jsdos */
  jsdos?: Partial<DosOptions>;
  /** The keys that start it at its setup screen, for a production that waits at one */
  start?: {
    /** One step per key, by its name in src/utils/dosKeys.ts; keys held together joined by + */
    keys: string[];
    /** Between one key's release and the next one's press; 250 ms when left out */
    gapMs?: number;
    ready: ReadySignal;
    /** What the start does, for the production's page: what it picks, and what comes first */
    note: string;
  };
  /** The keys to press when DosKit cannot start it, shown once its own start gives up */
  hint?: string;
}

/**
 * What an app's page file, src/apps/<id>.page.json, says for visitors: the build puts it in
 * the app's static page (scripts/app-pages.ts reads the same files), and the About panel
 * loads it when it opens
 */
export interface AppPage {
  /** The meta description and the text of the share card */
  description: string;
  about: string[];
  /** Where and when it was shown or released, and how it placed */
  released?: string;
  credits?: string;
  /** Its authors' terms, quoted or summed up */
  terms?: string;
  /** How DosKit's version differs from the original on real hardware */
  accuracy?: string[];
  /** Its pages elsewhere, such as pouet.net's and Demozoo's */
  links?: { label: string; url: string }[];
  imageAlt: string;
  authorType?: 'Organization' | 'Person';
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
  /** What it is: a demo, an intro, a musicdisk, a diskmag, a tracker or an effect */
  kind: AppKind;
  /** The size of the archive it downloads, in bytes */
  archiveBytes: number;
  /**
   * Whether it flashes more than three times a second over a large part of the picture, the
   * limit of WCAG 2.3.1: the start page and the production's page warn of it
   */
  flashing?: boolean;
  /**
   * What else it shows that a visitor may want to know before it starts, such as nudity: one
   * sentence, starting "Contains", which the start page, the production's page, the About panel and
   * its page show beside the flashing warning
   */
  contentNote?: string;
  /** The keys DosKit sends to get past its setup screen, once that screen is up */
  start?: StartRecipe;
  /** What that start does, for the production's page */
  startNote?: string;
  /** The keys to press when DosKit's start gives up */
  hint?: string;
  /**
   * Keep the files it saves in the browser, such as a tracker's songs: they come back after
   * its archive at its next start, and can be downloaded, replaced or reset
   */
  saveFiles?: boolean;
  /** What its Files panel brings in, and where; left out, the module formats in C:\ */
  modules?: ModuleImport;
  /**
   * js-dos options of its own, over DosKit's and the visitor's: Impulse Tracker draws its
   * own mouse pointer, which lines up with the real one only at the AsIs aspect
   */
  jsdos?: Partial<DosOptions>;
  /** How the production's files arrive: every app is a ZIP */
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
