/**
 * DosKit - Global Error Handler
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * Centralized error handling for uncaught errors and unhandled promise rejections
 */

import {
  getErrorTracker,
  ErrorSeverity,
  type ErrorContext,
} from "./errorTracking";
import { getUserFriendlyError } from "./errorMessages";
import { logger } from "./logger";

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
function shouldSuppressError(error: Error | string): boolean {
  const message = typeof error === "string" ? error : error.message;

  return HARMLESS_ERROR_PATTERNS.some((pattern) => pattern.test(message));
}

/**
 * Get browser context information
 * @returns Browser context
 */
function getBrowserContext(): ErrorContext["browser"] {
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

let isInitialized = false;
let config: GlobalErrorHandlerConfig = {
  showUserFriendlyErrors: true,
  suppressHarmlessErrors: true,
};

/**
 * Handle uncaught errors
 */
function handleUncaughtError(
  event: ErrorEvent | string,
  source?: string,
  lineno?: number,
  colno?: number,
  error?: Error,
): boolean {
  // Extract error information
  const actualError =
    error || (typeof event === "string" ? new Error(event) : event.error);
  const errorMessage = typeof event === "string" ? event : event.message;

  // Check if error should be suppressed
  if (
    config.suppressHarmlessErrors &&
    shouldSuppressError(actualError || errorMessage)
  ) {
    if (import.meta.env.DEV) {
      logger.debug("Suppressed harmless error:", errorMessage);
    }
    return true; // Prevent default error handling
  }

  // Apply custom filter
  if (config.errorFilter && !config.errorFilter(actualError || errorMessage)) {
    return true;
  }

  // Build error context
  const context: ErrorContext = {
    userAction: "Unknown",
    browser: getBrowserContext(),
    metadata: {
      source,
      lineno,
      colno,
      timestamp: new Date().toISOString(),
    },
  };

  // Log error
  logger.error("Uncaught error:", actualError || errorMessage, context);

  // Track error
  const tracker = getErrorTracker();
  tracker.captureError(
    actualError || new Error(errorMessage),
    context,
    ErrorSeverity.ERROR,
  );

  // Call custom error handler
  if (config.onError && actualError) {
    config.onError(actualError, context);
  }

  // Show user-friendly error if enabled
  if (config.showUserFriendlyErrors && !import.meta.env.DEV) {
    const friendlyError = getUserFriendlyError(actualError || errorMessage);
    // Could show a toast notification here
    console.error("Error:", friendlyError.message);
    if (friendlyError.suggestion) {
      console.info("Suggestion:", friendlyError.suggestion);
    }
  }

  // Return false to allow default error handling
  return false;
}

/**
 * Handle unhandled promise rejections
 */
function handleUnhandledRejection(event: PromiseRejectionEvent): void {
  const error = event.reason;

  // Check if error should be suppressed
  if (config.suppressHarmlessErrors && shouldSuppressError(error)) {
    if (import.meta.env.DEV) {
      logger.debug("Suppressed harmless promise rejection:", error);
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
    userAction: "Promise rejection",
    browser: getBrowserContext(),
    metadata: {
      timestamp: new Date().toISOString(),
      promise: event.promise,
    },
  };

  // Log error
  logger.error("Unhandled promise rejection:", error, context);

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
    console.error("Error:", friendlyError.message);
    if (friendlyError.suggestion) {
      console.info("Suggestion:", friendlyError.suggestion);
    }
  }
}

/**
 * Initialize global error handler
 * @param options - Configuration options
 */
export function initializeGlobalErrorHandler(
  options: GlobalErrorHandlerConfig = {},
): void {
  if (isInitialized) {
    logger.warn("GlobalErrorHandler", "Already initialized");
    return;
  }

  config = { ...config, ...options };

  // Register global error handler
  window.addEventListener(
    "error",
    handleUncaughtError as unknown as EventListener,
  );

  // Register unhandled promise rejection handler
  window.addEventListener("unhandledrejection", handleUnhandledRejection);

  isInitialized = true;
  logger.info("GlobalErrorHandler", "Initialized");
}

/**
 * Cleanup global error handler
 */
export function cleanupGlobalErrorHandler(): void {
  if (!isInitialized) {
    return;
  }

  window.removeEventListener(
    "error",
    handleUncaughtError as unknown as EventListener,
  );
  window.removeEventListener("unhandledrejection", handleUnhandledRejection);

  isInitialized = false;
  logger.info("GlobalErrorHandler", "Cleaned up");
}

/**
 * Check if global error handler is initialized
 */
export function isGlobalErrorHandlerInitialized(): boolean {
  return isInitialized;
}
