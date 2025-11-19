/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * URL Routing Utilities
 * Handles deep linking and URL-based app loading
 */

/**
 * Mapping between URL-friendly app identifiers and internal app IDs
 * URL-friendly IDs have no hyphens for easier typing
 */
const APP_ID_MAPPING: Record<string, string> = {
  // URL-friendly (no hyphens) -> Internal ID (with hyphens)
  secondreality: "second-reality",
  impulsetracker: "impulse-tracker",
  starportbbstro: "starport-bbstro",
  screamtracker: "scream-tracker",
  unreal: "unreal",
  panic: "panic",
  // Also support the hyphenated versions directly
  "second-reality": "second-reality",
  "impulse-tracker": "impulse-tracker",
  "starport-bbstro": "starport-bbstro",
  "scream-tracker": "scream-tracker",
};

/**
 * Reverse mapping: Internal ID -> URL-friendly ID
 */
const INTERNAL_TO_URL_MAPPING: Record<string, string> = {
  "second-reality": "secondreality",
  "impulse-tracker": "impulsetracker",
  "starport-bbstro": "starportbbstro",
  "scream-tracker": "screamtracker",
  unreal: "unreal",
  panic: "panic",
};

/**
 * Get the app ID from the current URL
 * Supports both query parameter (?app=secondreality) and path-based routing (/secondreality)
 * @returns The internal app ID if found, null otherwise
 */
export function getAppIdFromUrl(): string | null {
  // First, try query parameter
  const params = new URLSearchParams(window.location.search);
  const appParam = params.get("app");

  if (appParam) {
    const sanitized = sanitizeInput(appParam);
    if (sanitized) {
      return normalizeAppId(sanitized);
    }
  }

  // Then, try path-based routing (e.g., /secondreality)
  const path = window.location.pathname;
  const pathSegments = path.split("/").filter((segment) => segment.length > 0);

  // If there's a path segment, try to use it as an app ID
  if (pathSegments.length > 0) {
    const potentialAppId = pathSegments[0];
    if (potentialAppId) {
      const sanitized = sanitizeInput(potentialAppId);
      if (sanitized) {
        const normalizedId = normalizeAppId(sanitized);

        // Only return if it's a valid app ID (exists in mapping)
        if (normalizedId) {
          return normalizedId;
        }
      }
    }
  }

  return null;
}

/**
 * Sanitize and validate input string to prevent XSS attacks
 * Only allows alphanumeric characters, hyphens, and underscores
 * @param input - The input string to sanitize
 * @returns The sanitized string or null if invalid
 */
function sanitizeInput(input: string): string | null {
  if (!input || typeof input !== "string") {
    return null;
  }

  // Remove any characters that aren't alphanumeric, hyphens, or underscores
  const sanitized = input.replace(/[^a-zA-Z0-9\-_]/g, "");

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
  return INTERNAL_TO_URL_MAPPING[appId] || appId.replace(/-/g, "");
}

/**
 * Update the browser URL with the specified app ID
 * Uses query parameter approach: ?app=secondreality
 * @param appId - The internal app ID, or null to remove the app parameter
 * @param replace - If true, replaces the current history entry instead of adding a new one
 */
export function updateUrlWithApp(
  appId: string | null,
  replace: boolean = false,
): void {
  const url = new URL(window.location.href);

  if (appId) {
    const urlFriendlyId = getUrlFriendlyId(appId);
    url.searchParams.set("app", urlFriendlyId);
  } else {
    url.searchParams.delete("app");
  }

  // Update the URL without reloading the page
  if (replace) {
    window.history.replaceState({}, "", url.toString());
  } else {
    window.history.pushState({}, "", url.toString());
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
    document.title = "DosKit - Cross-Platform DOS Emulator";
  }
}

/**
 * Check if the current URL has an app parameter
 * @returns true if an app parameter is present in the URL
 */
export function hasAppInUrl(): boolean {
  return getAppIdFromUrl() !== null;
}

/**
 * Get the current URL as a shareable link
 * @returns The current URL as a string
 */
export function getShareableUrl(): string {
  return window.location.href;
}

/**
 * Register a new app ID mapping
 * Useful for dynamically added apps
 * @param urlFriendlyId - The URL-friendly identifier (e.g., 'myapp')
 * @param internalId - The internal app ID (e.g., 'my-app')
 */
export function registerAppIdMapping(
  urlFriendlyId: string,
  internalId: string,
): void {
  // Sanitize inputs to prevent XSS
  const sanitizedUrlId = sanitizeInput(urlFriendlyId);
  const sanitizedInternalId = sanitizeInput(internalId);

  if (!sanitizedUrlId || !sanitizedInternalId) {
    console.warn("[urlRouting] Invalid app ID mapping rejected:", {
      urlFriendlyId,
      internalId,
    });
    return;
  }

  APP_ID_MAPPING[sanitizedUrlId.toLowerCase()] = sanitizedInternalId;
  APP_ID_MAPPING[sanitizedInternalId.toLowerCase()] = sanitizedInternalId; // Also support the internal ID directly
  INTERNAL_TO_URL_MAPPING[sanitizedInternalId] = sanitizedUrlId;
}
