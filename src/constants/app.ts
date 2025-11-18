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

  /** Service worker registration timeout (milliseconds) */
  REGISTRATION_TIMEOUT: 10000, // 10 seconds

  /** Offline indicator display delay (milliseconds) */
  OFFLINE_INDICATOR_DELAY: 1000, // 1 second

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
 * Audio Configuration
 */
export const AUDIO_CONFIG = {
  /** Default volume level (0.0 to 1.0) */
  DEFAULT_VOLUME: 0.7,

  /** Minimum volume level */
  MIN_VOLUME: 0.0,

  /** Maximum volume level */
  MAX_VOLUME: 1.0,

  /** Volume adjustment step */
  VOLUME_STEP: 0.1,
} as const;

/**
 * Emulator Configuration
 */
export const EMULATOR_CONFIG = {
  /** Default DOSBox cycles */
  DEFAULT_CYCLES: "auto",

  /** Default memory size (MB) */
  DEFAULT_MEMORY: 16,

  /** Sidebar close delay on startup (milliseconds) */
  SIDEBAR_CLOSE_DELAY: 500,

  /** App load event dispatch delay (milliseconds) */
  APP_LOAD_DELAY: 100,
} as const;

/**
 * File Loading Configuration
 */
export const FILE_LOADING_CONFIG = {
  /** Maximum file size for validation (MB) */
  MAX_FILE_SIZE_MB: 50,

  /** Network request timeout (milliseconds) */
  NETWORK_TIMEOUT: 30000, // 30 seconds

  /** Retry attempts for failed requests */
  MAX_RETRY_ATTEMPTS: 3,

  /** Delay between retry attempts (milliseconds) */
  RETRY_DELAY: 1000,
} as const;

/**
 * Cache Configuration
 */
export const CACHE_CONFIG = {
  /** Maximum number of cached items */
  MAX_CACHE_SIZE: 100,

  /** Cache expiration time (milliseconds) */
  CACHE_EXPIRATION: 7 * 24 * 60 * 60 * 1000, // 7 days

  /** Cache name prefix */
  CACHE_NAME_PREFIX: "doskit",
} as const;

/**
 * UI Configuration
 */
export const UI_CONFIG = {
  /** Toast notification duration (milliseconds) */
  TOAST_DURATION: 3000,

  /** Loading spinner delay (milliseconds) */
  LOADING_SPINNER_DELAY: 200,

  /** Animation duration (milliseconds) */
  ANIMATION_DURATION: 300,

  /** Debounce delay for search/filter (milliseconds) */
  DEBOUNCE_DELAY: 300,
} as const;

/**
 * URL Routing Configuration
 */
export const ROUTING_CONFIG = {
  /** Maximum app ID length */
  MAX_APP_ID_LENGTH: 100,

  /** Popstate handling delay (milliseconds) */
  POPSTATE_DELAY: 100,
} as const;

/**
 * Error Handling Configuration
 */
export const ERROR_CONFIG = {
  /** Error message display duration (milliseconds) */
  ERROR_DISPLAY_DURATION: 5000,

  /** Maximum error message length */
  MAX_ERROR_MESSAGE_LENGTH: 500,
} as const;

/**
 * Application Metadata
 */
export const APP_METADATA = {
  /** Application name */
  NAME: "DosKit",

  /** Application tagline */
  TAGLINE: "Cross-Platform DOS Emulator",

  /** js-dos version */
  JSDOS_VERSION: "v8.3.20",

  /** Author name */
  AUTHOR: "Cameron Rye",

  /** Author website */
  AUTHOR_WEBSITE: "https://rye.dev/",

  /** js-dos website */
  JSDOS_WEBSITE: "https://js-dos.com",
} as const;
