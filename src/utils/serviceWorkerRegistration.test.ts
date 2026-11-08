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

/** Serve the page from this URL, with a reload() to spy on */
const setLocation = (href: string) => {
  const { hostname, origin } = new URL(href);
  Object.defineProperty(window, 'location', {
    writable: true,
    configurable: true,
    value: { hostname, origin, href, reload: vi.fn() },
  });
};

/** Hide or show the page, as switching tabs does */
const setVisibility = (state: DocumentVisibilityState) => {
  Object.defineProperty(document, 'visibilityState', { configurable: true, value: state });
  document.dispatchEvent(new Event('visibilitychange'));
};

describe('serviceWorkerRegistration', () => {
  const originalServiceWorker = Object.getOwnPropertyDescriptor(navigator, 'serviceWorker');
  const originalLocation = Object.getOwnPropertyDescriptor(window, 'location');
  const originalVisibilityState = Object.getOwnPropertyDescriptor(document, 'visibilityState');
  // register() adds a load listener on every call, and each registration a visibilitychange
  // listener. They are removed after each test, so that a later test's events cannot run an
  // earlier test's registration.
  let listeners: [EventTarget, string, EventListenerOrEventListenerObject][] = [];

  beforeEach(() => {
    for (const [target, type] of [
      [window, 'load'],
      [document, 'visibilitychange'],
    ] as const) {
      const addEventListener = target.addEventListener.bind(target);
      vi.spyOn(target, 'addEventListener').mockImplementation((added, listener, options) => {
        if (added === type && listener) {
          listeners.push([target, type, listener]);
        }
        addEventListener(added, listener, options);
      });
    }

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

    // jsdom's page is on localhost, which is what the module imported above read once, when
    // it loaded, to tell whether it runs on localhost
    setLocation('http://localhost/');

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
    listeners.forEach(([target, type, listener]) => target.removeEventListener(type, listener));
    listeners = [];
    vi.restoreAllMocks();
    restoreProperty(navigator, 'serviceWorker', originalServiceWorker);
    restoreProperty(window, 'location', originalLocation);
    restoreProperty(document, 'visibilityState', originalVisibilityState);
  });

  const loadListeners = () => listeners.filter(([, type]) => type === 'load');

  describe('register', () => {
    beforeEach(() => {
      // Mock import.meta.env
      vi.stubEnv('PROD', true);
      vi.stubEnv('BASE_URL', '/');
      // On localhost, register() first checks that sw.js exists
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(swScriptResponse));
    });

    afterEach(() => {
      vi.unstubAllEnvs();
      vi.unstubAllGlobals();
    });

    it('should not register in development mode', () => {
      vi.stubEnv('PROD', false);

      register();

      expect(loadListeners()).toHaveLength(0);
    });

    it('should not register when service worker is not supported', () => {
      Reflect.deleteProperty(navigator, 'serviceWorker');

      expect(() => register()).not.toThrow();
      expect(loadListeners()).toHaveLength(0);
    });

    it('should not register when PUBLIC_URL is on different origin', () => {
      vi.stubEnv('BASE_URL', 'https://different-origin.com/');
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      register();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('PUBLIC_URL is on a different origin')
      );
      expect(loadListeners()).toHaveLength(0);
    });

    it('should register service worker on load event', async () => {
      const mockRegistration = createMockRegistration();
      const registerSpy = vi
        .spyOn(navigator.serviceWorker, 'register')
        .mockResolvedValue(mockRegistration);

      register();

      // Trigger load event
      window.dispatchEvent(new Event('load'));

      await vi.waitFor(() => expect(registerSpy).toHaveBeenCalledWith('/sw.js'));
    });

    /**
     * Register on load, and install a worker once the registration has its updatefound
     * handler, the way the browser reports one installing
     */
    async function registerAndInstall(config: ServiceWorkerConfig) {
      const installingWorker = {
        state: 'installing' as ServiceWorkerState,
        onstatechange: null as ((ev: Event) => unknown) | null,
      };
      const mockRegistration = createMockRegistration({
        installing: createMockWorker(installingWorker),
      });
      vi.spyOn(navigator.serviceWorker, 'register').mockResolvedValue(mockRegistration);

      register(config);
      window.dispatchEvent(new Event('load'));
      await vi.waitFor(() => expect(mockRegistration.onupdatefound).toBeTypeOf('function'));
      mockRegistration.onupdatefound?.call(mockRegistration, new Event('updatefound'));
      installingWorker.state = 'installed';
      installingWorker.onstatechange?.(new Event('statechange'));
      return mockRegistration;
    }

    it('should call onSuccess callback when SW is installed for first time', async () => {
      const onSuccess = vi.fn();
      const onOfflineReady = vi.fn();
      // No worker controls the page yet: this is the first install
      Object.defineProperty(navigator.serviceWorker, 'controller', {
        writable: true,
        configurable: true,
        value: null,
      });

      const mockRegistration = await registerAndInstall({ onSuccess, onOfflineReady });

      expect(onSuccess).toHaveBeenCalledWith(mockRegistration);
      expect(onOfflineReady).toHaveBeenCalled();
    });

    it('should call onUpdate callback when SW is updated', async () => {
      const onUpdate = vi.fn();
      // A worker controls the page: what installs is an update
      Object.defineProperty(navigator.serviceWorker, 'controller', {
        writable: true,
        configurable: true,
        value: { state: 'activated' },
      });

      const mockRegistration = await registerAndInstall({ onUpdate });

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

      await vi.waitFor(() => expect(onUpdate).toHaveBeenCalledWith(mockRegistration));
    });

    // What doskit.net runs. Whether the page is on localhost is read once, when the module
    // loads, so the module is loaded afresh for a page on doskit.net.
    describe('on a host other than localhost', () => {
      it('registers the worker once the page has loaded, without fetching its script first', async () => {
        setLocation('https://doskit.net/?app=stars');
        vi.resetModules();
        const onHost = await import('./serviceWorkerRegistration');
        const mockRegistration = createMockRegistration();
        const registerSpy = vi
          .spyOn(navigator.serviceWorker, 'register')
          .mockResolvedValue(mockRegistration);

        onHost.register();
        expect(registerSpy).not.toHaveBeenCalled();
        window.dispatchEvent(new Event('load'));

        await vi.waitFor(() => expect(registerSpy).toHaveBeenCalledWith('/sw.js'));
        expect(fetch).not.toHaveBeenCalled();
      });
    });

    // A port on localhost may serve another app than the one whose worker is registered
    // there, which register() checks for by fetching the worker's script first
    describe('on localhost, when sw.js is not a service worker', () => {
      it.each([
        ['is missing', { status: 404, headers: { get: () => 'text/html' } }],
        ['is not JavaScript', { status: 200, headers: { get: () => 'text/html' } }],
      ])('unregisters the worker there and reloads when sw.js %s', async (_, response) => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response));
        const existing = createMockRegistration();
        Object.defineProperty(navigator.serviceWorker, 'ready', {
          configurable: true,
          value: Promise.resolve(existing),
        });

        register();
        window.dispatchEvent(new Event('load'));

        await vi.waitFor(() => expect(window.location.reload).toHaveBeenCalledOnce());
        expect(existing.unregister).toHaveBeenCalledOnce();
        expect(navigator.serviceWorker.register).not.toHaveBeenCalled();
      });
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

      /** Register on load, and let the registration resolve */
      async function registerOnLoad() {
        const mockRegistration = createMockRegistration();
        vi.spyOn(navigator.serviceWorker, 'register').mockResolvedValue(mockRegistration);
        register();
        window.dispatchEvent(new Event('load'));
        await vi.advanceTimersByTimeAsync(0);
        return mockRegistration;
      }

      it('should check for an update each time the configured interval passes', async () => {
        const mockRegistration = await registerOnLoad();

        await vi.advanceTimersByTimeAsync(PWA_CONFIG.UPDATE_CHECK_INTERVAL - 1);
        expect(mockRegistration.update).not.toHaveBeenCalled();

        await vi.advanceTimersByTimeAsync(1);
        expect(mockRegistration.update).toHaveBeenCalled();
      });

      it('checks for an update whenever the page becomes visible again', async () => {
        // Such as when the user comes back to its tab
        const mockRegistration = await registerOnLoad();

        setVisibility('hidden');
        expect(mockRegistration.update).not.toHaveBeenCalled();
        setVisibility('visible');

        expect(mockRegistration.update).toHaveBeenCalledOnce();
      });

      it('does not check while the page is hidden', async () => {
        const mockRegistration = await registerOnLoad();
        setVisibility('hidden');

        await vi.advanceTimersByTimeAsync(PWA_CONFIG.UPDATE_CHECK_INTERVAL * 2);

        expect(mockRegistration.update).not.toHaveBeenCalled();
      });

      it('should check hourly', () => {
        expect(PWA_CONFIG.UPDATE_CHECK_INTERVAL).toBe(60 * 60 * 1000);
      });
    });
  });
});
