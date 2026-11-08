/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * localStorage access that never throws. Browsers can refuse storage: reading
 * window.localStorage throws a SecurityError when site data is blocked (privacy
 * settings, sandboxed iframes), it is null when storage is disabled, and
 * setItem throws a QuotaExceededError when storage is full. Treat it as
 * best-effort: a refused read returns null and a refused write is dropped.
 */

export const safeLocalStorage = {
  /** The stored value, or null if there is none or storage is unavailable */
  getItem(key: string): string | null {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },

  /** Store a value if the browser allows it */
  setItem(key: string, value: string): void {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      // Not saved: storage is blocked or full
    }
  },

  /** Remove a value if the browser allows it */
  removeItem(key: string): void {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // Storage is blocked, so there is nothing to remove
    }
  },
};
