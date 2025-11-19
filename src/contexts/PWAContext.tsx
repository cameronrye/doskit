/**
 * DosKit - PWA Context
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * Global state management for PWA features (install prompt, updates)
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import type { ReactNode } from "react";

/**
 * BeforeInstallPrompt event interface
 */
export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/**
 * PWA state interface
 */
export interface PWAState {
  /** Deferred install prompt event */
  deferredPrompt: BeforeInstallPromptEvent | null;
  /** Whether to show the install prompt UI */
  showInstallPrompt: boolean;
  /** Whether the app is installed as PWA */
  isInstalled: boolean;
  /** Service worker registration for updates */
  updateRegistration: ServiceWorkerRegistration | null;
  /** Whether an update is available */
  hasUpdate: boolean;
}

/**
 * PWA actions interface
 */
export interface PWAActions {
  /** Set the deferred install prompt */
  setDeferredPrompt: (prompt: BeforeInstallPromptEvent | null) => void;
  /** Show or hide the install prompt UI */
  setShowInstallPrompt: (show: boolean) => void;
  /** Set installed state */
  setIsInstalled: (installed: boolean) => void;
  /** Set update registration */
  setUpdateRegistration: (
    registration: ServiceWorkerRegistration | null,
  ) => void;
  /** Dismiss the update notification */
  dismissUpdate: () => void;
}

/**
 * Combined context value
 */
export interface PWAContextValue extends PWAState, PWAActions {}

const PWAContext = createContext<PWAContextValue | undefined>(undefined);

/**
 * PWA Provider Props
 */
export interface PWAProviderProps {
  children: ReactNode;
}

/**
 * PWA Provider
 * Provides global state for PWA features
 */
export function PWAProvider({ children }: PWAProviderProps) {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [updateRegistration, setUpdateRegistration] =
    useState<ServiceWorkerRegistration | null>(null);

  // Check if app is installed on mount
  useEffect(() => {
    const checkInstalled = () => {
      // Check if running in standalone mode (installed PWA)
      const isStandalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as { standalone?: boolean }).standalone === true;

      // Check if installed via related applications API
      const isRelatedApp =
        "getInstalledRelatedApps" in navigator &&
        typeof (
          navigator as { getInstalledRelatedApps?: () => Promise<unknown> }
        ).getInstalledRelatedApps === "function";

      setIsInstalled(isStandalone || isRelatedApp);
    };

    checkInstalled();
  }, []);

  // Listen for beforeinstallprompt event
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);

      if (import.meta.env.DEV) {
        console.log("[PWAContext] Install prompt available");
      }
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setShowInstallPrompt(false);

      if (import.meta.env.DEV) {
        console.log("[PWAContext] App installed");
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const dismissUpdate = useCallback(() => {
    setUpdateRegistration(null);
  }, []);

  const hasUpdate = updateRegistration !== null;

  const value: PWAContextValue = {
    // State
    deferredPrompt,
    showInstallPrompt,
    isInstalled,
    updateRegistration,
    hasUpdate,
    // Actions
    setDeferredPrompt,
    setShowInstallPrompt,
    setIsInstalled,
    setUpdateRegistration,
    dismissUpdate,
  };

  return <PWAContext.Provider value={value}>{children}</PWAContext.Provider>;
}

/**
 * Hook to use PWA context
 * @throws Error if used outside of PWAProvider
 */
export function usePWA(): PWAContextValue {
  const context = useContext(PWAContext);
  if (context === undefined) {
    throw new Error("usePWA must be used within a PWAProvider");
  }
  return context;
}

/**
 * Hook to use only PWA state (read-only)
 */
export function usePWAState(): PWAState {
  const context = usePWA();
  return {
    deferredPrompt: context.deferredPrompt,
    showInstallPrompt: context.showInstallPrompt,
    isInstalled: context.isInstalled,
    updateRegistration: context.updateRegistration,
    hasUpdate: context.hasUpdate,
  };
}

/**
 * Hook to use only PWA actions
 */
export function usePWAActions(): PWAActions {
  const context = usePWA();
  return {
    setDeferredPrompt: context.setDeferredPrompt,
    setShowInstallPrompt: context.setShowInstallPrompt,
    setIsInstalled: context.setIsInstalled,
    setUpdateRegistration: context.setUpdateRegistration,
    dismissUpdate: context.dismissUpdate,
  };
}
