/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * Centralized DOS Applications Configuration
 * All available DOS apps are defined here for use across the application
 */

import type { AppData, DosApp } from '../types/dos-app';
import { loadZipArchive } from '../utils/diskLoader';
import { dosKey, isDosKeyName } from '../utils/dosKeys';
import type { StartRecipe } from '../utils/startRecipe';

/** What an app's config module, src/dos-apps/<id>.config.ts, gives the registry */
interface AppConfigModule {
  dosboxConf: string;
}

// The apps' data files, without the page files beside them (<id>.page.json): text the
// registry imported would be in the main bundle, and every edit of it a new bundle
const appData = import.meta.glob<AppData>(['../apps/*.json', '!../apps/*.page.json'], {
  eager: true,
  import: 'default',
});

// Every app's config module, each imported only when its app loads: a chunk of its own, which
// production builds still store in the service worker's cache when it installs, for offline use
const configModules = import.meta.glob<AppConfigModule>('../dos-apps/*.config.ts');

/** An app's start keys as js-dos's key codes: "Right" is 262, "LeftCtrl+L" two keys at once */
function startRecipeOf(id: string, start: NonNullable<AppData['start']>): StartRecipe {
  return {
    steps: start.keys.map((step) => ({
      keys: step.split('+').map((name) => {
        if (!isDosKeyName(name))
          throw new Error(`src/apps/${id}.json names an unknown key: ${name}`);
        return dosKey[name];
      }),
    })),
    gapMs: start.gapMs ?? 250,
    ready: start.ready,
  };
}

/**
 * The DosApp of an app's data: its archive is /demos/<id>.zip, and its DOSBox config comes
 * from its config module, imported when the app loads or its config is preloaded
 */
function appFromData(data: AppData): DosApp {
  const loadConfig = configModules[`../dos-apps/${data.id}.config.ts`];
  if (!loadConfig) {
    throw new Error(`src/dos-apps/${data.id}.config.ts is missing`);
  }
  return {
    id: data.id,
    name: data.name,
    description: data.description,
    author: data.author,
    year: data.year,
    kind: data.kind,
    archiveBytes: data.archiveBytes,
    loadMethod: 'zip',
    dosboxConf: '', // Loaded dynamically
    ...(data.flashing ? { flashing: true } : {}),
    ...(data.warnBeforeLeaving ? { warnBeforeLeaving: true } : {}),
    ...(data.saveFiles ? { saveFiles: true } : {}),
    ...(data.jsdos ? { jsdos: data.jsdos } : {}),
    ...(data.start
      ? { start: startRecipeOf(data.id, data.start), startNote: data.start.note }
      : {}),
    ...(data.hint ? { hint: data.hint } : {}),
    loader: (onProgress, signal) => loadZipArchive(`/demos/${data.id}.zip`, onProgress, signal),
    loadDosboxConf: async () => (await loadConfig()).dosboxConf,
  };
}

/**
 * Available DOS applications and demos, in the selector's order: one data file per app in
 * src/apps, and one config module per app in src/dos-apps
 */
export const availableApps: DosApp[] = Object.values(appData)
  .sort((a, b) => a.order - b.order)
  .map(appFromData);

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
