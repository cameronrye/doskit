/**
 * Tests for errorTracking utility
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  initializeErrorTracking,
  getErrorTracker,
  ErrorSeverity,
  type ErrorContext,
} from "./errorTracking";

describe("errorTracking", () => {
  beforeEach(() => {
    // Reset singleton
    vi.resetModules();
  });

  describe("initializeErrorTracking", () => {
    it("should initialize console tracker by default", () => {
      initializeErrorTracking();
      const tracker = getErrorTracker();
      expect(tracker.isInitialized()).toBe(true);
    });

    it("should initialize console tracker explicitly", () => {
      initializeErrorTracking("console");
      const tracker = getErrorTracker();
      expect(tracker.isInitialized()).toBe(true);
    });

    it("should initialize sentry tracker", () => {
      initializeErrorTracking("sentry", { dsn: "test-dsn" });
      const tracker = getErrorTracker();
      expect(tracker.isInitialized()).toBe(true);
    });

    it("should warn if already initialized", () => {
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      initializeErrorTracking();
      initializeErrorTracking(); // Second call

      expect(consoleSpy).toHaveBeenCalledWith(
        "[ErrorTracking] Already initialized",
      );
      consoleSpy.mockRestore();
    });
  });

  describe("getErrorTracker", () => {
    it("should auto-initialize if not initialized", () => {
      const tracker = getErrorTracker();
      expect(tracker.isInitialized()).toBe(true);
    });

    it("should return same instance", () => {
      const tracker1 = getErrorTracker();
      const tracker2 = getErrorTracker();
      expect(tracker1).toBe(tracker2);
    });
  });

  describe("ConsoleErrorTracker", () => {
    beforeEach(() => {
      initializeErrorTracking("console");
    });

    it("should capture error", () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      const tracker = getErrorTracker();
      const error = new Error("Test error");
      const context: ErrorContext = { userAction: "test" };

      tracker.captureError(error, context, ErrorSeverity.ERROR);

      expect(consoleSpy).toHaveBeenCalledWith(
        "[ErrorTracking]",
        ErrorSeverity.ERROR,
        error,
        context,
      );
      consoleSpy.mockRestore();
    });

    it("should capture message", () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      const tracker = getErrorTracker();
      const message = "Test message";
      const context: ErrorContext = { userAction: "test" };

      tracker.captureMessage(message, context, ErrorSeverity.INFO);

      expect(consoleSpy).toHaveBeenCalledWith(
        "[ErrorTracking]",
        ErrorSeverity.INFO,
        message,
        context,
      );
      consoleSpy.mockRestore();
    });

    it("should capture React error", () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      const tracker = getErrorTracker();
      const error = new Error("React error");
      const errorInfo = { componentStack: "Component stack" };

      tracker.captureReactError(error, errorInfo as { componentStack: string });

      expect(consoleSpy).toHaveBeenCalledWith(
        "[ErrorTracking] React Error:",
        error,
        errorInfo,
        undefined,
      );
      consoleSpy.mockRestore();
    });

    it("should set user", () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      const tracker = getErrorTracker();
      const user = { id: "123", email: "test@example.com" };

      tracker.setUser(user);

      expect(consoleSpy).toHaveBeenCalledWith(
        "[ErrorTracking] User set:",
        user,
      );
      consoleSpy.mockRestore();
    });

    it("should add breadcrumb", () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      const tracker = getErrorTracker();

      tracker.addBreadcrumb("Test action", "navigation", { page: "home" });

      expect(consoleSpy).toHaveBeenCalledWith(
        "[ErrorTracking] Breadcrumb:",
        "navigation",
        "Test action",
        { page: "home" },
      );
      consoleSpy.mockRestore();
    });
  });

  describe("ErrorSeverity", () => {
    it("should have correct values", () => {
      expect(ErrorSeverity.DEBUG).toBe("debug");
      expect(ErrorSeverity.INFO).toBe("info");
      expect(ErrorSeverity.WARNING).toBe("warning");
      expect(ErrorSeverity.ERROR).toBe("error");
      expect(ErrorSeverity.FATAL).toBe("fatal");
    });
  });
});
