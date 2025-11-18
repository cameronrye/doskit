/**
 * DosKit - Error Tracking Service
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * Abstraction layer for error tracking services (Sentry, LogRocket, etc.)
 */

import type { ErrorInfo } from "react";

/**
 * Error severity levels
 */
export const ErrorSeverity = {
  DEBUG: "debug",
  INFO: "info",
  WARNING: "warning",
  ERROR: "error",
  FATAL: "fatal",
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
  initialize(config: Record<string, unknown>): void;
  /** Check if the service is initialized */
  isInitialized(): boolean;
  /** Capture an error */
  captureError(
    error: Error,
    context?: ErrorContext,
    severity?: ErrorSeverity,
  ): void;
  /** Capture a message */
  captureMessage(
    message: string,
    context?: ErrorContext,
    severity?: ErrorSeverity,
  ): void;
  /** Capture a React error boundary error */
  captureReactError(
    error: Error,
    errorInfo: ErrorInfo,
    context?: ErrorContext,
  ): void;
  /** Set user context */
  setUser(user: { id?: string; email?: string; username?: string }): void;
  /** Add breadcrumb (user action trail) */
  addBreadcrumb(
    message: string,
    category?: string,
    data?: Record<string, unknown>,
  ): void;
}

/**
 * Console-based error tracking (development/fallback)
 */
class ConsoleErrorTracker implements ErrorTrackingService {
  private initialized = false;

  initialize(): void {
    this.initialized = true;
    console.log("[ErrorTracking] Console tracker initialized");
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  captureError(
    error: Error,
    context?: ErrorContext,
    severity = ErrorSeverity.ERROR,
  ): void {
    console.error("[ErrorTracking]", severity, error, context);
  }

  captureMessage(
    message: string,
    context?: ErrorContext,
    severity = ErrorSeverity.INFO,
  ): void {
    console.log("[ErrorTracking]", severity, message, context);
  }

  captureReactError(
    error: Error,
    errorInfo: ErrorInfo,
    context?: ErrorContext,
  ): void {
    console.error("[ErrorTracking] React Error:", error, errorInfo, context);
  }

  setUser(user: { id?: string; email?: string; username?: string }): void {
    console.log("[ErrorTracking] User set:", user);
  }

  addBreadcrumb(
    message: string,
    category?: string,
    data?: Record<string, unknown>,
  ): void {
    console.log("[ErrorTracking] Breadcrumb:", category, message, data);
  }
}

/**
 * Sentry error tracking service (placeholder for future implementation)
 */
class SentryErrorTracker implements ErrorTrackingService {
  private initialized = false;

  initialize(config: Record<string, unknown>): void {
    // TODO: Initialize Sentry SDK
    // import * as Sentry from '@sentry/react';
    // Sentry.init({ dsn: config.dsn, ... });
    this.initialized = true;
    console.log(
      "[ErrorTracking] Sentry tracker initialized (placeholder)",
      config,
    );
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  captureError(
    error: Error,
    context?: ErrorContext,
    severity = ErrorSeverity.ERROR,
  ): void {
    // TODO: Sentry.captureException(error, { level: severity, contexts: context });
    console.error("[ErrorTracking] Sentry:", severity, error, context);
  }

  captureMessage(
    message: string,
    context?: ErrorContext,
    severity = ErrorSeverity.INFO,
  ): void {
    // TODO: Sentry.captureMessage(message, { level: severity, contexts: context });
    console.log("[ErrorTracking] Sentry:", severity, message, context);
  }

  captureReactError(
    error: Error,
    errorInfo: ErrorInfo,
    context?: ErrorContext,
  ): void {
    // TODO: Sentry.captureException(error, { contexts: { react: errorInfo, ...context } });
    console.error(
      "[ErrorTracking] Sentry React Error:",
      error,
      errorInfo,
      context,
    );
  }

  setUser(user: { id?: string; email?: string; username?: string }): void {
    // TODO: Sentry.setUser(user);
    console.log("[ErrorTracking] Sentry user set:", user);
  }

  addBreadcrumb(
    message: string,
    category = "default",
    data?: Record<string, unknown>,
  ): void {
    // TODO: Sentry.addBreadcrumb({ message, category, data });
    console.log("[ErrorTracking] Sentry breadcrumb:", category, message, data);
  }
}

// Singleton instance
let errorTracker: ErrorTrackingService | null = null;

/**
 * Initialize error tracking
 * @param service - Service type ('console' or 'sentry')
 * @param config - Service configuration
 */
export function initializeErrorTracking(
  service: "console" | "sentry" = "console",
  config?: Record<string, unknown>,
): void {
  if (errorTracker?.isInitialized()) {
    console.warn("[ErrorTracking] Already initialized");
    return;
  }

  errorTracker =
    service === "sentry" ? new SentryErrorTracker() : new ConsoleErrorTracker();
  errorTracker.initialize(config || {});
}

/**
 * Get the error tracking service instance
 * @returns Error tracking service
 */
export function getErrorTracker(): ErrorTrackingService {
  if (!errorTracker) {
    // Auto-initialize with console tracker if not initialized
    initializeErrorTracking("console");
  }
  return errorTracker!;
}
