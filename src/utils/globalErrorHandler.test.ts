/**
 * Tests for globalErrorHandler utility
 */

import { describe, it, expect, beforeEach, afterEach, onTestFinished, vi } from 'vitest';
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
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
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

  // js-dos reports its harmless failures as unhandled rejections, which the listener
  // suppresses. A console.error wrapper would only make DevTools attribute every logged
  // error to the wrapper.
  it('leaves console.error alone', () => {
    const consoleError = console.error;

    initializeGlobalErrorHandler({ suppressHarmlessErrors: true });

    expect(console.error).toBe(consoleError);
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

    /** Dispatch an unhandled rejection the way the browser does */
    const rejectUnhandled = (reason: unknown) => {
      const promise = Promise.reject(reason);
      promise.catch(() => {});
      const event = new PromiseRejectionEvent('unhandledrejection', {
        promise,
        reason,
        cancelable: true,
      });
      window.dispatchEvent(event);
      return event;
    };

    // js-dos locks the keyboard each time a player starts, without handling the promise.
    // When two players start milliseconds apart (an app left the moment its player
    // starts), Chromium rejects the older lock; the newer one holds the keyboard.
    it('suppresses the rejection of a keyboard lock that a newer lock superseded', () => {
      const onError = vi.fn();
      initializeGlobalErrorHandler({ onError });

      const event = rejectUnhandled(
        new DOMException(
          'This request has been superseded by a subsequent lock() method call.',
          'AbortError'
        )
      );

      expect(event.defaultPrevented).toBe(true);
      expect(onError).not.toHaveBeenCalled();
    });

    it('still reports an abort that no keyboard lock caused', () => {
      const onError = vi.fn();
      initializeGlobalErrorHandler({ onError });

      const event = rejectUnhandled(new DOMException('The operation was aborted.', 'AbortError'));

      expect(event.defaultPrevented).toBe(false);
      expect(onError).toHaveBeenCalledTimes(1);
    });

    // String() throws for an object without a prototype, so the handler must not need one
    describe('for a value with no string form', () => {
      /**
       * Collect what listeners throw: the browser, here jsdom, reports each as an error
       * event of its own, which the handler would then track in place of the value
       */
      const collectListenerExceptions = () => {
        const exceptions: unknown[] = [];
        const collect = (event: ErrorEvent) => exceptions.push(event.error);
        window.addEventListener('error', collect);
        onTestFinished(() => window.removeEventListener('error', collect));
        return exceptions;
      };

      it('tracks a rejection with it as the reason', () => {
        const exceptions = collectListenerExceptions();
        const onError = vi.fn();
        initializeGlobalErrorHandler({ onError });

        rejectUnhandled(Object.create(null));

        expect(exceptions).toEqual([]);
        expect(onError).toHaveBeenCalledExactlyOnceWith(
          expect.any(Error),
          expect.objectContaining({ userAction: 'Promise rejection' })
        );
      });

      it('logs the friendly message for that rejection in production', () => {
        vi.stubEnv('DEV', false);
        const exceptions = collectListenerExceptions();
        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
        initializeGlobalErrorHandler();

        rejectUnhandled(Object.create(null));

        expect(exceptions).toEqual([]);
        expect(consoleError).toHaveBeenCalledWith('Error:', 'An unexpected error occurred');
      });

      it('tracks it thrown, under the message the browser gives it', () => {
        const onError = vi.fn();
        initializeGlobalErrorHandler({ onError });

        // What Chromium dispatches for `throw Object.create(null)`
        window.dispatchEvent(
          new ErrorEvent('error', { error: Object.create(null), message: 'Uncaught exception' })
        );

        expect(onError).toHaveBeenCalledExactlyOnceWith(
          expect.objectContaining({ message: 'Uncaught exception' }),
          expect.objectContaining({ userAction: 'Unknown' })
        );
      });
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
