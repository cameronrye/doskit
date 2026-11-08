/**
 * DosKit - Error Tracking Service
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * Abstraction layer for error tracking services (Sentry, LogRocket, etc.)
 */

import type { ErrorInfo } from 'react';

/**
 * Error severity levels
 */
export const ErrorSeverity = {
  DEBUG: 'debug',
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  FATAL: 'fatal',
} as const;

export type ErrorSeverity = (typeof ErrorSeverity)[keyof typeof ErrorSeverity];

/**
 * Error context information
 */
export interface ErrorContext {
  /** User action that triggered the error */
  userAction?: string;
  /** Component where error occurred */
  component?: string;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
  /** Browser information */
  browser?: {
    userAgent: string;
    language: string;
    online: boolean;
  };
  /** Application state */
  appState?: Record<string, unknown>;
}

/**
 * Error tracking service interface
 */
export interface ErrorTrackingService {
  /** Initialize the error tracking service */
  initialize(): void;
  /** Check if the service is initialized */
  isInitialized(): boolean;
  /** Capture an error */
  captureError(error: Error, context?: ErrorContext, severity?: ErrorSeverity): void;
  /** Capture a React error boundary error */
  captureReactError(error: Error, errorInfo: ErrorInfo, context?: ErrorContext): void;
  /** Add breadcrumb (user action trail) */
  addBreadcrumb(message: string, category?: string, data?: Record<string, unknown>): void;
}

/**
 * Console-based error tracking (development/fallback)
 */
class ConsoleErrorTracker implements ErrorTrackingService {
  private initialized = false;

  initialize(): void {
    this.initialized = true;
    console.log('[ErrorTracking] Console tracker initialized');
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  captureError(error: Error, context?: ErrorContext, severity = ErrorSeverity.ERROR): void {
    console.error('[ErrorTracking]', severity, error, context);
  }

  captureReactError(error: Error, errorInfo: ErrorInfo, context?: ErrorContext): void {
    console.error('[ErrorTracking] React Error:', error, errorInfo, context);
  }

  addBreadcrumb(message: string, category?: string, data?: Record<string, unknown>): void {
    console.log('[ErrorTracking] Breadcrumb:', category, message, data);
  }
}

// Singleton instance
let errorTracker: ErrorTrackingService | null = null;

/**
 * Initialize error tracking with the console tracker
 */
export function initializeErrorTracking(): void {
  if (errorTracker?.isInitialized()) {
    console.warn('[ErrorTracking] Already initialized');
    return;
  }

  errorTracker = new ConsoleErrorTracker();
  errorTracker.initialize();
}

/**
 * Get the error tracking service instance
 * @returns Error tracking service
 */
export function getErrorTracker(): ErrorTrackingService {
  if (!errorTracker) {
    // Auto-initialize with console tracker if not initialized
    initializeErrorTracking();
  }
  return errorTracker!;
}
