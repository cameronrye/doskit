/**
 * Tests for globalErrorHandler utility
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  initializeGlobalErrorHandler,
  cleanupGlobalErrorHandler,
  isGlobalErrorHandlerInitialized,
} from "./globalErrorHandler";

describe("globalErrorHandler", () => {
  beforeEach(() => {
    cleanupGlobalErrorHandler();
  });

  afterEach(() => {
    cleanupGlobalErrorHandler();
  });

  describe("initializeGlobalErrorHandler", () => {
    it("should initialize successfully", () => {
      initializeGlobalErrorHandler();
      expect(isGlobalErrorHandlerInitialized()).toBe(true);
    });

    it("should warn if already initialized", () => {
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      initializeGlobalErrorHandler();
      initializeGlobalErrorHandler(); // Second call

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it("should accept configuration options", () => {
      const onError = vi.fn();

      initializeGlobalErrorHandler({
        showUserFriendlyErrors: false,
        suppressHarmlessErrors: false,
        onError,
      });

      expect(isGlobalErrorHandlerInitialized()).toBe(true);
    });
  });

  describe("cleanupGlobalErrorHandler", () => {
    it("should cleanup successfully", () => {
      initializeGlobalErrorHandler();
      expect(isGlobalErrorHandlerInitialized()).toBe(true);

      cleanupGlobalErrorHandler();
      expect(isGlobalErrorHandlerInitialized()).toBe(false);
    });

    it("should handle cleanup when not initialized", () => {
      expect(() => cleanupGlobalErrorHandler()).not.toThrow();
    });
  });

  describe("error handling", () => {
    it("should handle uncaught errors", () => {
      const onError = vi.fn();
      initializeGlobalErrorHandler({ onError });

      const error = new Error("Test error");
      const errorEvent = new ErrorEvent("error", {
        error,
        message: "Test error",
      });

      window.dispatchEvent(errorEvent);

      expect(onError).toHaveBeenCalledWith(error, expect.any(Object));
    });

    it("should handle unhandled promise rejections", () => {
      const onError = vi.fn();
      initializeGlobalErrorHandler({ onError });

      const error = new Error("Promise rejection");
      // Create a promise that we can control to avoid unhandled rejection
      const rejectedPromise = Promise.reject(error);
      // Catch the rejection to prevent it from being unhandled
      rejectedPromise.catch(() => {});

      const rejectionEvent = new PromiseRejectionEvent("unhandledrejection", {
        promise: rejectedPromise,
        reason: error,
      });

      window.dispatchEvent(rejectionEvent);

      expect(onError).toHaveBeenCalledWith(error, expect.any(Object));
    });

    it("should suppress harmless errors", () => {
      const onError = vi.fn();
      initializeGlobalErrorHandler({
        onError,
        suppressHarmlessErrors: true,
      });

      const error = new Error("exitFullscreen is not available");
      const errorEvent = new ErrorEvent("error", {
        error,
        message: error.message,
      });

      window.dispatchEvent(errorEvent);

      // Should not call onError for harmless errors
      expect(onError).not.toHaveBeenCalled();
    });

    it("should not suppress harmless errors when disabled", () => {
      const onError = vi.fn();
      initializeGlobalErrorHandler({
        onError,
        suppressHarmlessErrors: false,
      });

      const error = new Error("exitFullscreen is not available");
      const errorEvent = new ErrorEvent("error", {
        error,
        message: error.message,
      });

      window.dispatchEvent(errorEvent);

      expect(onError).toHaveBeenCalled();
    });

    it("should apply custom error filter", () => {
      const onError = vi.fn();
      const errorFilter = vi.fn().mockReturnValue(false); // Filter out all errors

      initializeGlobalErrorHandler({
        onError,
        errorFilter,
      });

      const error = new Error("Test error");
      const errorEvent = new ErrorEvent("error", {
        error,
        message: "Test error",
      });

      window.dispatchEvent(errorEvent);

      expect(errorFilter).toHaveBeenCalled();
      expect(onError).not.toHaveBeenCalled();
    });
  });
});
