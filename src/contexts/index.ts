/**
 * DosKit - Context Exports
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * Central export point for all context providers and hooks
 */

// App State Context
export {
  AppStateProvider,
  useAppState,
  useAppStateValue,
  useAppStateActions,
  type AppState,
  type AppStateActions,
  type AppStateContextValue,
  type AppStateProviderProps,
} from "./AppStateContext";

// Network Context
export {
  NetworkProvider,
  useNetwork,
  useNetworkState,
  useNetworkActions,
  type NetworkState,
  type NetworkActions,
  type NetworkContextValue,
  type NetworkProviderProps,
} from "./NetworkContext";

// PWA Context
export {
  PWAProvider,
  usePWA,
  usePWAState,
  usePWAActions,
  type PWAState,
  type PWAActions,
  type PWAContextValue,
  type PWAProviderProps,
  type BeforeInstallPromptEvent,
} from "./PWAContext";
