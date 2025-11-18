/**
 * Tests for serviceWorkerRegistration utility
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  register,
  unregister,
  update,
  isStandalone,
  isServiceWorkerSupported,
  getRegistration,
  sendMessage,
  clearCaches,
  cacheUrls,
  type ServiceWorkerConfig,
} from "./serviceWorkerRegistration";

// Mock service worker registration
const createMockRegistration = (): ServiceWorkerRegistration => ({
  installing: null,
  waiting: null,
  active: {
    postMessage: vi.fn(),
    state: "activated",
  } as Partial<ServiceWorker> as ServiceWorker,
  scope: "/",
  updateViaCache: "imports" as ServiceWorkerUpdateViaCache,
  onupdatefound: null,
  update: vi.fn().mockResolvedValue(undefined),
  unregister: vi.fn().mockResolvedValue(true),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
});

describe("serviceWorkerRegistration", () => {
  let originalNavigator: typeof navigator;
  let originalWindow: typeof window;

  beforeEach(() => {
    // Save originals
    originalNavigator = global.navigator;
    originalWindow = global.window;

    // Mock navigator.serviceWorker
    Object.defineProperty(global.navigator, "serviceWorker", {
      writable: true,
      configurable: true,
      value: {
        register: vi.fn(),
        ready: Promise.resolve(createMockRegistration()),
        controller: null,
      },
    });

    // Mock window.location
    Object.defineProperty(global.window, "location", {
      writable: true,
      configurable: true,
      value: {
        hostname: "example.com",
        origin: "https://example.com",
        href: "https://example.com/",
        reload: vi.fn(),
      },
    });

    // Mock window.matchMedia
    Object.defineProperty(global.window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    // Mock document.visibilityState
    Object.defineProperty(document, "visibilityState", {
      writable: true,
      configurable: true,
      value: "visible",
    });

    // Clear all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Restore originals
    global.navigator = originalNavigator;
    global.window = originalWindow;
  });

  describe("isServiceWorkerSupported", () => {
    it("should return true when service workers are supported", () => {
      expect(isServiceWorkerSupported()).toBe(true);
    });

    it("should return false when service workers are not supported", () => {
      // Delete the property entirely
      delete (global.navigator as Partial<Navigator>).serviceWorker;

      expect(isServiceWorkerSupported()).toBe(false);
    });
  });

  describe("isStandalone", () => {
    it("should return false when not in standalone mode", () => {
      expect(isStandalone()).toBe(false);
    });

    it("should return true when matchMedia indicates standalone", () => {
      Object.defineProperty(global.window, "matchMedia", {
        writable: true,
        value: vi.fn().mockImplementation((query) => ({
          matches: query === "(display-mode: standalone)",
          media: query,
        })),
      });

      expect(isStandalone()).toBe(true);
    });

    it("should return true when navigator.standalone is true", () => {
      Object.defineProperty(global.navigator, "standalone", {
        writable: true,
        configurable: true,
        value: true,
      });

      expect(isStandalone()).toBe(true);
    });
  });

  describe("getRegistration", () => {
    it("should return registration when service worker is supported", async () => {
      const registration = await getRegistration();
      expect(registration).toBeDefined();
    });

    it("should return undefined when service worker is not supported", async () => {
      // Delete the property entirely
      delete (global.navigator as Partial<Navigator>).serviceWorker;

      const registration = await getRegistration();
      expect(registration).toBeUndefined();
    });
  });

  describe("unregister", () => {
    it("should unregister service worker", async () => {
      const mockRegistration = createMockRegistration();
      Object.defineProperty(global.navigator, "serviceWorker", {
        writable: true,
        configurable: true,
        value: {
          ready: Promise.resolve(mockRegistration),
        },
      });

      await unregister();

      // Wait for promise to resolve
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockRegistration.unregister).toHaveBeenCalled();
    });

    it("should handle errors when unregistering", async () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      Object.defineProperty(global.navigator, "serviceWorker", {
        writable: true,
        configurable: true,
        value: {
          ready: Promise.reject(new Error("Unregister failed")),
        },
      });

      await unregister();

      // Wait for promise to reject
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it("should do nothing when service worker is not supported", () => {
      // Delete the property entirely
      delete (global.navigator as Partial<Navigator>).serviceWorker;

      // Should not throw
      expect(() => unregister()).not.toThrow();
    });
  });

  describe("update", () => {
    it("should trigger service worker update", async () => {
      const mockRegistration = createMockRegistration();
      Object.defineProperty(global.navigator, "serviceWorker", {
        writable: true,
        configurable: true,
        value: {
          ready: Promise.resolve(mockRegistration),
        },
      });

      await update();

      // Wait for promise to resolve
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockRegistration.update).toHaveBeenCalled();
    });

    it("should handle errors when updating", async () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      Object.defineProperty(global.navigator, "serviceWorker", {
        writable: true,
        configurable: true,
        value: {
          ready: Promise.reject(new Error("Update failed")),
        },
      });

      await update();

      // Wait for promise to reject
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it("should do nothing when service worker is not supported", () => {
      // Delete the property entirely
      delete (global.navigator as Partial<Navigator>).serviceWorker;

      // Should not throw
      expect(() => update()).not.toThrow();
    });
  });

  describe("sendMessage", () => {
    it("should send message to active service worker", async () => {
      const mockRegistration = createMockRegistration();
      Object.defineProperty(global.navigator, "serviceWorker", {
        writable: true,
        configurable: true,
        value: {
          ready: Promise.resolve(mockRegistration),
        },
      });

      const message = { type: "TEST", data: "test data" };
      await sendMessage(message);

      expect(mockRegistration.active?.postMessage).toHaveBeenCalledWith(
        message,
      );
    });

    it("should not throw when no active service worker", async () => {
      const mockRegistration = createMockRegistration();
      mockRegistration.active = null;

      Object.defineProperty(global.navigator, "serviceWorker", {
        writable: true,
        configurable: true,
        value: {
          ready: Promise.resolve(mockRegistration),
        },
      });

      // Should not throw
      await expect(sendMessage({ type: "TEST" })).resolves.toBeUndefined();
    });
  });

  describe("clearCaches", () => {
    it("should send clear cache message", async () => {
      const mockRegistration = createMockRegistration();
      Object.defineProperty(global.navigator, "serviceWorker", {
        writable: true,
        configurable: true,
        value: {
          ready: Promise.resolve(mockRegistration),
        },
      });

      await clearCaches();

      expect(mockRegistration.active?.postMessage).toHaveBeenCalledWith({
        type: "CLEAR_CACHE",
      });
    });
  });

  describe("cacheUrls", () => {
    it("should send cache URLs message", async () => {
      const mockRegistration = createMockRegistration();
      Object.defineProperty(global.navigator, "serviceWorker", {
        writable: true,
        configurable: true,
        value: {
          ready: Promise.resolve(mockRegistration),
        },
      });

      const urls = ["/app1.js", "/app2.js"];
      await cacheUrls(urls);

      expect(mockRegistration.active?.postMessage).toHaveBeenCalledWith({
        type: "CACHE_URLS",
        urls,
      });
    });
  });

  describe("register", () => {
    beforeEach(() => {
      // Mock import.meta.env
      vi.stubEnv("PROD", true);
      vi.stubEnv("BASE_URL", "/");
    });

    afterEach(() => {
      vi.unstubAllEnvs();
    });

    it("should not register in development mode", () => {
      vi.stubEnv("PROD", false);

      const registerSpy = vi.spyOn(navigator.serviceWorker, "register");

      register();

      expect(registerSpy).not.toHaveBeenCalled();
    });

    it("should not register when service worker is not supported", () => {
      Object.defineProperty(global.navigator, "serviceWorker", {
        writable: true,
        configurable: true,
        value: undefined,
      });

      // Should not throw
      expect(() => register()).not.toThrow();
    });

    it("should not register when PUBLIC_URL is on different origin", () => {
      vi.stubEnv("BASE_URL", "https://different-origin.com/");

      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const registerSpy = vi.spyOn(navigator.serviceWorker, "register");

      register();

      // Trigger load event
      window.dispatchEvent(new Event("load"));

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("PUBLIC_URL is on a different origin"),
      );
      expect(registerSpy).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it("should register service worker on load event", async () => {
      const mockRegistration = createMockRegistration();
      const registerSpy = vi
        .spyOn(navigator.serviceWorker, "register")
        .mockResolvedValue(mockRegistration);

      // Mock fetch for localhost check
      global.fetch = vi.fn().mockResolvedValue({
        status: 200,
        headers: {
          get: () => "application/javascript",
        },
      });

      register();

      // Trigger load event
      window.dispatchEvent(new Event("load"));

      // Wait for async operations
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(registerSpy).toHaveBeenCalledWith("/sw.js");
    });

    it("should call onSuccess callback when SW is installed for first time", async () => {
      const onSuccess = vi.fn();
      const onOfflineReady = vi.fn();
      const config: ServiceWorkerConfig = { onSuccess, onOfflineReady };

      const mockRegistration = createMockRegistration();
      const installingWorker = {
        state: "installing",
        onstatechange: null as
          | ((this: ServiceWorker, ev: Event) => unknown)
          | null,
      };

      mockRegistration.installing =
        installingWorker as Partial<ServiceWorker> as ServiceWorker;

      // Mock fetch for localhost check
      global.fetch = vi.fn().mockResolvedValue({
        status: 200,
        headers: {
          get: () => "application/javascript",
        },
      });

      vi.spyOn(navigator.serviceWorker, "register").mockImplementation(
        async () => {
          // Simulate registration process
          await new Promise((resolve) => setTimeout(resolve, 0));

          // Trigger onupdatefound after registration
          setTimeout(() => {
            if (mockRegistration.onupdatefound) {
              mockRegistration.onupdatefound(new Event("updatefound"));
            }

            // Change state to installed
            setTimeout(() => {
              installingWorker.state = "installed";
              if (installingWorker.onstatechange) {
                installingWorker.onstatechange(new Event("statechange"));
              }
            }, 0);
          }, 0);

          return mockRegistration;
        },
      );

      // Mock navigator.serviceWorker.controller to be null (first install)
      Object.defineProperty(navigator.serviceWorker, "controller", {
        writable: true,
        configurable: true,
        value: null,
      });

      register(config);

      // Trigger load event
      window.dispatchEvent(new Event("load"));

      // Wait for all async operations
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(onSuccess).toHaveBeenCalledWith(mockRegistration);
      expect(onOfflineReady).toHaveBeenCalled();
    });

    it("should call onUpdate callback when SW is updated", async () => {
      const onUpdate = vi.fn();
      const config: ServiceWorkerConfig = { onUpdate };

      const mockRegistration = createMockRegistration();
      const installingWorker = {
        state: "installing",
        onstatechange: null as
          | ((this: ServiceWorker, ev: Event) => unknown)
          | null,
      };

      mockRegistration.installing =
        installingWorker as Partial<ServiceWorker> as ServiceWorker;

      // Mock fetch for localhost check
      global.fetch = vi.fn().mockResolvedValue({
        status: 200,
        headers: {
          get: () => "application/javascript",
        },
      });

      vi.spyOn(navigator.serviceWorker, "register").mockImplementation(
        async () => {
          // Simulate registration process
          await new Promise((resolve) => setTimeout(resolve, 0));

          // Trigger onupdatefound after registration
          setTimeout(() => {
            if (mockRegistration.onupdatefound) {
              mockRegistration.onupdatefound(new Event("updatefound"));
            }

            // Change state to installed
            setTimeout(() => {
              installingWorker.state = "installed";
              if (installingWorker.onstatechange) {
                installingWorker.onstatechange(new Event("statechange"));
              }
            }, 0);
          }, 0);

          return mockRegistration;
        },
      );

      // Mock navigator.serviceWorker.controller to exist (update scenario)
      Object.defineProperty(navigator.serviceWorker, "controller", {
        writable: true,
        configurable: true,
        value: { state: "activated" },
      });

      register(config);

      // Trigger load event
      window.dispatchEvent(new Event("load"));

      // Wait for all async operations
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(onUpdate).toHaveBeenCalledWith(mockRegistration);
    });
  });
});
