/**
 * Tests for errorTracking utility
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  initializeErrorTracking,
  getErrorTracker,
  ErrorSeverity,
  type ErrorContext,
} from './errorTracking';

/**
 * The tracker is a module-level singleton, so tests of its lifecycle load a
 * fresh copy of the module to start from an uninitialized tracker
 */
async function loadFreshErrorTracking() {
  vi.resetModules();
  return import('./errorTracking');
}

describe('errorTracking', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initializeErrorTracking', () => {
    it('should initialize the console tracker', async () => {
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const fresh = await loadFreshErrorTracking();

      fresh.initializeErrorTracking();

      expect(fresh.getErrorTracker().isInitialized()).toBe(true);
      expect(logSpy).toHaveBeenCalledWith('[ErrorTracking] Console tracker initialized');
    });

    it('should warn only when initialized a second time', async () => {
      vi.spyOn(console, 'log').mockImplementation(() => {});
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const fresh = await loadFreshErrorTracking();

      fresh.initializeErrorTracking();
      expect(warnSpy).not.toHaveBeenCalled();

      fresh.initializeErrorTracking(); // Second call
      expect(warnSpy).toHaveBeenCalledWith('[ErrorTracking] Already initialized');
    });
  });

  describe('getErrorTracker', () => {
    it('should auto-initialize if not initialized', async () => {
      vi.spyOn(console, 'log').mockImplementation(() => {});
      const fresh = await loadFreshErrorTracking();

      const tracker = fresh.getErrorTracker();

      expect(tracker.isInitialized()).toBe(true);
    });

    it('should return same instance', async () => {
      vi.spyOn(console, 'log').mockImplementation(() => {});
      const fresh = await loadFreshErrorTracking();

      expect(fresh.getErrorTracker()).toBe(fresh.getErrorTracker());
    });
  });

  describe('ConsoleErrorTracker', () => {
    beforeEach(() => {
      initializeErrorTracking();
    });

    it('should capture error', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const tracker = getErrorTracker();
      const error = new Error('Test error');
      const context: ErrorContext = { userAction: 'test' };

      tracker.captureError(error, context, ErrorSeverity.ERROR);

      expect(consoleSpy).toHaveBeenCalledWith(
        '[ErrorTracking]',
        ErrorSeverity.ERROR,
        error,
        context
      );
      consoleSpy.mockRestore();
    });

    it('should capture message', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const tracker = getErrorTracker();
      const message = 'Test message';
      const context: ErrorContext = { userAction: 'test' };

      tracker.captureMessage(message, context, ErrorSeverity.INFO);

      expect(consoleSpy).toHaveBeenCalledWith(
        '[ErrorTracking]',
        ErrorSeverity.INFO,
        message,
        context
      );
      consoleSpy.mockRestore();
    });

    it('should capture React error', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const tracker = getErrorTracker();
      const error = new Error('React error');
      const errorInfo = { componentStack: 'Component stack' };

      tracker.captureReactError(error, errorInfo as { componentStack: string });

      expect(consoleSpy).toHaveBeenCalledWith(
        '[ErrorTracking] React Error:',
        error,
        errorInfo,
        undefined
      );
      consoleSpy.mockRestore();
    });

    it('should set user', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const tracker = getErrorTracker();
      const user = { id: '123', email: 'test@example.com' };

      tracker.setUser(user);

      expect(consoleSpy).toHaveBeenCalledWith('[ErrorTracking] User set:', user);
      consoleSpy.mockRestore();
    });

    it('should add breadcrumb', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const tracker = getErrorTracker();

      tracker.addBreadcrumb('Test action', 'navigation', { page: 'home' });

      expect(consoleSpy).toHaveBeenCalledWith(
        '[ErrorTracking] Breadcrumb:',
        'navigation',
        'Test action',
        { page: 'home' }
      );
      consoleSpy.mockRestore();
    });
  });

  describe('ErrorSeverity', () => {
    it('should have correct values', () => {
      expect(ErrorSeverity.DEBUG).toBe('debug');
      expect(ErrorSeverity.INFO).toBe('info');
      expect(ErrorSeverity.WARNING).toBe('warning');
      expect(ErrorSeverity.ERROR).toBe('error');
      expect(ErrorSeverity.FATAL).toBe('fatal');
    });
  });
});
