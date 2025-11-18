/**
 * Tests for PWAContext
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import {
  PWAProvider,
  usePWA,
  usePWAState,
  usePWAActions,
  type BeforeInstallPromptEvent,
} from "./PWAContext";

// Mock BeforeInstallPromptEvent
const createMockPromptEvent = (): BeforeInstallPromptEvent => {
  const event = new Event("beforeinstallprompt") as BeforeInstallPromptEvent;
  event.prompt = vi.fn().mockResolvedValue(undefined);
  event.userChoice = Promise.resolve({ outcome: "accepted" as const });
  return event;
};

describe("PWAContext", () => {
  beforeEach(() => {
    // Reset window.matchMedia mock
    Object.defineProperty(window, "matchMedia", {
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
  });

  describe("PWAProvider", () => {
    it("should provide default state", () => {
      const { result } = renderHook(() => usePWA(), {
        wrapper: PWAProvider,
      });

      expect(result.current.deferredPrompt).toBeNull();
      expect(result.current.showInstallPrompt).toBe(false);
      expect(result.current.isInstalled).toBe(false);
      expect(result.current.updateRegistration).toBeNull();
      expect(result.current.hasUpdate).toBe(false);
    });

    it("should detect installed state from standalone mode", () => {
      Object.defineProperty(window, "matchMedia", {
        writable: true,
        value: vi.fn().mockImplementation((query) => ({
          matches: query === "(display-mode: standalone)",
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      const { result } = renderHook(() => usePWA(), {
        wrapper: PWAProvider,
      });

      expect(result.current.isInstalled).toBe(true);
    });

    it("should capture beforeinstallprompt event", async () => {
      const { result } = renderHook(() => usePWA(), {
        wrapper: PWAProvider,
      });

      const mockEvent = createMockPromptEvent();

      act(() => {
        window.dispatchEvent(mockEvent);
      });

      await waitFor(() => {
        expect(result.current.deferredPrompt).toBeTruthy();
      });
    });

    it("should handle appinstalled event", async () => {
      const { result } = renderHook(() => usePWA(), {
        wrapper: PWAProvider,
      });

      // First set a deferred prompt
      const mockEvent = createMockPromptEvent();
      act(() => {
        window.dispatchEvent(mockEvent);
      });

      await waitFor(() => {
        expect(result.current.deferredPrompt).toBeTruthy();
      });

      // Then trigger appinstalled
      act(() => {
        window.dispatchEvent(new Event("appinstalled"));
      });

      await waitFor(() => {
        expect(result.current.isInstalled).toBe(true);
        expect(result.current.deferredPrompt).toBeNull();
        expect(result.current.showInstallPrompt).toBe(false);
      });
    });

    it("should update deferred prompt", () => {
      const { result } = renderHook(() => usePWA(), {
        wrapper: PWAProvider,
      });

      const mockEvent = createMockPromptEvent();

      act(() => {
        result.current.setDeferredPrompt(mockEvent);
      });

      expect(result.current.deferredPrompt).toBe(mockEvent);
    });

    it("should update install prompt visibility", () => {
      const { result } = renderHook(() => usePWA(), {
        wrapper: PWAProvider,
      });

      act(() => {
        result.current.setShowInstallPrompt(true);
      });

      expect(result.current.showInstallPrompt).toBe(true);
    });

    it("should update installed state", () => {
      const { result } = renderHook(() => usePWA(), {
        wrapper: PWAProvider,
      });

      act(() => {
        result.current.setIsInstalled(true);
      });

      expect(result.current.isInstalled).toBe(true);
    });

    it("should update update registration", () => {
      const { result } = renderHook(() => usePWA(), {
        wrapper: PWAProvider,
      });

      const mockRegistration = {} as ServiceWorkerRegistration;

      act(() => {
        result.current.setUpdateRegistration(mockRegistration);
      });

      expect(result.current.updateRegistration).toBe(mockRegistration);
      expect(result.current.hasUpdate).toBe(true);
    });

    it("should dismiss update", () => {
      const { result } = renderHook(() => usePWA(), {
        wrapper: PWAProvider,
      });

      const mockRegistration = {} as ServiceWorkerRegistration;

      act(() => {
        result.current.setUpdateRegistration(mockRegistration);
      });

      expect(result.current.hasUpdate).toBe(true);

      act(() => {
        result.current.dismissUpdate();
      });

      expect(result.current.updateRegistration).toBeNull();
      expect(result.current.hasUpdate).toBe(false);
    });
  });

  describe("usePWA", () => {
    it("should throw error when used outside provider", () => {
      // Suppress console.error for this test
      const originalError = console.error;
      console.error = () => {};

      expect(() => {
        renderHook(() => usePWA());
      }).toThrow("usePWA must be used within a PWAProvider");

      console.error = originalError;
    });
  });

  describe("usePWAState", () => {
    it("should return only state values", () => {
      const { result } = renderHook(() => usePWAState(), {
        wrapper: PWAProvider,
      });

      expect(result.current).toHaveProperty("deferredPrompt");
      expect(result.current).toHaveProperty("showInstallPrompt");
      expect(result.current).toHaveProperty("isInstalled");
      expect(result.current).toHaveProperty("updateRegistration");
      expect(result.current).toHaveProperty("hasUpdate");
      expect(result.current).not.toHaveProperty("setDeferredPrompt");
    });
  });

  describe("usePWAActions", () => {
    it("should return only action functions", () => {
      const { result } = renderHook(() => usePWAActions(), {
        wrapper: PWAProvider,
      });

      expect(result.current).toHaveProperty("setDeferredPrompt");
      expect(result.current).toHaveProperty("setShowInstallPrompt");
      expect(result.current).toHaveProperty("setIsInstalled");
      expect(result.current).toHaveProperty("setUpdateRegistration");
      expect(result.current).toHaveProperty("dismissUpdate");
      expect(result.current).not.toHaveProperty("deferredPrompt");
    });
  });
});
