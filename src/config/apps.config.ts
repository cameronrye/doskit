/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * Centralized DOS Applications Configuration
 * All available DOS apps are defined here for use across the application
 */

import type { DosApp } from '../types/dos-app';

/**
 * Available DOS applications and demos
 * Uses lazy loading to reduce initial bundle size
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
    loader: async (onProgress) => {
      const config = await import('../dos-apps/second-reality.config');
      const { loadZipArchive } = await import('../utils/diskLoader');
      return loadZipArchive(config.secondRealityZipUrl, onProgress);
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
    year: 1995,
    loadMethod: 'zip',
    dosboxConf: '',
    loader: async (onProgress) => {
      const config = await import('../dos-apps/impulse-tracker.config');
      return config.loadZipArchive(config.impulseTrackerZipUrl, onProgress);
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
    loader: async (onProgress) => {
      const config = await import('../dos-apps/starport-bbstro.config');
      return config.loadZipArchive(config.starportBbstroZipUrl, onProgress);
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
    loader: async (onProgress) => {
      const config = await import('../dos-apps/scream-tracker.config');
      return config.loadZipArchive(config.screamTrackerZipUrl, onProgress);
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
    loader: async (onProgress) => {
      const config = await import('../dos-apps/unreal.config');
      return config.loadZipArchive(config.unrealZipUrl, onProgress);
    },
    loadDosboxConf: async () => {
      const config = await import('../dos-apps/unreal.config');
      return config.unrealDosboxConf;
    },
  },
  {
    id: 'panic',
    name: 'Panic',
    description: 'Classic 1992 demo by Future Crew',
    author: 'Future Crew',
    year: 1992,
    loadMethod: 'zip',
    dosboxConf: '',
    loader: async (onProgress) => {
      const config = await import('../dos-apps/panic.config');
      return config.loadZipArchive(config.panicZipUrl, onProgress);
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
    loader: async (onProgress) => {
      const config = await import('../dos-apps/squid-bbstro.config');
      return config.loadZipArchive(config.squidBbstroZipUrl, onProgress);
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
    author: "Grumpy's Collection",
    year: 1990,
    loadMethod: 'zip',
    dosboxConf: '',
    loader: async (onProgress) => {
      const config = await import('../dos-apps/3drotate.config');
      return config.loadZipArchive(config.rotate3dZipUrl, onProgress);
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
    author: "Grumpy's Collection",
    year: 1990,
    loadMethod: 'zip',
    dosboxConf: '',
    loader: async (onProgress) => {
      const config = await import('../dos-apps/stars.config');
      return config.loadZipArchive(config.starsZipUrl, onProgress);
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
    loader: async (onProgress) => {
      const config = await import('../dos-apps/crystal-dream-2.config');
      return config.loadZipArchive(config.crystalDream2ZipUrl, onProgress);
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
 * Auto-generated URL mapping from available apps
 * Maps both URL-friendly IDs (no hyphens) and original IDs to internal IDs
 */
export const APP_ID_MAPPING: Record<string, string> = availableApps.reduce(
  (acc, app) => {
    const urlFriendly = getUrlFriendlyId(app.id);
    acc[urlFriendly] = app.id;
    acc[app.id] = app.id;
    return acc;
  },
  {} as Record<string, string>
);

/**
 * Reverse mapping: Internal ID -> URL-friendly ID
 */
export const INTERNAL_TO_URL_MAPPING: Record<string, string> = availableApps.reduce(
  (acc, app) => {
    acc[app.id] = getUrlFriendlyId(app.id);
    return acc;
  },
  {} as Record<string, string>
);
