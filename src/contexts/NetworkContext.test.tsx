/**
 * Tests for NetworkContext
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import {
  NetworkProvider,
  useNetwork,
  useNetworkState,
  useNetworkActions,
} from "./NetworkContext";

describe("NetworkContext", () => {
  // Store original navigator.onLine
  const originalOnLine = navigator.onLine;

  beforeEach(() => {
    // Reset navigator.onLine to true before each test
    Object.defineProperty(navigator, "onLine", {
      writable: true,
      value: true,
    });
  });

  afterEach(() => {
    // Restore original value
    Object.defineProperty(navigator, "onLine", {
      writable: true,
      value: originalOnLine,
    });
  });

  describe("NetworkProvider", () => {
    it("should provide initial online state", () => {
      const { result } = renderHook(() => useNetwork(), {
        wrapper: NetworkProvider,
      });

      expect(result.current.isOnline).toBe(true);
      expect(result.current.showOfflineMessage).toBe(false);
    });

    it("should provide initial offline state when navigator is offline", () => {
      Object.defineProperty(navigator, "onLine", {
        writable: true,
        value: false,
      });

      const { result } = renderHook(() => useNetwork(), {
        wrapper: NetworkProvider,
      });

      expect(result.current.isOnline).toBe(false);
    });

    it("should update state when going offline", async () => {
      const { result } = renderHook(() => useNetwork(), {
        wrapper: NetworkProvider,
      });

      expect(result.current.isOnline).toBe(true);

      // Simulate going offline
      act(() => {
        Object.defineProperty(navigator, "onLine", {
          writable: true,
          value: false,
        });
        window.dispatchEvent(new Event("offline"));
      });

      await waitFor(() => {
        expect(result.current.isOnline).toBe(false);
        expect(result.current.showOfflineMessage).toBe(true);
      });
    });

    it("should update state when going online", async () => {
      // Start offline
      Object.defineProperty(navigator, "onLine", {
        writable: true,
        value: false,
      });

      const { result } = renderHook(() => useNetwork(), {
        wrapper: NetworkProvider,
      });

      expect(result.current.isOnline).toBe(false);

      // Simulate going online
      act(() => {
        Object.defineProperty(navigator, "onLine", {
          writable: true,
          value: true,
        });
        window.dispatchEvent(new Event("online"));
      });

      await waitFor(() => {
        expect(result.current.isOnline).toBe(true);
        expect(result.current.showOfflineMessage).toBe(false);
      });
    });

    it("should allow manual control of offline message", () => {
      const { result } = renderHook(() => useNetwork(), {
        wrapper: NetworkProvider,
      });

      act(() => {
        result.current.setShowOfflineMessage(true);
      });

      expect(result.current.showOfflineMessage).toBe(true);

      act(() => {
        result.current.setShowOfflineMessage(false);
      });

      expect(result.current.showOfflineMessage).toBe(false);
    });
  });

  describe("useNetwork", () => {
    it("should throw error when used outside provider", () => {
      // Suppress console.error for this test
      const originalError = console.error;
      console.error = () => {};

      expect(() => {
        renderHook(() => useNetwork());
      }).toThrow("useNetwork must be used within a NetworkProvider");

      console.error = originalError;
    });
  });

  describe("useNetworkState", () => {
    it("should return only state values", () => {
      const { result } = renderHook(() => useNetworkState(), {
        wrapper: NetworkProvider,
      });

      expect(result.current).toHaveProperty("isOnline");
      expect(result.current).toHaveProperty("showOfflineMessage");
      expect(result.current).not.toHaveProperty("setShowOfflineMessage");
    });
  });

  describe("useNetworkActions", () => {
    it("should return only action functions", () => {
      const { result } = renderHook(() => useNetworkActions(), {
        wrapper: NetworkProvider,
      });

      expect(result.current).toHaveProperty("setShowOfflineMessage");
      expect(result.current).not.toHaveProperty("isOnline");
    });
  });
});
