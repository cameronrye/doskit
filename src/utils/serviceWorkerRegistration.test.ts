/**
 * Tests for serviceWorkerRegistration utility
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { register, type ServiceWorkerConfig } from './serviceWorkerRegistration';

// Mock service worker registration
const createMockRegistration = (): ServiceWorkerRegistration => ({
  installing: null,
  waiting: null,
  active: {
    postMessage: vi.fn(),
    state: 'activated',
  } as Partial<ServiceWorker> as ServiceWorker,
  scope: '/',
  updateViaCache: 'imports' as ServiceWorkerUpdateViaCache,
  onupdatefound: null,
  update: vi.fn().mockResolvedValue(undefined),
  unregister: vi.fn().mockResolvedValue(true),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
});

describe('serviceWorkerRegistration', () => {
  let originalNavigator: typeof navigator;
  let originalWindow: typeof window;

  beforeEach(() => {
    // Save originals
    originalNavigator = global.navigator;
    originalWindow = global.window;

    // Mock navigator.serviceWorker
    Object.defineProperty(global.navigator, 'serviceWorker', {
      writable: true,
      configurable: true,
      value: {
        register: vi.fn(),
        ready: Promise.resolve(createMockRegistration()),
        controller: null,
      },
    });

    // Mock window.location
    Object.defineProperty(global.window, 'location', {
      writable: true,
      configurable: true,
      value: {
        hostname: 'example.com',
        origin: 'https://example.com',
        href: 'https://example.com/',
        reload: vi.fn(),
      },
    });

    // Mock document.visibilityState
    Object.defineProperty(document, 'visibilityState', {
      writable: true,
      configurable: true,
      value: 'visible',
    });

    // Clear all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Restore originals
    global.navigator = originalNavigator;
    global.window = originalWindow;
  });

  describe('register', () => {
    beforeEach(() => {
      // Mock import.meta.env
      vi.stubEnv('PROD', true);
      vi.stubEnv('BASE_URL', '/');
    });

    afterEach(() => {
      vi.unstubAllEnvs();
    });

    it('should not register in development mode', () => {
      vi.stubEnv('PROD', false);

      const registerSpy = vi.spyOn(navigator.serviceWorker, 'register');

      register();

      expect(registerSpy).not.toHaveBeenCalled();
    });

    it('should not register when service worker is not supported', () => {
      Object.defineProperty(global.navigator, 'serviceWorker', {
        writable: true,
        configurable: true,
        value: undefined,
      });

      // Should not throw
      expect(() => register()).not.toThrow();
    });

    it('should not register when PUBLIC_URL is on different origin', () => {
      vi.stubEnv('BASE_URL', 'https://different-origin.com/');

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const registerSpy = vi.spyOn(navigator.serviceWorker, 'register');

      register();

      // Trigger load event
      window.dispatchEvent(new Event('load'));

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('PUBLIC_URL is on a different origin')
      );
      expect(registerSpy).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should register service worker on load event', async () => {
      const mockRegistration = createMockRegistration();
      const registerSpy = vi
        .spyOn(navigator.serviceWorker, 'register')
        .mockResolvedValue(mockRegistration);

      // Mock fetch for localhost check
      global.fetch = vi.fn().mockResolvedValue({
        status: 200,
        headers: {
          get: () => 'application/javascript',
        },
      });

      register();

      // Trigger load event
      window.dispatchEvent(new Event('load'));

      // Wait for async operations
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(registerSpy).toHaveBeenCalledWith('/sw.js');
    });

    it('should call onSuccess callback when SW is installed for first time', async () => {
      const onSuccess = vi.fn();
      const onOfflineReady = vi.fn();
      const config: ServiceWorkerConfig = { onSuccess, onOfflineReady };

      const mockRegistration = createMockRegistration();
      const installingWorker = {
        state: 'installing',
        onstatechange: null as ((this: ServiceWorker, ev: Event) => unknown) | null,
      };

      mockRegistration.installing = installingWorker as Partial<ServiceWorker> as ServiceWorker;

      // Mock fetch for localhost check
      global.fetch = vi.fn().mockResolvedValue({
        status: 200,
        headers: {
          get: () => 'application/javascript',
        },
      });

      vi.spyOn(navigator.serviceWorker, 'register').mockImplementation(async () => {
        // Simulate registration process
        await new Promise((resolve) => setTimeout(resolve, 0));

        // Trigger onupdatefound after registration
        setTimeout(() => {
          if (mockRegistration.onupdatefound) {
            mockRegistration.onupdatefound(new Event('updatefound'));
          }

          // Change state to installed
          setTimeout(() => {
            installingWorker.state = 'installed';
            if (installingWorker.onstatechange) {
              installingWorker.onstatechange(new Event('statechange'));
            }
          }, 0);
        }, 0);

        return mockRegistration;
      });

      // Mock navigator.serviceWorker.controller to be null (first install)
      Object.defineProperty(navigator.serviceWorker, 'controller', {
        writable: true,
        configurable: true,
        value: null,
      });

      register(config);

      // Trigger load event
      window.dispatchEvent(new Event('load'));

      // Wait for all async operations
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(onSuccess).toHaveBeenCalledWith(mockRegistration);
      expect(onOfflineReady).toHaveBeenCalled();
    });

    it('should call onUpdate callback when SW is updated', async () => {
      const onUpdate = vi.fn();
      const config: ServiceWorkerConfig = { onUpdate };

      const mockRegistration = createMockRegistration();
      const installingWorker = {
        state: 'installing',
        onstatechange: null as ((this: ServiceWorker, ev: Event) => unknown) | null,
      };

      mockRegistration.installing = installingWorker as Partial<ServiceWorker> as ServiceWorker;

      // Mock fetch for localhost check
      global.fetch = vi.fn().mockResolvedValue({
        status: 200,
        headers: {
          get: () => 'application/javascript',
        },
      });

      vi.spyOn(navigator.serviceWorker, 'register').mockImplementation(async () => {
        // Simulate registration process
        await new Promise((resolve) => setTimeout(resolve, 0));

        // Trigger onupdatefound after registration
        setTimeout(() => {
          if (mockRegistration.onupdatefound) {
            mockRegistration.onupdatefound(new Event('updatefound'));
          }

          // Change state to installed
          setTimeout(() => {
            installingWorker.state = 'installed';
            if (installingWorker.onstatechange) {
              installingWorker.onstatechange(new Event('statechange'));
            }
          }, 0);
        }, 0);

        return mockRegistration;
      });

      // Mock navigator.serviceWorker.controller to exist (update scenario)
      Object.defineProperty(navigator.serviceWorker, 'controller', {
        writable: true,
        configurable: true,
        value: { state: 'activated' },
      });

      register(config);

      // Trigger load event
      window.dispatchEvent(new Event('load'));

      // Wait for all async operations
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(onUpdate).toHaveBeenCalledWith(mockRegistration);
    });

    it('should call onUpdate for an update already waiting when the page loads', async () => {
      // e.g. the user chose "Later" and reloaded: updatefound does not fire again
      const onUpdate = vi.fn();
      const mockRegistration = createMockRegistration();
      mockRegistration.waiting = {
        state: 'installed',
        postMessage: vi.fn(),
      } as Partial<ServiceWorker> as ServiceWorker;

      vi.spyOn(navigator.serviceWorker, 'register').mockResolvedValue(mockRegistration);
      Object.defineProperty(navigator.serviceWorker, 'controller', {
        writable: true,
        configurable: true,
        value: { state: 'activated' },
      });

      register({ onUpdate });
      window.dispatchEvent(new Event('load'));
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(onUpdate).toHaveBeenCalledWith(mockRegistration);
    });
  });
});
