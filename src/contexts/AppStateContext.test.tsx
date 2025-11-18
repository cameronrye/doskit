/**
 * Tests for AppStateContext
 */

import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import {
  AppStateProvider,
  useAppState,
  useAppStateValue,
  useAppStateActions,
} from "./AppStateContext";
import type { DosApp } from "../components/DemoSelector";

const mockApp: DosApp = {
  id: "test-app",
  name: "Test App",
  description: "Test Description",
  loadMethod: "files",
  dosboxConf: "[cpu]\ncycles=auto",
  loader: async () => [],
};

describe("AppStateContext", () => {
  describe("AppStateProvider", () => {
    it("should provide default state", () => {
      const { result } = renderHook(() => useAppState(), {
        wrapper: AppStateProvider,
      });

      expect(result.current.currentApp).toBeNull();
      expect(result.current.showAppSelector).toBe(false);
      expect(result.current.isEmulatorReady).toBe(false);
      expect(result.current.isLoadingApp).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it("should accept initial app", () => {
      const { result } = renderHook(() => useAppState(), {
        wrapper: ({ children }) => (
          <AppStateProvider initialApp={mockApp}>{children}</AppStateProvider>
        ),
      });

      expect(result.current.currentApp).toEqual(mockApp);
    });

    it("should accept initial selector visibility", () => {
      const { result } = renderHook(() => useAppState(), {
        wrapper: ({ children }) => (
          <AppStateProvider initialShowSelector={true}>
            {children}
          </AppStateProvider>
        ),
      });

      expect(result.current.showAppSelector).toBe(true);
    });
  });

  describe("useAppState", () => {
    it("should throw error when used outside provider", () => {
      // Suppress console.error for this test
      const originalError = console.error;
      console.error = () => {};

      expect(() => {
        renderHook(() => useAppState());
      }).toThrow("useAppState must be used within an AppStateProvider");

      console.error = originalError;
    });

    it("should update current app", () => {
      const { result } = renderHook(() => useAppState(), {
        wrapper: AppStateProvider,
      });

      act(() => {
        result.current.setCurrentApp(mockApp);
      });

      expect(result.current.currentApp).toEqual(mockApp);
    });

    it("should update app selector visibility", () => {
      const { result } = renderHook(() => useAppState(), {
        wrapper: AppStateProvider,
      });

      act(() => {
        result.current.setShowAppSelector(true);
      });

      expect(result.current.showAppSelector).toBe(true);
    });

    it("should update emulator ready state", () => {
      const { result } = renderHook(() => useAppState(), {
        wrapper: AppStateProvider,
      });

      act(() => {
        result.current.setEmulatorReady(true);
      });

      expect(result.current.isEmulatorReady).toBe(true);
    });

    it("should update loading state", () => {
      const { result } = renderHook(() => useAppState(), {
        wrapper: AppStateProvider,
      });

      act(() => {
        result.current.setLoadingApp(true);
      });

      expect(result.current.isLoadingApp).toBe(true);
    });

    it("should update error state", () => {
      const { result } = renderHook(() => useAppState(), {
        wrapper: AppStateProvider,
      });

      const errorMessage = "Test error";

      act(() => {
        result.current.setError(errorMessage);
      });

      expect(result.current.error).toBe(errorMessage);
    });

    it("should reset all state", () => {
      const { result } = renderHook(() => useAppState(), {
        wrapper: AppStateProvider,
      });

      // Set some state
      act(() => {
        result.current.setCurrentApp(mockApp);
        result.current.setShowAppSelector(true);
        result.current.setEmulatorReady(true);
        result.current.setLoadingApp(true);
        result.current.setError("Error");
      });

      // Reset
      act(() => {
        result.current.resetState();
      });

      expect(result.current.currentApp).toBeNull();
      expect(result.current.showAppSelector).toBe(false);
      expect(result.current.isEmulatorReady).toBe(false);
      expect(result.current.isLoadingApp).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe("useAppStateValue", () => {
    it("should return only state values", () => {
      const { result } = renderHook(() => useAppStateValue(), {
        wrapper: AppStateProvider,
      });

      expect(result.current).toHaveProperty("currentApp");
      expect(result.current).toHaveProperty("showAppSelector");
      expect(result.current).toHaveProperty("isEmulatorReady");
      expect(result.current).toHaveProperty("isLoadingApp");
      expect(result.current).toHaveProperty("error");
      expect(result.current).not.toHaveProperty("setCurrentApp");
    });
  });

  describe("useAppStateActions", () => {
    it("should return only action functions", () => {
      const { result } = renderHook(() => useAppStateActions(), {
        wrapper: AppStateProvider,
      });

      expect(result.current).toHaveProperty("setCurrentApp");
      expect(result.current).toHaveProperty("setShowAppSelector");
      expect(result.current).toHaveProperty("setEmulatorReady");
      expect(result.current).toHaveProperty("setLoadingApp");
      expect(result.current).toHaveProperty("setError");
      expect(result.current).toHaveProperty("resetState");
      expect(result.current).not.toHaveProperty("currentApp");
    });
  });
});
