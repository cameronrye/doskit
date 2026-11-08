/**
 * Tests for serviceWorkerRegistration utility
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PWA_CONFIG } from '../constants/app';
import { register, type ServiceWorkerConfig } from './serviceWorkerRegistration';

// Mock service worker, with only the fields register() reads
const createMockWorker = (fields: Partial<ServiceWorker>) => fields as ServiceWorker;

// Mock service worker registration
const createMockRegistration = (
  overrides: Partial<ServiceWorkerRegistration> = {}
): ServiceWorkerRegistration => {
  const registration: Partial<ServiceWorkerRegistration> = {
    installing: null,
    waiting: null,
    active: createMockWorker({ postMessage: vi.fn(), state: 'activated' }),
    scope: '/',
    updateViaCache: 'imports',
    onupdatefound: null,
    update: vi.fn().mockResolvedValue(undefined),
    unregister: vi.fn().mockResolvedValue(true),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
    ...overrides,
  };
  return registration as ServiceWorkerRegistration;
};

// What register() reads from /sw.js on localhost before it registers the worker
const swScriptResponse = { status: 200, headers: { get: () => 'application/javascript' } };

// Put a property back as it was before a test redefined it
const restoreProperty = (target: object, key: string, descriptor?: PropertyDescriptor) => {
  if (descriptor) {
    Object.defineProperty(target, key, descriptor);
  } else {
    Reflect.deleteProperty(target, key);
  }
};

describe('serviceWorkerRegistration', () => {
  const originalServiceWorker = Object.getOwnPropertyDescriptor(navigator, 'serviceWorker');
  const originalLocation = Object.getOwnPropertyDescriptor(window, 'location');
  const originalVisibilityState = Object.getOwnPropertyDescriptor(document, 'visibilityState');
  // register() adds a load listener on every call. They are removed after each test, so a
  // later test's load event cannot run an earlier test's registration.
  let loadListeners: EventListenerOrEventListenerObject[] = [];

  beforeEach(() => {
    const addEventListener = window.addEventListener.bind(window);
    vi.spyOn(window, 'addEventListener').mockImplementation((type, listener, options) => {
      if (type === 'load' && listener) {
        loadListeners.push(listener);
      }
      addEventListener(type, listener, options);
    });

    // Mock navigator.serviceWorker
    Object.defineProperty(globalThis.navigator, 'serviceWorker', {
      writable: true,
      configurable: true,
      value: {
        register: vi.fn(),
        ready: Promise.resolve(createMockRegistration()),
        controller: null,
      },
    });

    // Mock window.location
    Object.defineProperty(globalThis.window, 'location', {
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
    loadListeners.forEach((listener) => window.removeEventListener('load', listener));
    loadListeners = [];
    vi.restoreAllMocks();
    restoreProperty(navigator, 'serviceWorker', originalServiceWorker);
    restoreProperty(window, 'location', originalLocation);
    restoreProperty(document, 'visibilityState', originalVisibilityState);
  });

  describe('register', () => {
    beforeEach(() => {
      // Mock import.meta.env
      vi.stubEnv('PROD', true);
      vi.stubEnv('BASE_URL', '/');
      // jsdom serves the page from localhost, where register() first checks that sw.js exists
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(swScriptResponse));
    });

    afterEach(() => {
      vi.unstubAllEnvs();
      vi.unstubAllGlobals();
    });

    it('should not register in development mode', () => {
      vi.stubEnv('PROD', false);

      const registerSpy = vi.spyOn(navigator.serviceWorker, 'register');

      register();

      expect(registerSpy).not.toHaveBeenCalled();
    });

    it('should not register when service worker is not supported', () => {
      Reflect.deleteProperty(navigator, 'serviceWorker');

      expect(() => register()).not.toThrow();
      expect(loadListeners).toHaveLength(0);
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

      const installingWorker = {
        state: 'installing' as ServiceWorkerState,
        onstatechange: null as ((ev: Event) => unknown) | null,
      };
      const mockRegistration = createMockRegistration({
        installing: createMockWorker(installingWorker),
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

      const installingWorker = {
        state: 'installing' as ServiceWorkerState,
        onstatechange: null as ((ev: Event) => unknown) | null,
      };
      const mockRegistration = createMockRegistration({
        installing: createMockWorker(installingWorker),
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
      const mockRegistration = createMockRegistration({
        waiting: createMockWorker({ state: 'installed', postMessage: vi.fn() }),
      });

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

    describe('logging', () => {
      afterEach(() => {
        vi.useRealTimers();
      });

      /**
       * Registers the worker on localhost, where register() first checks that sw.js exists,
       * and installs an update while a worker controls the page
       */
      async function registerAndInstallUpdate(registerWorker: typeof register) {
        const installing = {
          state: 'installing' as ServiceWorkerState,
          onstatechange: null as ((ev: Event) => unknown) | null,
        };
        const registration = createMockRegistration({ installing: createMockWorker(installing) });
        vi.spyOn(navigator.serviceWorker, 'register').mockResolvedValue(registration);
        Object.defineProperty(navigator.serviceWorker, 'controller', {
          configurable: true,
          value: { state: 'activated' },
        });
        const onUpdate = vi.fn();

        registerWorker({ onUpdate });
        window.dispatchEvent(new Event('load'));
        await vi.waitFor(() => expect(registration.onupdatefound).toBeTypeOf('function'));
        registration.onupdatefound?.call(registration, new Event('updatefound'));
        installing.state = 'installed';
        installing.onstatechange?.(new Event('statechange'));
        return { registration, onUpdate };
      }

      /** Everything logged below warnings, as one string per call */
      function captureInformation() {
        const lines: string[] = [];
        for (const method of ['log', 'info', 'debug'] as const) {
          vi.spyOn(console, method).mockImplementation((...args: unknown[]) => {
            lines.push(args.join(' '));
          });
        }
        return lines;
      }

      it('says in development how a waiting update takes over', async () => {
        const lines = captureInformation();

        await registerAndInstallUpdate(register);

        expect(lines.filter((line) => line.includes('Update Now'))).toHaveLength(1);
      });

      it('says in development that pages come from the network first', async () => {
        // Create React App's text called the app "served cache-first" and linked cra.link
        const lines = captureInformation();

        await registerAndInstallUpdate(register);

        await vi.waitFor(() => expect(lines.join('\n')).toMatch(/network first/));
        expect(lines.filter((line) => /cache-first|cra\.link/.test(line))).toEqual([]);
      });

      it('logs nothing below warnings in a production build', async () => {
        vi.useFakeTimers();
        vi.stubEnv('DEV', false);
        vi.resetModules();
        window.location.hostname = 'localhost';
        const production = await import('./serviceWorkerRegistration');
        const lines = captureInformation();

        const { registration, onUpdate } = await registerAndInstallUpdate(production.register);
        await vi.advanceTimersByTimeAsync(PWA_CONFIG.UPDATE_CHECK_INTERVAL);

        expect(onUpdate).toHaveBeenCalledOnce();
        expect(registration.update).toHaveBeenCalled();
        expect(lines).toEqual([]);
      });
    });

    describe('periodic update checks', () => {
      beforeEach(() => {
        vi.useFakeTimers();
      });

      afterEach(() => {
        vi.useRealTimers();
      });

      it('should check for an update each time the configured interval passes', async () => {
        const mockRegistration = createMockRegistration();
        vi.spyOn(navigator.serviceWorker, 'register').mockResolvedValue(mockRegistration);

        register();
        window.dispatchEvent(new Event('load'));
        await vi.advanceTimersByTimeAsync(0); // let the registration resolve

        await vi.advanceTimersByTimeAsync(PWA_CONFIG.UPDATE_CHECK_INTERVAL - 1);
        expect(mockRegistration.update).not.toHaveBeenCalled();

        await vi.advanceTimersByTimeAsync(1);
        expect(mockRegistration.update).toHaveBeenCalled();
      });

      it('should check hourly', () => {
        expect(PWA_CONFIG.UPDATE_CHECK_INTERVAL).toBe(60 * 60 * 1000);
      });
    });
  });
});
