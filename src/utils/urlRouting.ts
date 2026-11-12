/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * URL Routing Utilities
 * Handles deep linking and URL-based app loading
 */

import {
  APP_ID_MAPPING,
  INTERNAL_TO_URL_MAPPING,
  getUrlFriendlyId as getUrlFriendlyIdFromConfig,
} from '../config/apps.config';

/**
 * The application a URL asks for
 */
export interface AppRequest {
  /** Internal ID of the app the URL names, or null for the start page */
  appId: string | null;
  /** Whether the URL has an ?app= parameter that names no known app */
  unknownApp: boolean;
  /**
   * That parameter's value reduced to safe characters, or null when none are left or there
   * are more than 100 to show
   */
  unknownAppId: string | null;
}

/**
 * Read the app the current URL asks for
 * Supports both query parameter (?app=secondreality) and path-based routing (/secondreality).
 * An ?app= parameter decides when present, even an empty one. A path that names no app,
 * such as /index.html, is the start page.
 */
export function getAppRequestFromUrl(): AppRequest {
  const appParam = new URLSearchParams(window.location.search).get('app');
  if (appParam !== null) {
    const fromQuery = sanitizeInput(appParam);
    const appId = fromQuery ? normalizeAppId(fromQuery) : null;
    return appId
      ? { appId, unknownApp: false, unknownAppId: null }
      : { appId: null, unknownApp: true, unknownAppId: fromQuery };
  }

  const firstSegment = window.location.pathname.split('/').find((segment) => segment.length > 0);
  // /secondreality.html is the file GitHub Pages serves at /secondreality
  const fromPath = firstSegment ? sanitizeInput(firstSegment.replace(/\.html$/, '')) : null;
  return {
    appId: fromPath ? normalizeAppId(fromPath) : null,
    unknownApp: false,
    unknownAppId: null,
  };
}

/**
 * Sanitize and validate input string to prevent XSS attacks
 * Only allows alphanumeric characters, hyphens, and underscores
 * @param input - The input string to sanitize
 * @returns The sanitized string or null if invalid
 */
function sanitizeInput(input: string): string | null {
  if (!input || typeof input !== 'string') {
    return null;
  }

  // Remove any characters that aren't alphanumeric, hyphens, or underscores
  const sanitized = input.replace(/[^a-zA-Z0-9\-_]/g, '');

  // Ensure the result is not empty and has reasonable length
  if (sanitized.length === 0 || sanitized.length > 100) {
    return null;
  }

  return sanitized;
}

/**
 * Normalize a URL-friendly app identifier to the internal app ID
 * @param urlId - The app identifier from the URL (e.g., 'secondreality' or 'second-reality')
 * @returns The internal app ID (e.g., 'second-reality') or null if not found
 */
export function normalizeAppId(urlId: string): string | null {
  // Sanitize input to prevent XSS
  const sanitized = sanitizeInput(urlId);
  if (!sanitized) {
    return null;
  }

  const normalized = sanitized.toLowerCase().trim();
  return APP_ID_MAPPING[normalized] || null;
}

/**
 * Convert an internal app ID to a URL-friendly identifier
 * @param appId - The internal app ID (e.g., 'second-reality')
 * @returns The URL-friendly ID (e.g., 'secondreality')
 */
export function getUrlFriendlyId(appId: string): string {
  return INTERNAL_TO_URL_MAPPING[appId] || getUrlFriendlyIdFromConfig(appId);
}

/** The site's address, which canonical links name */
const SITE = 'https://doskit.net';

/**
 * Update the browser URL with the specified app ID: an app's URL is its page, /<id> without
 * hyphens, which the build writes as <id>.html and GitHub Pages serves with a 200, and the
 * start page is /. Replacing also rewrites old /?app= links and other spellings in place.
 * The page's canonical link follows.
 * @param appId - The internal app ID, or null for the start page
 * @param replace - If true, replaces the current history entry instead of adding a new one
 */
export function updateUrlWithApp(appId: string | null, replace: boolean = false): void {
  const url = new URL(window.location.href);
  url.pathname = appId ? `/${getUrlFriendlyId(appId)}` : '/';
  // No ?app= stays, which would decide over the path on a reload
  url.searchParams.delete('app');

  // Each page names its own URL as canonical, and picking another app changes the URL
  // without loading that app's page
  const canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (canonical) {
    canonical.href = `${SITE}${url.pathname}`;
  }

  // Apps report themselves after loading asynchronously (deep links, back/forward),
  // when the URL already matches. Pushing again would duplicate the entry and
  // discard forward history.
  if (url.href === window.location.href) {
    return;
  }

  // Update the URL without reloading the page
  if (replace) {
    window.history.replaceState({}, '', url.toString());
  } else {
    window.history.pushState({}, '', url.toString());
  }
}

/**
 * Update the document title based on the loaded application
 * @param appName - The name of the loaded application, or undefined for default title
 */
export function updateDocumentTitle(appName?: string): void {
  if (appName) {
    document.title = `${appName} - DosKit`;
  } else {
    document.title = 'DosKit - DOS demoscene classics in your browser';
  }
}
