/**
 * Tests for globalErrorHandler utility
 */

import { describe, it, expect, beforeEach, afterEach, onTestFinished, vi } from 'vitest';
import {
  initializeGlobalErrorHandler,
  cleanupGlobalErrorHandler,
  isGlobalErrorHandlerInitialized,
} from './globalErrorHandler';

/**
 * Capture console.error, where the handler reports an error: the console error tracker
 * logs each report there
 */
const captureConsoleError = () => vi.spyOn(console, 'error').mockImplementation(() => {});

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

      expect(consoleSpy).toHaveBeenCalledExactlyOnceWith(
        expect.stringMatching(/\[WARN\] \[GlobalErrorHandler\] Already initialized$/)
      );
      consoleSpy.mockRestore();
    });

    it('should accept configuration options', () => {
      vi.stubEnv('DEV', false);
      const onError = vi.fn();

      initializeGlobalErrorHandler({
        showUserFriendlyErrors: false,
        suppressHarmlessErrors: false,
        onError,
      });
      const consoleError = captureConsoleError();
      const error = new Error('ResizeObserver loop completed with undelivered notifications.');
      window.dispatchEvent(new ErrorEvent('error', { error, message: error.message }));

      expect(isGlobalErrorHandlerInitialized()).toBe(true);
      // A harmless error is reported too, and even a production build leaves out what a
      // user would be told
      expect(onError).toHaveBeenCalledExactlyOnceWith(
        error,
        expect.objectContaining({
          metadata: expect.not.objectContaining({ friendlyError: expect.anything() }),
        })
      );
      expect(consoleError).toHaveBeenCalledOnce();
    });

    it('applies its options over the defaults, not over an earlier setup', () => {
      initializeGlobalErrorHandler({ suppressHarmlessErrors: false });
      cleanupGlobalErrorHandler();

      const onError = vi.fn();
      initializeGlobalErrorHandler({ onError });
      window.dispatchEvent(
        new ErrorEvent('error', {
          error: new Error('ResizeObserver loop completed with undelivered notifications.'),
          message: 'ResizeObserver loop completed with undelivered notifications.',
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

    it('stops handling uncaught errors and unhandled rejections', () => {
      const onError = vi.fn();
      initializeGlobalErrorHandler({ onError });
      cleanupGlobalErrorHandler();
      const consoleError = captureConsoleError();

      // Without an error object, which Vitest would report as an uncaught exception of its
      // own once no listener is left. The handler would still track the message.
      window.dispatchEvent(new ErrorEvent('error', { message: 'Script error.' }));
      rejectUnhandled(new Error('Promise rejection'));

      expect(onError).not.toHaveBeenCalled();
      expect(consoleError).not.toHaveBeenCalled();
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
      const consoleError = captureConsoleError();

      const error = new Error('Test error');
      const errorEvent = new ErrorEvent('error', {
        error,
        message: 'Test error',
      });

      window.dispatchEvent(errorEvent);

      expect(onError).toHaveBeenCalledWith(error, expect.any(Object));
      // Logged once, by the console tracker
      expect(consoleError).toHaveBeenCalledExactlyOnceWith(
        '[ErrorTracking]',
        'error',
        error,
        expect.objectContaining({ userAction: 'Unknown' })
      );
    });

    it('should handle unhandled promise rejections', () => {
      const onError = vi.fn();
      initializeGlobalErrorHandler({ onError });
      const consoleError = captureConsoleError();

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
      expect(consoleError).toHaveBeenCalledExactlyOnceWith(
        '[ErrorTracking]',
        'error',
        error,
        expect.objectContaining({ userAction: 'Promise rejection' })
      );
      // The browser still reports it
      expect(rejectionEvent.defaultPrevented).toBe(false);
    });

    // js-dos runs with softFullscreen and no fullScreen option, so neither it nor DosKit
    // calls the Fullscreen API: a rejection from it would be a real failure
    it.each([
      "Failed to execute 'exitFullscreen' on 'Document': Document not active",
      "Failed to execute 'requestFullscreen' on 'Element': API can only be initiated by a user gesture.",
      'Not in fullscreen',
    ])('reports the fullscreen rejection "%s"', (message) => {
      const onError = vi.fn();
      initializeGlobalErrorHandler({ onError });
      captureConsoleError();

      const reason = new TypeError(message);
      const rejectedPromise = Promise.reject(reason);
      rejectedPromise.catch(() => {});
      const rejectionEvent = new PromiseRejectionEvent('unhandledrejection', {
        promise: rejectedPromise,
        reason,
        cancelable: true,
      });

      window.dispatchEvent(rejectionEvent);

      expect(rejectionEvent.defaultPrevented).toBe(false);
      expect(onError).toHaveBeenCalledOnce();
    });

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
      const consoleError = captureConsoleError();

      const event = rejectUnhandled(new DOMException('The operation was aborted.', 'AbortError'));

      expect(event.defaultPrevented).toBe(false);
      expect(onError).toHaveBeenCalledTimes(1);
      expect(consoleError).toHaveBeenCalledExactlyOnceWith(
        '[ErrorTracking]',
        'error',
        expect.objectContaining({ message: 'The operation was aborted.' }),
        expect.objectContaining({ userAction: 'Promise rejection' })
      );
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
        const consoleError = captureConsoleError();

        rejectUnhandled(Object.create(null));

        expect(exceptions).toEqual([]);
        expect(onError).toHaveBeenCalledExactlyOnceWith(
          expect.any(Error),
          expect.objectContaining({ userAction: 'Promise rejection' })
        );
        expect(consoleError).toHaveBeenCalledExactlyOnceWith(
          '[ErrorTracking]',
          'error',
          expect.objectContaining({ message: 'Promise rejected with a value that has no text' }),
          expect.objectContaining({ userAction: 'Promise rejection' })
        );
      });

      it('explains that rejection in its report in production', () => {
        vi.stubEnv('DEV', false);
        const exceptions = collectListenerExceptions();
        const consoleError = captureConsoleError();
        initializeGlobalErrorHandler();

        rejectUnhandled(Object.create(null));

        expect(exceptions).toEqual([]);
        expect(consoleError).toHaveBeenCalledExactlyOnceWith(
          '[ErrorTracking]',
          'error',
          expect.any(Error),
          expect.objectContaining({
            metadata: expect.objectContaining({
              friendlyError: expect.objectContaining({ message: 'An unexpected error occurred' }),
            }),
          })
        );
      });

      it('tracks it thrown, under the message the browser gives it', () => {
        const onError = vi.fn();
        initializeGlobalErrorHandler({ onError });
        const consoleError = captureConsoleError();

        // What Chromium dispatches for `throw Object.create(null)`
        window.dispatchEvent(
          new ErrorEvent('error', { error: Object.create(null), message: 'Uncaught exception' })
        );

        expect(onError).toHaveBeenCalledExactlyOnceWith(
          expect.objectContaining({ message: 'Uncaught exception' }),
          expect.objectContaining({ userAction: 'Unknown' })
        );
        expect(consoleError).toHaveBeenCalledExactlyOnceWith(
          '[ErrorTracking]',
          'error',
          expect.objectContaining({ message: 'Uncaught exception' }),
          expect.objectContaining({ userAction: 'Unknown' })
        );
      });
    });

    // Nothing shows the user-friendly message on the page yet: production builds put it in
    // the error's report, which stays the one line the handler logs
    describe('in a production build', () => {
      const CONNECTION = {
        message: 'Unable to connect to the server',
        suggestion: 'Please check your internet connection and try again.',
      };
      const explained = expect.objectContaining({
        metadata: expect.objectContaining({ friendlyError: CONNECTION }),
      });

      beforeEach(() => {
        vi.stubEnv('DEV', false);
      });

      it('logs an uncaught error once, with what a user would be told', () => {
        initializeGlobalErrorHandler();
        const consoleError = captureConsoleError();
        const consoleInfo = vi.spyOn(console, 'info').mockImplementation(() => {});

        const error = new TypeError('Failed to fetch');
        window.dispatchEvent(new ErrorEvent('error', { error, message: `Uncaught ${error}` }));

        expect(consoleError).toHaveBeenCalledExactlyOnceWith(
          '[ErrorTracking]',
          'error',
          error,
          explained
        );
        expect(consoleInfo).not.toHaveBeenCalled();
      });

      it('logs an unhandled rejection once, with what a user would be told', () => {
        initializeGlobalErrorHandler();
        const consoleError = captureConsoleError();
        const consoleInfo = vi.spyOn(console, 'info').mockImplementation(() => {});

        const reason = new TypeError('Failed to fetch');
        rejectUnhandled(reason);

        expect(consoleError).toHaveBeenCalledExactlyOnceWith(
          '[ErrorTracking]',
          'error',
          reason,
          explained
        );
        expect(consoleInfo).not.toHaveBeenCalled();
      });
    });

    it('leaves what a user would be told out of reports in development', () => {
      const onError = vi.fn();
      initializeGlobalErrorHandler({ onError });
      captureConsoleError();

      const error = new TypeError('Failed to fetch');
      window.dispatchEvent(new ErrorEvent('error', { error, message: `Uncaught ${error}` }));

      expect(onError).toHaveBeenCalledExactlyOnceWith(
        error,
        expect.objectContaining({
          metadata: expect.not.objectContaining({ friendlyError: expect.anything() }),
        })
      );
    });

    it('tracks a promise rejected without a reason', () => {
      const onError = vi.fn();
      // Production config (main.tsx)
      initializeGlobalErrorHandler({ onError, suppressHarmlessErrors: true });
      const consoleError = captureConsoleError();

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
      expect(consoleError).toHaveBeenCalledExactlyOnceWith(
        '[ErrorTracking]',
        'error',
        expect.any(Error),
        expect.objectContaining({ userAction: 'Promise rejection' })
      );
    });

    it("prevents the browser's default report for suppressed uncaught errors", () => {
      initializeGlobalErrorHandler({ suppressHarmlessErrors: true });

      const errorEvent = new ErrorEvent('error', {
        error: new Error('ResizeObserver loop completed with undelivered notifications.'),
        message: 'ResizeObserver loop completed with undelivered notifications.',
        cancelable: true,
      });
      window.dispatchEvent(errorEvent);

      expect(errorEvent.defaultPrevented).toBe(true);
    });

    it('records where an uncaught error was thrown', () => {
      const onError = vi.fn();
      initializeGlobalErrorHandler({ onError });
      const consoleError = captureConsoleError();

      window.dispatchEvent(
        new ErrorEvent('error', {
          error: new Error('boom'),
          message: 'boom',
          filename: 'https://doskit.net/assets/index.js',
          lineno: 10,
          colno: 5,
        })
      );

      const location = expect.objectContaining({
        metadata: expect.objectContaining({
          source: 'https://doskit.net/assets/index.js',
          lineno: 10,
          colno: 5,
        }),
      });
      expect(onError).toHaveBeenCalledWith(expect.any(Error), location);
      expect(consoleError).toHaveBeenCalledExactlyOnceWith(
        '[ErrorTracking]',
        'error',
        expect.objectContaining({ message: 'boom' }),
        location
      );
    });

    // A script from another origin gives no details: the browser reports "Script error."
    // with no error object
    it('tracks a cross-origin "Script error." under its message, without calling onError', () => {
      const onError = vi.fn();
      initializeGlobalErrorHandler({ onError });
      const consoleError = captureConsoleError();

      const errorEvent = new ErrorEvent('error', {
        message: 'Script error.',
        error: null,
        cancelable: true,
      });
      window.dispatchEvent(errorEvent);

      // onError takes an Error, which the event does not have
      expect(onError).not.toHaveBeenCalled();
      expect(consoleError).toHaveBeenCalledExactlyOnceWith(
        '[ErrorTracking]',
        'error',
        expect.objectContaining({ message: 'Script error.' }),
        expect.objectContaining({ userAction: 'Unknown' })
      );
      // The browser still reports it
      expect(errorEvent.defaultPrevented).toBe(false);
    });

    it('should suppress harmless errors', () => {
      const onError = vi.fn();
      initializeGlobalErrorHandler({
        onError,
        suppressHarmlessErrors: true,
      });
      const consoleError = captureConsoleError();

      const error = new Error('ResizeObserver loop completed with undelivered notifications.');
      const errorEvent = new ErrorEvent('error', {
        error,
        message: error.message,
      });

      window.dispatchEvent(errorEvent);

      // Should not call onError for harmless errors, nor log or track them
      expect(onError).not.toHaveBeenCalled();
      expect(consoleError).not.toHaveBeenCalled();
    });

    it('should not suppress harmless errors when disabled', () => {
      const onError = vi.fn();
      initializeGlobalErrorHandler({
        onError,
        suppressHarmlessErrors: false,
      });
      const consoleError = captureConsoleError();

      const error = new Error('ResizeObserver loop completed with undelivered notifications.');
      const errorEvent = new ErrorEvent('error', {
        error,
        message: error.message,
      });

      window.dispatchEvent(errorEvent);

      expect(onError).toHaveBeenCalled();
      expect(consoleError).toHaveBeenCalledExactlyOnceWith(
        '[ErrorTracking]',
        'error',
        error,
        expect.objectContaining({ userAction: 'Unknown' })
      );
    });

    it('should apply custom error filter', () => {
      const onError = vi.fn();
      const errorFilter = vi.fn().mockReturnValue(false); // Filter out all errors

      initializeGlobalErrorHandler({
        onError,
        errorFilter,
      });
      const consoleError = captureConsoleError();

      const error = new Error('Test error');
      const errorEvent = new ErrorEvent('error', {
        error,
        message: 'Test error',
        cancelable: true,
      });

      window.dispatchEvent(errorEvent);

      expect(errorFilter).toHaveBeenCalledExactlyOnceWith(error);
      expect(onError).not.toHaveBeenCalled();
      // Neither logged nor tracked, and the browser does not report it either
      expect(consoleError).not.toHaveBeenCalled();
      expect(errorEvent.defaultPrevented).toBe(true);
    });

    it('applies the custom error filter to rejections', () => {
      const onError = vi.fn();
      const dropped = new Error('Dropped');
      const kept = new Error('Kept');
      const errorFilter = vi.fn((error: Error | string) => error !== dropped);
      initializeGlobalErrorHandler({ onError, errorFilter });
      const consoleError = captureConsoleError();

      const droppedEvent = rejectUnhandled(dropped);
      const keptEvent = rejectUnhandled(kept);

      expect(errorFilter).toHaveBeenCalledWith(dropped);
      expect(errorFilter).toHaveBeenCalledWith(kept);
      // The dropped rejection is neither logged nor tracked, nor reported by the browser
      expect(droppedEvent.defaultPrevented).toBe(true);
      expect(keptEvent.defaultPrevented).toBe(false);
      expect(onError).toHaveBeenCalledExactlyOnceWith(kept, expect.any(Object));
      expect(consoleError).toHaveBeenCalledExactlyOnceWith(
        '[ErrorTracking]',
        'error',
        kept,
        expect.objectContaining({ userAction: 'Promise rejection' })
      );
    });
  });
});
