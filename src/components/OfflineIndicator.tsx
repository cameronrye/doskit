/**
 * DosKit - Offline Indicator Component
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * Displays online/offline status and PWA installation prompt
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { PWA_CONFIG } from "../constants/app";
import "./OfflineIndicator.css";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export interface OfflineIndicatorProps {
  onNetworkStatusChange?: (isOnline: boolean) => void;
}

// LocalStorage keys for PWA install prompt state
const STORAGE_KEYS = {
  DISMISSED: "pwa-install-dismissed",
  DISMISSED_COUNT: "pwa-install-dismissed-count",
  LAST_DISMISSED: "pwa-install-last-dismissed",
} as const;

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
  onNetworkStatusChange,
}) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOfflineMessage, setShowOfflineMessage] = useState(false);
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  // Use ref to track if we've already scheduled showing the prompt
  const promptScheduledRef = useRef(false);

  /**
   * Check if the app is already installed
   */
  const checkInstalled = useCallback(() => {
    const isStandalone = window.matchMedia(
      "(display-mode: standalone)",
    ).matches;
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    // iOS Safari has a non-standard 'standalone' property
    const isIOSStandalone =
      "standalone" in window.navigator &&
      (window.navigator as { standalone?: boolean }).standalone === true;

    return isStandalone || (isIOS && isIOSStandalone);
  }, []);

  /**
   * Check if user has permanently dismissed the install prompt
   */
  const isPermanentlyDismissed = useCallback((): boolean => {
    const dismissed = localStorage.getItem(STORAGE_KEYS.DISMISSED);
    if (dismissed === "permanent") {
      return true;
    }

    // Check if user has dismissed too many times
    const dismissCount = parseInt(
      localStorage.getItem(STORAGE_KEYS.DISMISSED_COUNT) || "0",
      10,
    );
    if (dismissCount >= PWA_CONFIG.MAX_INSTALL_DISMISSALS) {
      return true;
    }

    // Check if we're still in cooldown period
    const lastDismissed = localStorage.getItem(STORAGE_KEYS.LAST_DISMISSED);
    if (lastDismissed) {
      const lastDismissedDate = new Date(lastDismissed);
      const daysSinceDismissal =
        (Date.now() - lastDismissedDate.getTime()) / PWA_CONFIG.MS_PER_DAY;
      if (daysSinceDismissal < PWA_CONFIG.INSTALL_DISMISSAL_COOLDOWN_DAYS) {
        return true;
      }
    }

    return false;
  }, []);

  /**
   * Check if we should show the install prompt
   */
  const shouldShowPrompt = useCallback((): boolean => {
    // Don't show if already installed
    if (checkInstalled()) {
      return false;
    }

    // Don't show if permanently dismissed
    if (isPermanentlyDismissed()) {
      return false;
    }

    return true;
  }, [checkInstalled, isPermanentlyDismissed]);

  // Initialize installed state
  useEffect(() => {
    setIsInstalled(checkInstalled());
  }, [checkInstalled]);

  // Set up event listeners
  useEffect(() => {
    // Online/Offline handlers
    const handleOnline = () => {
      setIsOnline(true);
      setShowOfflineMessage(false);
      onNetworkStatusChange?.(true);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineMessage(true);
      onNetworkStatusChange?.(false);
    };

    // PWA install prompt handler
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      console.log("[PWA] beforeinstallprompt event fired");

      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);

      // Only schedule showing the prompt if we haven't already and conditions are met
      if (!promptScheduledRef.current && shouldShowPrompt()) {
        promptScheduledRef.current = true;

        // Show install prompt after a delay (don't be too aggressive)
        setTimeout(() => {
          // Double-check conditions before showing
          if (shouldShowPrompt() && promptEvent) {
            console.log("[PWA] Showing install prompt");
            setShowInstallPrompt(true);
          }
        }, PWA_CONFIG.INSTALL_PROMPT_DELAY);
      } else {
        console.log("[PWA] Install prompt not shown - conditions not met");
      }
    };

    // App installed handler
    const handleAppInstalled = () => {
      console.log("[PWA] App installed");
      setIsInstalled(true);
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
      // Clear dismissal tracking since app is now installed
      localStorage.removeItem(STORAGE_KEYS.DISMISSED);
      localStorage.removeItem(STORAGE_KEYS.DISMISSED_COUNT);
      localStorage.removeItem(STORAGE_KEYS.LAST_DISMISSED);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, [onNetworkStatusChange, shouldShowPrompt]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      return;
    }

    try {
      // Show the install prompt
      await deferredPrompt.prompt();

      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === "accepted") {
        console.log("[PWA] User accepted the install prompt");
        // Clear dismissal tracking
        localStorage.removeItem(STORAGE_KEYS.DISMISSED);
        localStorage.removeItem(STORAGE_KEYS.DISMISSED_COUNT);
        localStorage.removeItem(STORAGE_KEYS.LAST_DISMISSED);
      } else {
        console.log("[PWA] User dismissed the install prompt");
        // Track dismissal
        const currentCount = parseInt(
          localStorage.getItem(STORAGE_KEYS.DISMISSED_COUNT) || "0",
          10,
        );
        localStorage.setItem(
          STORAGE_KEYS.DISMISSED_COUNT,
          String(currentCount + 1),
        );
        localStorage.setItem(
          STORAGE_KEYS.LAST_DISMISSED,
          new Date().toISOString(),
        );
      }
    } catch (error) {
      console.error("[PWA] Error showing install prompt:", error);
    }

    // Clear the deferred prompt
    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  const handleDismissInstall = () => {
    console.log("[PWA] User dismissed install prompt");
    setShowInstallPrompt(false);

    // Track dismissal
    const currentCount = parseInt(
      localStorage.getItem(STORAGE_KEYS.DISMISSED_COUNT) || "0",
      10,
    );
    const newCount = currentCount + 1;

    localStorage.setItem(STORAGE_KEYS.DISMISSED_COUNT, String(newCount));
    localStorage.setItem(STORAGE_KEYS.LAST_DISMISSED, new Date().toISOString());

    // If user has dismissed multiple times, consider it permanent
    if (newCount >= PWA_CONFIG.MAX_INSTALL_DISMISSALS) {
      localStorage.setItem(STORAGE_KEYS.DISMISSED, "permanent");
      console.log(
        "[PWA] Install prompt permanently dismissed after",
        newCount,
        "dismissals",
      );
    }
  };

  return (
    <>
      {/* Offline Indicator */}
      {showOfflineMessage && (
        <div className="offline-indicator offline">
          <div className="offline-content">
            <span className="offline-icon">📡</span>
            <div className="offline-text">
              <strong>You're offline</strong>
              <p>
                Don't worry, the app will continue to work with cached content.
              </p>
            </div>
            <button
              className="offline-close"
              onClick={() => setShowOfflineMessage(false)}
              aria-label="Close offline message"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Online Indicator (brief notification) */}
      {isOnline && showOfflineMessage === false && (
        <div className="online-indicator">
          <span className="online-icon">✓</span>
          <span>Back online</span>
        </div>
      )}

      {/* Install Prompt */}
      {showInstallPrompt && !isInstalled && deferredPrompt && (
        <div className="install-prompt">
          <div className="install-content">
            <div className="install-icon">📱</div>
            <div className="install-text">
              <strong>Install DosKit</strong>
              <p>
                Install this app for a better experience and offline access.
              </p>
            </div>
            <div className="install-actions">
              <button
                className="install-button primary"
                onClick={handleInstallClick}
              >
                Install
              </button>
              <button
                className="install-button secondary"
                onClick={handleDismissInstall}
              >
                Not now
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
