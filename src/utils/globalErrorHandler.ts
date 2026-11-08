/**
 * DosKit - Global Error Handler
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * Centralized error handling for uncaught errors and unhandled promise rejections
 */

import { getErrorTracker, ErrorSeverity, type ErrorContext } from './errorTracking';
import { getUserFriendlyError } from './errorMessages';
import { logger } from './logger';

/**
 * Known harmless error patterns that should be suppressed
 */
const HARMLESS_ERROR_PATTERNS = [
  // Fullscreen API errors (require user interaction)
  /exitFullscreen/i,
  /requestFullscreen/i,
  /fullscreen.*not supported/i,

  // Keyboard lock errors (require user interaction)
  /lock\(\) request could not be registered/i,
  /keyboard.*lock/i,

  // ResizeObserver errors (benign)
  /ResizeObserver loop/i,

  // Browser extension errors
  /extension context invalidated/i,
  /chrome-extension:/i,
];

/**
 * Check if an error should be suppressed
 * @param error - Error to check
 * @returns True if error should be suppressed
 */
function shouldSuppressError(error: unknown): boolean {
  // Rejection reasons can be anything, including undefined (`reject()`)
  const message =
    typeof error === 'object' && error !== null && 'message' in error
      ? String(error.message)
      : String(error);

  return HARMLESS_ERROR_PATTERNS.some((pattern) => pattern.test(message));
}

/**
 * Get browser context information
 * @returns Browser context
 */
function getBrowserContext(): ErrorContext['browser'] {
  return {
    userAgent: navigator.userAgent,
    language: navigator.language,
    online: navigator.onLine,
  };
}

/**
 * Global error handler configuration
 */
export interface GlobalErrorHandlerConfig {
  /** Whether to show user-friendly error messages */
  showUserFriendlyErrors?: boolean;
  /** Whether to suppress known harmless errors */
  suppressHarmlessErrors?: boolean;
  /** Custom error filter function */
  errorFilter?: (error: Error | string) => boolean;
  /** Callback when an error is captured */
  onError?: (error: Error, context: ErrorContext) => void;
}

const DEFAULT_CONFIG: GlobalErrorHandlerConfig = {
  showUserFriendlyErrors: true,
  suppressHarmlessErrors: true,
};

let isInitialized = false;
let config = DEFAULT_CONFIG;

/**
 * Handle uncaught errors
 */
function handleUncaughtError(event: ErrorEvent): void {
  // event.error is null for cross-origin "Script error." events, and can be any
  // value when a non-Error is thrown
  const actualError: Error | undefined =
    event.error instanceof Error
      ? event.error
      : event.error != null
        ? new Error(String(event.error))
        : undefined;
  const errorMessage = event.message;

  // Check if error should be suppressed. Listeners suppress the browser's own
  // report with preventDefault(); returning true only works for window.onerror.
  if (config.suppressHarmlessErrors && shouldSuppressError(actualError || errorMessage)) {
    if (import.meta.env.DEV) {
      logger.debug('GlobalErrorHandler', 'Suppressed harmless error', errorMessage);
    }
    event.preventDefault();
    return;
  }

  // Apply custom filter
  if (config.errorFilter && !config.errorFilter(actualError || errorMessage)) {
    event.preventDefault();
    return;
  }

  // Build error context
  const context: ErrorContext = {
    userAction: 'Unknown',
    browser: getBrowserContext(),
    metadata: {
      source: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      timestamp: new Date().toISOString(),
    },
  };

  // Log error
  logger.error('GlobalErrorHandler', 'Uncaught error', actualError || errorMessage, context);

  // Track error
  const tracker = getErrorTracker();
  tracker.captureError(actualError || new Error(errorMessage), context, ErrorSeverity.ERROR);

  // Call custom error handler
  if (config.onError && actualError) {
    config.onError(actualError, context);
  }

  // Show user-friendly error if enabled
  if (config.showUserFriendlyErrors && !import.meta.env.DEV) {
    const friendlyError = getUserFriendlyError(actualError || errorMessage);
    // Could show a toast notification here
    console.error('Error:', friendlyError.message);
    if (friendlyError.suggestion) {
      console.info('Suggestion:', friendlyError.suggestion);
    }
  }
}

/**
 * Handle unhandled promise rejections
 */
function handleUnhandledRejection(event: PromiseRejectionEvent): void {
  const error = event.reason;

  // Check if error should be suppressed
  if (config.suppressHarmlessErrors && shouldSuppressError(error)) {
    if (import.meta.env.DEV) {
      logger.debug('GlobalErrorHandler', 'Suppressed harmless promise rejection', error);
    }
    event.preventDefault();
    return;
  }

  // Apply custom filter
  if (config.errorFilter && !config.errorFilter(error)) {
    event.preventDefault();
    return;
  }

  // Build error context
  const context: ErrorContext = {
    userAction: 'Promise rejection',
    browser: getBrowserContext(),
    metadata: {
      timestamp: new Date().toISOString(),
      promise: event.promise,
    },
  };

  // Log error
  logger.error('GlobalErrorHandler', 'Unhandled promise rejection', error, context);

  // Track error
  const tracker = getErrorTracker();
  const actualError = error instanceof Error ? error : new Error(String(error));
  tracker.captureError(actualError, context, ErrorSeverity.ERROR);

  // Call custom error handler
  if (config.onError) {
    config.onError(actualError, context);
  }

  // Show user-friendly error if enabled
  if (config.showUserFriendlyErrors && !import.meta.env.DEV) {
    const friendlyError = getUserFriendlyError(error);
    console.error('Error:', friendlyError.message);
    if (friendlyError.suggestion) {
      console.info('Suggestion:', friendlyError.suggestion);
    }
  }
}

/**
 * Initialize global error handler
 * @param options - Configuration options
 */
export function initializeGlobalErrorHandler(options: GlobalErrorHandlerConfig = {}): void {
  if (isInitialized) {
    logger.warn('GlobalErrorHandler', 'Already initialized');
    return;
  }

  config = { ...DEFAULT_CONFIG, ...options };

  // Register global error handler
  window.addEventListener('error', handleUncaughtError);

  // Register unhandled promise rejection handler
  window.addEventListener('unhandledrejection', handleUnhandledRejection);

  isInitialized = true;
  logger.info('GlobalErrorHandler', 'Initialized');
}

/**
 * Cleanup global error handler
 */
export function cleanupGlobalErrorHandler(): void {
  if (!isInitialized) {
    return;
  }

  window.removeEventListener('error', handleUncaughtError);
  window.removeEventListener('unhandledrejection', handleUnhandledRejection);

  isInitialized = false;
  logger.info('GlobalErrorHandler', 'Cleaned up');
}

/**
 * Check if global error handler is initialized
 */
export function isGlobalErrorHandlerInitialized(): boolean {
  return isInitialized;
}
