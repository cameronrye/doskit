/**
 * Tests for globalErrorHandler utility
 */

import { describe, it, expect, beforeEach, afterEach, vi, type MockInstance } from 'vitest';
import {
  initializeGlobalErrorHandler,
  cleanupGlobalErrorHandler,
  isGlobalErrorHandlerInitialized,
} from './globalErrorHandler';

describe('globalErrorHandler', () => {
  beforeEach(() => {
    cleanupGlobalErrorHandler();
  });

  afterEach(() => {
    cleanupGlobalErrorHandler();
  });

  describe('initializeGlobalErrorHandler', () => {
    it('should initialize successfully', () => {
      initializeGlobalErrorHandler();
      expect(isGlobalErrorHandlerInitialized()).toBe(true);
    });

    it('should warn if already initialized', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      initializeGlobalErrorHandler();
      initializeGlobalErrorHandler(); // Second call

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should accept configuration options', () => {
      const onError = vi.fn();

      initializeGlobalErrorHandler({
        showUserFriendlyErrors: false,
        suppressHarmlessErrors: false,
        onError,
      });

      expect(isGlobalErrorHandlerInitialized()).toBe(true);
    });

    it('applies its options over the defaults, not over an earlier setup', () => {
      initializeGlobalErrorHandler({ suppressHarmlessErrors: false });
      cleanupGlobalErrorHandler();

      const onError = vi.fn();
      initializeGlobalErrorHandler({ onError });
      window.dispatchEvent(
        new ErrorEvent('error', {
          error: new Error('exitFullscreen is not available'),
          message: 'exitFullscreen is not available',
        })
      );

      // Suppressing harmless errors is the default
      expect(onError).not.toHaveBeenCalled();
    });
  });

  describe('cleanupGlobalErrorHandler', () => {
    it('should cleanup successfully', () => {
      initializeGlobalErrorHandler();
      expect(isGlobalErrorHandlerInitialized()).toBe(true);

      cleanupGlobalErrorHandler();
      expect(isGlobalErrorHandlerInitialized()).toBe(false);
    });

    it('should handle cleanup when not initialized', () => {
      expect(() => cleanupGlobalErrorHandler()).not.toThrow();
    });
  });

  describe('console.error filter', () => {
    const EXIT_FULLSCREEN = "Failed to execute 'exitFullscreen' on 'Document': Document not active";

    // Spied before each setup, so the filter forwards to the spy
    let consoleError: MockInstance<typeof console.error>;

    beforeEach(() => {
      consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      cleanupGlobalErrorHandler();
      consoleError.mockRestore();
    });

    it('drops harmless fullscreen and keyboard lock messages', () => {
      initializeGlobalErrorHandler();

      console.error(EXIT_FULLSCREEN);
      console.error(new TypeError(EXIT_FULLSCREEN));
      console.error(new DOMException('lock() request could not be registered.', 'AbortError'));

      expect(consoleError).not.toHaveBeenCalled();
    });

    it('passes every other message through with all its arguments', () => {
      initializeGlobalErrorHandler();
      const error = new Error('Emulator crashed');

      console.error('[useDosEmulator] Failed to initialize emulator:', error);

      expect(consoleError).toHaveBeenCalledTimes(1);
      expect(consoleError).toHaveBeenCalledWith(
        '[useDosEmulator] Failed to initialize emulator:',
        error
      );
    });

    it('hands console.error back on cleanup', () => {
      initializeGlobalErrorHandler();
      cleanupGlobalErrorHandler();

      console.error(EXIT_FULLSCREEN);

      expect(consoleError).toHaveBeenCalledWith(EXIT_FULLSCREEN);
    });

    it('never throws, even for a value that has no string form', () => {
      initializeGlobalErrorHandler();
      const bare = Object.create(null);

      console.error(bare);

      expect(consoleError).toHaveBeenCalledWith(bare);
    });

    it('leaves console.error alone when harmless errors are not suppressed', () => {
      initializeGlobalErrorHandler({ suppressHarmlessErrors: false });

      console.error(EXIT_FULLSCREEN);

      expect(consoleError).toHaveBeenCalledWith(EXIT_FULLSCREEN);
    });
  });

  describe('error handling', () => {
    it('should handle uncaught errors', () => {
      const onError = vi.fn();
      initializeGlobalErrorHandler({ onError });

      const error = new Error('Test error');
      const errorEvent = new ErrorEvent('error', {
        error,
        message: 'Test error',
      });

      window.dispatchEvent(errorEvent);

      expect(onError).toHaveBeenCalledWith(error, expect.any(Object));
    });

    it('should handle unhandled promise rejections', () => {
      const onError = vi.fn();
      initializeGlobalErrorHandler({ onError });

      const error = new Error('Promise rejection');
      // Create a promise that we can control to avoid unhandled rejection
      const rejectedPromise = Promise.reject(error);
      // Catch the rejection to prevent it from being unhandled
      rejectedPromise.catch(() => {});

      const rejectionEvent = new PromiseRejectionEvent('unhandledrejection', {
        promise: rejectedPromise,
        reason: error,
        cancelable: true,
      });

      window.dispatchEvent(rejectionEvent);

      expect(onError).toHaveBeenCalledWith(error, expect.any(Object));
      // The browser still reports it
      expect(rejectionEvent.defaultPrevented).toBe(false);
    });

    // Fullscreen calls need a user gesture. js-dos calls document.exitFullscreen()
    // on every start without awaiting it, so that rejection is never handled.
    it.each([
      "Failed to execute 'exitFullscreen' on 'Document': Document not active",
      "Failed to execute 'requestFullscreen' on 'Element': API can only be initiated by a user gesture.",
    ])('suppresses the fullscreen rejection "%s"', (message) => {
      const onError = vi.fn();
      initializeGlobalErrorHandler({ onError });

      const reason = new TypeError(message);
      const rejectedPromise = Promise.reject(reason);
      rejectedPromise.catch(() => {});
      const rejectionEvent = new PromiseRejectionEvent('unhandledrejection', {
        promise: rejectedPromise,
        reason,
        cancelable: true,
      });

      window.dispatchEvent(rejectionEvent);

      expect(rejectionEvent.defaultPrevented).toBe(true);
      expect(onError).not.toHaveBeenCalled();
    });

    it('tracks a promise rejected without a reason', () => {
      const onError = vi.fn();
      // Production config (main.tsx)
      initializeGlobalErrorHandler({ onError, suppressHarmlessErrors: true });

      const rejectedPromise = Promise.reject();
      rejectedPromise.catch(() => {});
      window.dispatchEvent(
        new PromiseRejectionEvent('unhandledrejection', {
          promise: rejectedPromise,
          reason: undefined,
        })
      );

      expect(onError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({ userAction: 'Promise rejection' })
      );
    });

    it("prevents the browser's default report for suppressed uncaught errors", () => {
      initializeGlobalErrorHandler({ suppressHarmlessErrors: true });

      const errorEvent = new ErrorEvent('error', {
        error: new Error('exitFullscreen is not available'),
        message: 'exitFullscreen is not available',
        cancelable: true,
      });
      window.dispatchEvent(errorEvent);

      expect(errorEvent.defaultPrevented).toBe(true);
    });

    it('records where an uncaught error was thrown', () => {
      const onError = vi.fn();
      initializeGlobalErrorHandler({ onError });

      window.dispatchEvent(
        new ErrorEvent('error', {
          error: new Error('boom'),
          message: 'boom',
          filename: 'https://doskit.net/assets/index.js',
          lineno: 10,
          colno: 5,
        })
      );

      expect(onError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          metadata: expect.objectContaining({
            source: 'https://doskit.net/assets/index.js',
            lineno: 10,
            colno: 5,
          }),
        })
      );
    });

    it('should suppress harmless errors', () => {
      const onError = vi.fn();
      initializeGlobalErrorHandler({
        onError,
        suppressHarmlessErrors: true,
      });

      const error = new Error('exitFullscreen is not available');
      const errorEvent = new ErrorEvent('error', {
        error,
        message: error.message,
      });

      window.dispatchEvent(errorEvent);

      // Should not call onError for harmless errors
      expect(onError).not.toHaveBeenCalled();
    });

    it('should not suppress harmless errors when disabled', () => {
      const onError = vi.fn();
      initializeGlobalErrorHandler({
        onError,
        suppressHarmlessErrors: false,
      });

      const error = new Error('exitFullscreen is not available');
      const errorEvent = new ErrorEvent('error', {
        error,
        message: error.message,
      });

      window.dispatchEvent(errorEvent);

      expect(onError).toHaveBeenCalled();
    });

    it('should apply custom error filter', () => {
      const onError = vi.fn();
      const errorFilter = vi.fn().mockReturnValue(false); // Filter out all errors

      initializeGlobalErrorHandler({
        onError,
        errorFilter,
      });

      const error = new Error('Test error');
      const errorEvent = new ErrorEvent('error', {
        error,
        message: 'Test error',
      });

      window.dispatchEvent(errorEvent);

      expect(errorFilter).toHaveBeenCalled();
      expect(onError).not.toHaveBeenCalled();
    });
  });
});
