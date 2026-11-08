/**
 * DosKit - Offline Indicator Component
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * Displays online/offline status and PWA installation prompt
 */

import { useState, useEffect, useCallback, useId, useRef } from 'react';
import { PWA_CONFIG, UI_CONFIG } from '../constants/app';
import { logger } from '../utils/logger';
import { safeLocalStorage } from '../utils/storage';
import './OfflineIndicator.css';

// What the install prompt goes through, logged in development only
const LOG_CONTEXT = 'PWA';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export interface OfflineIndicatorProps {
  onNetworkStatusChange?: (isOnline: boolean) => void;
}

// LocalStorage keys for PWA install prompt state
const STORAGE_KEYS = {
  DISMISSED: 'pwa-install-dismissed',
  DISMISSED_COUNT: 'pwa-install-dismissed-count',
  LAST_DISMISSED: 'pwa-install-last-dismissed',
} as const;

/**
 * A ref for a notice fixed at an edge of the window. The notices stay above the selector
 * (see DosPlayerWithApps.css), so while one is shown its height is kept in a custom
 * property on the root element, and DemoSelector.css fits the selector in the space left.
 */
function keepHeightIn(property: string) {
  return (notice: HTMLElement | null) => {
    if (!notice) return;
    const rootStyle = document.documentElement.style;
    // Reports once the notice is laid out, and again whenever its text wraps differently
    const observer = new ResizeObserver(() => {
      rootStyle.setProperty(property, `${notice.offsetHeight}px`);
    });
    observer.observe(notice);
    return () => {
      observer.disconnect();
      rootStyle.removeProperty(property);
    };
  };
}

const offlineBannerRef = keepHeightIn('--offline-banner-height');
const installPromptRef = keepHeightIn('--install-prompt-height');

/** Whether the page runs as the installed app */
function checkInstalled(): boolean {
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  // iOS Safari has a non-standard 'standalone' property
  const isIOSStandalone =
    'standalone' in window.navigator &&
    (window.navigator as { standalone?: boolean }).standalone === true;

  return isStandalone || (isIOS && isIOSStandalone);
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ onNetworkStatusChange }) => {
  // A page opened offline, which the service worker serves, gets no offline event
  const [showOfflineMessage, setShowOfflineMessage] = useState(() => !navigator.onLine);
  const [showOnlineMessage, setShowOnlineMessage] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(checkInstalled);
  const installTitleId = useId();

  // Use ref to track if we've already scheduled showing the prompt
  const promptScheduledRef = useRef(false);

  /**
   * Check if user has permanently dismissed the install prompt
   */
  const isPermanentlyDismissed = useCallback((): boolean => {
    const dismissed = safeLocalStorage.getItem(STORAGE_KEYS.DISMISSED);
    if (dismissed === 'permanent') {
      return true;
    }

    // Check if user has dismissed too many times
    const dismissCount = parseInt(
      safeLocalStorage.getItem(STORAGE_KEYS.DISMISSED_COUNT) || '0',
      10
    );
    if (dismissCount >= PWA_CONFIG.MAX_INSTALL_DISMISSALS) {
      return true;
    }

    // Check if we're still in cooldown period
    const lastDismissed = safeLocalStorage.getItem(STORAGE_KEYS.LAST_DISMISSED);
    if (lastDismissed) {
      const lastDismissedDate = new Date(lastDismissed);
      const daysSinceDismissal = (Date.now() - lastDismissedDate.getTime()) / PWA_CONFIG.MS_PER_DAY;
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
  }, [isPermanentlyDismissed]);

  // Remove the "Back online" toast once its CSS fade-out has finished. It must
  // leave the DOM explicitly: prefers-reduced-motion disables the fade.
  useEffect(() => {
    if (!showOnlineMessage) return;
    const timer = setTimeout(() => setShowOnlineMessage(false), UI_CONFIG.TOAST_DURATION);
    return () => clearTimeout(timer);
  }, [showOnlineMessage]);

  // Set up event listeners
  useEffect(() => {
    // Online/Offline handlers
    const handleOnline = () => {
      setShowOfflineMessage(false);
      setShowOnlineMessage(true);
      onNetworkStatusChange?.(true);
    };

    const handleOffline = () => {
      setShowOnlineMessage(false);
      setShowOfflineMessage(true);
      onNetworkStatusChange?.(false);
    };

    // PWA install prompt handler
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      logger.info(LOG_CONTEXT, 'beforeinstallprompt event fired');

      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);

      // Only schedule showing the prompt if we haven't already and conditions are met
      if (!promptScheduledRef.current && shouldShowPrompt()) {
        promptScheduledRef.current = true;

        // Show install prompt after a delay (don't be too aggressive)
        setTimeout(() => {
          // Double-check conditions before showing
          if (shouldShowPrompt() && promptEvent) {
            logger.info(LOG_CONTEXT, 'Showing install prompt');
            setShowInstallPrompt(true);
          }
        }, PWA_CONFIG.INSTALL_PROMPT_DELAY);
      } else {
        logger.info(LOG_CONTEXT, 'Install prompt not shown - conditions not met');
      }
    };

    // App installed handler
    const handleAppInstalled = () => {
      logger.info(LOG_CONTEXT, 'App installed');
      setIsInstalled(true);
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
      // Clear dismissal tracking since app is now installed
      safeLocalStorage.removeItem(STORAGE_KEYS.DISMISSED);
      safeLocalStorage.removeItem(STORAGE_KEYS.DISMISSED_COUNT);
      safeLocalStorage.removeItem(STORAGE_KEYS.LAST_DISMISSED);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
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

      if (outcome === 'accepted') {
        logger.info(LOG_CONTEXT, 'User accepted the install prompt');
        // Clear dismissal tracking
        safeLocalStorage.removeItem(STORAGE_KEYS.DISMISSED);
        safeLocalStorage.removeItem(STORAGE_KEYS.DISMISSED_COUNT);
        safeLocalStorage.removeItem(STORAGE_KEYS.LAST_DISMISSED);
      } else {
        logger.info(LOG_CONTEXT, 'User dismissed the install prompt');
        // Track dismissal
        const currentCount = parseInt(
          safeLocalStorage.getItem(STORAGE_KEYS.DISMISSED_COUNT) || '0',
          10
        );
        safeLocalStorage.setItem(STORAGE_KEYS.DISMISSED_COUNT, String(currentCount + 1));
        safeLocalStorage.setItem(STORAGE_KEYS.LAST_DISMISSED, new Date().toISOString());
      }
    } catch (error) {
      console.error('[PWA] Error showing install prompt:', error);
    }

    // Clear the deferred prompt
    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  const handleDismissInstall = () => {
    logger.info(LOG_CONTEXT, 'User dismissed install prompt');
    setShowInstallPrompt(false);

    // Track dismissal
    const currentCount = parseInt(
      safeLocalStorage.getItem(STORAGE_KEYS.DISMISSED_COUNT) || '0',
      10
    );
    const newCount = currentCount + 1;

    safeLocalStorage.setItem(STORAGE_KEYS.DISMISSED_COUNT, String(newCount));
    safeLocalStorage.setItem(STORAGE_KEYS.LAST_DISMISSED, new Date().toISOString());

    // If user has dismissed multiple times, consider it permanent
    if (newCount >= PWA_CONFIG.MAX_INSTALL_DISMISSALS) {
      safeLocalStorage.setItem(STORAGE_KEYS.DISMISSED, 'permanent');
      logger.info(LOG_CONTEXT, `Install prompt permanently dismissed after ${newCount} dismissals`);
    }
  };

  return (
    <>
      {/*
       * The live regions stay in the page, empty while there is nothing to say: screen
       * readers announce what is added to one, but not always a region added with its text.
       * Losing the connection changes which applications can load, so it interrupts (alert);
       * its return needs nothing done, so it waits for a pause (status).
       */}
      <div role="alert">
        {showOfflineMessage && (
          <div className="offline-indicator offline" ref={offlineBannerRef}>
            <div className="offline-content">
              <span className="offline-icon" aria-hidden="true">
                📡
              </span>
              <div className="offline-text">
                <strong>You're offline</strong>
                {/* The service worker keeps an application's archive once it has been opened online */}
                <p>
                  Applications you've opened while online still work. Others need a connection to
                  load.
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
      </div>

      {/* Online Indicator (brief notification after reconnecting) */}
      <div role="status">
        {showOnlineMessage && (
          <div className="online-indicator">
            <span className="online-icon" aria-hidden="true">
              ✓
            </span>
            <span>Back online</span>
          </div>
        )}
      </div>

      {/* Install Prompt, a region of the page that screen readers can go to */}
      {showInstallPrompt && !isInstalled && deferredPrompt && (
        <div
          className="install-prompt"
          ref={installPromptRef}
          role="region"
          aria-labelledby={installTitleId}
        >
          <div className="install-content">
            <div className="install-icon" aria-hidden="true">
              📱
            </div>
            <div className="install-text">
              <strong id={installTitleId}>Install DosKit</strong>
              <p>Install this app for a better experience and offline access.</p>
            </div>
            <div className="install-actions">
              <button className="install-button primary" onClick={handleInstallClick}>
                Install
              </button>
              <button className="install-button secondary" onClick={handleDismissInstall}>
                Not now
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
