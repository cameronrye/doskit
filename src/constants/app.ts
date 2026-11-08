/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * Application Constants
 * Centralized configuration values and magic numbers
 */

/**
 * PWA Configuration
 */
export const PWA_CONFIG = {
  /** Service worker update check interval (milliseconds) */
  UPDATE_CHECK_INTERVAL: 60000, // 1 minute

  /** Delay before showing install prompt (milliseconds) */
  INSTALL_PROMPT_DELAY: 5000, // 5 seconds

  /** Maximum number of times to show install prompt after dismissal */
  MAX_INSTALL_DISMISSALS: 3,

  /** Days to wait before showing install prompt again after dismissal */
  INSTALL_DISMISSAL_COOLDOWN_DAYS: 7,

  /** Maximum retry attempts for service worker update */
  UPDATE_MAX_RETRIES: 3,

  /** Base delay for service worker update retries (milliseconds) */
  UPDATE_BASE_DELAY: 1000, // 1 second

  /** Milliseconds in one day (for date calculations) */
  MS_PER_DAY: 24 * 60 * 60 * 1000,
} as const;

/**
 * UI Configuration
 */
export const UI_CONFIG = {
  /** Toast notification duration (milliseconds) */
  TOAST_DURATION: 3000,
} as const;
