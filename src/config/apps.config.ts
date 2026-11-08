/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * Centralized DOS Applications Configuration
 * All available DOS apps are defined here for use across the application
 */

import type { DosApp } from '../types/dos-app';
import { loadZipArchive } from '../utils/diskLoader';

/**
 * Available DOS applications and demos
 * Each app's config module (src/dos-apps) is imported lazily, so the page only imports its
 * code when the app is loaded or its config preloaded (production builds still store every
 * chunk in the service worker's cache when it installs, for offline use)
 */
export const availableApps: DosApp[] = [
  {
    id: 'second-reality',
    name: 'Second Reality',
    description: 'Legendary 1993 demo by Future Crew',
    author: 'Future Crew',
    year: 1993,
    loadMethod: 'zip',
    dosboxConf: '', // Loaded dynamically
    loader: async (onProgress, signal) => {
      const config = await import('../dos-apps/second-reality.config');
      return loadZipArchive(config.secondRealityZipUrl, onProgress, signal);
    },
    loadDosboxConf: async () => {
      const config = await import('../dos-apps/second-reality.config');
      return config.secondRealityDosboxConf;
    },
  },
  {
    id: 'impulse-tracker',
    name: 'Impulse Tracker',
    description: 'Classic music tracker software',
    author: 'Jeffrey Lim',
    year: 1997,
    loadMethod: 'zip',
    dosboxConf: '',
    warnBeforeLeaving: true, // a song in progress
    loader: async (onProgress, signal) => {
      const config = await import('../dos-apps/impulse-tracker.config');
      return loadZipArchive(config.impulseTrackerZipUrl, onProgress, signal);
    },
    loadDosboxConf: async () => {
      const config = await import('../dos-apps/impulse-tracker.config');
      return config.impulseTrackerDosboxConf;
    },
  },
  {
    id: 'starport-bbstro',
    name: 'Starport BBS Intro II',
    description: 'Tiny BBS intro (1993 bytes) by Future Crew',
    author: 'Future Crew',
    year: 1993,
    loadMethod: 'zip',
    dosboxConf: '',
    loader: async (onProgress, signal) => {
      const config = await import('../dos-apps/starport-bbstro.config');
      return loadZipArchive(config.starportBbstroZipUrl, onProgress, signal);
    },
    loadDosboxConf: async () => {
      const config = await import('../dos-apps/starport-bbstro.config');
      return config.starportBbstroDosboxConf;
    },
  },
  {
    id: 'scream-tracker',
    name: 'Scream Tracker 3',
    description: 'Legendary S3M tracker by Future Crew',
    author: 'Future Crew',
    year: 1994,
    loadMethod: 'zip',
    dosboxConf: '',
    warnBeforeLeaving: true, // a song in progress; its Ctrl-W (save) can close the tab
    loader: async (onProgress, signal) => {
      const config = await import('../dos-apps/scream-tracker.config');
      return loadZipArchive(config.screamTrackerZipUrl, onProgress, signal);
    },
    loadDosboxConf: async () => {
      const config = await import('../dos-apps/scream-tracker.config');
      return config.screamTrackerDosboxConf;
    },
  },
  {
    id: 'unreal',
    name: 'Unreal',
    description: 'Groundbreaking 1992 demo by Future Crew',
    author: 'Future Crew',
    year: 1992,
    loadMethod: 'zip',
    dosboxConf: '',
    loader: async (onProgress, signal) => {
      const config = await import('../dos-apps/unreal.config');
      return loadZipArchive(config.unrealZipUrl, onProgress, signal);
    },
    loadDosboxConf: async () => {
      const config = await import('../dos-apps/unreal.config');
      return config.unrealDosboxConf;
    },
  },
  {
    id: 'panic',
    name: 'Panic',
    description: 'Classic 1993 demo by Future Crew',
    author: 'Future Crew',
    year: 1993,
    loadMethod: 'zip',
    dosboxConf: '',
    loader: async (onProgress, signal) => {
      const config = await import('../dos-apps/panic.config');
      return loadZipArchive(config.panicZipUrl, onProgress, signal);
    },
    loadDosboxConf: async () => {
      const config = await import('../dos-apps/panic.config');
      return config.panicDosboxConf;
    },
  },
  {
    id: 'squid-bbstro',
    name: 'Squid BBS Intro',
    description: 'Tiny BBS intro (1899 bytes) by cld & The Doctor',
    author: 'cld & The Doctor',
    year: 1994,
    loadMethod: 'zip',
    dosboxConf: '',
    loader: async (onProgress, signal) => {
      const config = await import('../dos-apps/squid-bbstro.config');
      return loadZipArchive(config.squidBbstroZipUrl, onProgress, signal);
    },
    loadDosboxConf: async () => {
      const config = await import('../dos-apps/squid-bbstro.config');
      return config.squidBbstroDosboxConf;
    },
  },
  {
    id: '3drotate',
    name: '3D Rotation Demo',
    description: "Classic 3D rotation effect from Grumpy's collection",
    author: 'Draeden of VLA',
    year: 1993,
    loadMethod: 'zip',
    dosboxConf: '',
    loader: async (onProgress, signal) => {
      const config = await import('../dos-apps/3drotate.config');
      return loadZipArchive(config.rotate3dZipUrl, onProgress, signal);
    },
    loadDosboxConf: async () => {
      const config = await import('../dos-apps/3drotate.config');
      return config.rotate3dDosboxConf;
    },
  },
  {
    id: 'stars',
    name: 'Starfield Effect',
    description: 'Classic starfield effect simulating flying through space',
    author: 'Draeden of VLA',
    year: 1993,
    loadMethod: 'zip',
    dosboxConf: '',
    loader: async (onProgress, signal) => {
      const config = await import('../dos-apps/stars.config');
      return loadZipArchive(config.starsZipUrl, onProgress, signal);
    },
    loadDosboxConf: async () => {
      const config = await import('../dos-apps/stars.config');
      return config.starsDosboxConf;
    },
  },
  {
    id: 'crystal-dream-2',
    name: 'Crystal Dream 2',
    description: "Legendary 1993 demo by Triton - 1st place at TCC'93",
    author: 'Triton',
    year: 1993,
    loadMethod: 'zip',
    dosboxConf: '',
    loader: async (onProgress, signal) => {
      const config = await import('../dos-apps/crystal-dream-2.config');
      return loadZipArchive(config.crystalDream2ZipUrl, onProgress, signal);
    },
    loadDosboxConf: async () => {
      const config = await import('../dos-apps/crystal-dream-2.config');
      return config.crystalDream2DosboxConf;
    },
  },
];

/**
 * Find an application by its ID
 * @param id - The app ID to search for
 * @returns The DosApp if found, undefined otherwise
 */
export function findAppById(id: string): DosApp | undefined {
  return availableApps.find((app) => app.id === id);
}

/**
 * Generate URL-friendly ID from app ID
 * Removes hyphens for easier typing in URLs
 */
export function getUrlFriendlyId(appId: string): string {
  return appId.replace(/-/g, '');
}

/**
 * An empty mapping with no prototype: a URL's ?app=constructor or ?app=__proto__ must find
 * nothing, not the Object function or Object.prototype every plain object inherits
 */
const emptyMapping = (): Record<string, string> => Object.create(null);

/**
 * Auto-generated URL mapping from available apps
 * Maps both URL-friendly IDs (no hyphens) and original IDs to internal IDs
 */
export const APP_ID_MAPPING: Record<string, string> = availableApps.reduce((acc, app) => {
  const urlFriendly = getUrlFriendlyId(app.id);
  acc[urlFriendly] = app.id;
  acc[app.id] = app.id;
  return acc;
}, emptyMapping());

/**
 * Reverse mapping: Internal ID -> URL-friendly ID
 */
export const INTERNAL_TO_URL_MAPPING: Record<string, string> = availableApps.reduce((acc, app) => {
  acc[app.id] = getUrlFriendlyId(app.id);
  return acc;
}, emptyMapping());
