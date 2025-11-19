/**
 * DosKit - Network Context
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * Global state management for network connectivity status
 */

import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";

/**
 * Network state interface
 */
export interface NetworkState {
  /** Whether the browser is currently online */
  isOnline: boolean;
  /** Whether to show the offline message */
  showOfflineMessage: boolean;
}

/**
 * Network state actions interface
 */
export interface NetworkActions {
  /** Set offline message visibility */
  setShowOfflineMessage: (show: boolean) => void;
}

/**
 * Combined context value
 */
export interface NetworkContextValue extends NetworkState, NetworkActions {}

const NetworkContext = createContext<NetworkContextValue | undefined>(
  undefined,
);

/**
 * Network Provider Props
 */
export interface NetworkProviderProps {
  children: ReactNode;
}

/**
 * Network Provider
 * Provides global state for network connectivity
 * Automatically listens to browser online/offline events
 */
export function NetworkProvider({ children }: NetworkProviderProps) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOfflineMessage, setShowOfflineMessage] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      if (import.meta.env.DEV) {
        console.log("[NetworkContext] Network status: online");
      }
      setIsOnline(true);
      // Briefly show "back online" message
      setShowOfflineMessage(false);
    };

    const handleOffline = () => {
      if (import.meta.env.DEV) {
        console.log("[NetworkContext] Network status: offline");
      }
      setIsOnline(false);
      setShowOfflineMessage(true);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const value: NetworkContextValue = {
    isOnline,
    showOfflineMessage,
    setShowOfflineMessage,
  };

  return (
    <NetworkContext.Provider value={value}>{children}</NetworkContext.Provider>
  );
}

/**
 * Hook to use network context
 * @throws Error if used outside of NetworkProvider
 */
export function useNetwork(): NetworkContextValue {
  const context = useContext(NetworkContext);
  if (context === undefined) {
    throw new Error("useNetwork must be used within a NetworkProvider");
  }
  return context;
}

/**
 * Hook to use only network state (read-only)
 */
export function useNetworkState(): NetworkState {
  const context = useNetwork();
  return {
    isOnline: context.isOnline,
    showOfflineMessage: context.showOfflineMessage,
  };
}

/**
 * Hook to use only network actions
 */
export function useNetworkActions(): NetworkActions {
  const context = useNetwork();
  return {
    setShowOfflineMessage: context.setShowOfflineMessage,
  };
}
