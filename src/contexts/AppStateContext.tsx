/**
 * DosKit - App State Context
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * Global state management for application selection and emulator status
 */

import { createContext, useContext, useState, useCallback } from "react";
import type { ReactNode } from "react";
import type { DosApp } from "../components/DemoSelector";

/**
 * App state interface
 */
export interface AppState {
  /** Currently selected DOS application */
  currentApp: DosApp | null;
  /** Whether the app selector is visible */
  showAppSelector: boolean;
  /** Whether the DOS emulator is ready */
  isEmulatorReady: boolean;
  /** Whether an app is currently loading */
  isLoadingApp: boolean;
  /** Current error message, if any */
  error: string | null;
}

/**
 * App state actions interface
 */
export interface AppStateActions {
  /** Set the currently selected app */
  setCurrentApp: (app: DosApp | null) => void;
  /** Show or hide the app selector */
  setShowAppSelector: (show: boolean) => void;
  /** Set emulator ready state */
  setEmulatorReady: (ready: boolean) => void;
  /** Set app loading state */
  setLoadingApp: (loading: boolean) => void;
  /** Set error message */
  setError: (error: string | null) => void;
  /** Reset all state to initial values */
  resetState: () => void;
}

/**
 * Combined context value
 */
export interface AppStateContextValue extends AppState, AppStateActions {}

const AppStateContext = createContext<AppStateContextValue | undefined>(
  undefined,
);

/**
 * App State Provider Props
 */
export interface AppStateProviderProps {
  children: ReactNode;
  /** Initial app to load (e.g., from URL) */
  initialApp?: DosApp | null;
  /** Initial selector visibility */
  initialShowSelector?: boolean;
}

/**
 * App State Provider
 * Provides global state for app selection and emulator status
 */
export function AppStateProvider({
  children,
  initialApp = null,
  initialShowSelector = false,
}: AppStateProviderProps) {
  const [currentApp, setCurrentApp] = useState<DosApp | null>(initialApp);
  const [showAppSelector, setShowAppSelector] = useState(initialShowSelector);
  const [isEmulatorReady, setEmulatorReady] = useState(false);
  const [isLoadingApp, setLoadingApp] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetState = useCallback(() => {
    setCurrentApp(null);
    setShowAppSelector(false);
    setEmulatorReady(false);
    setLoadingApp(false);
    setError(null);
  }, []);

  const value: AppStateContextValue = {
    // State
    currentApp,
    showAppSelector,
    isEmulatorReady,
    isLoadingApp,
    error,
    // Actions
    setCurrentApp,
    setShowAppSelector,
    setEmulatorReady,
    setLoadingApp,
    setError,
    resetState,
  };

  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  );
}

/**
 * Hook to use app state context
 * @throws Error if used outside of AppStateProvider
 */
export function useAppState(): AppStateContextValue {
  const context = useContext(AppStateContext);
  if (context === undefined) {
    throw new Error("useAppState must be used within an AppStateProvider");
  }
  return context;
}

/**
 * Hook to use only app state (read-only)
 * Useful for components that only need to read state
 */
export function useAppStateValue(): AppState {
  const context = useAppState();
  return {
    currentApp: context.currentApp,
    showAppSelector: context.showAppSelector,
    isEmulatorReady: context.isEmulatorReady,
    isLoadingApp: context.isLoadingApp,
    error: context.error,
  };
}

/**
 * Hook to use only app state actions
 * Useful for components that only need to update state
 */
export function useAppStateActions(): AppStateActions {
  const context = useAppState();
  return {
    setCurrentApp: context.setCurrentApp,
    setShowAppSelector: context.setShowAppSelector,
    setEmulatorReady: context.setEmulatorReady,
    setLoadingApp: context.setLoadingApp,
    setError: context.setError,
    resetState: context.resetState,
  };
}
