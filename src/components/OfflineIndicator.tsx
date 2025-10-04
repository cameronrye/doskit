/**
 * DosKit - Offline Indicator Component
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * Displays online/offline status and PWA installation prompt
 */

import { useState, useEffect } from 'react';
import { getCookie, setCookie } from '../utils/cookies';
import './OfflineIndicator.css';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export interface OfflineIndicatorProps {
  onNetworkStatusChange?: (isOnline: boolean) => void;
}

// Cookie name for storing install prompt dismissal
const INSTALL_DISMISSED_COOKIE = 'pwa-install-dismissed';

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
  onNetworkStatusChange
}) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOfflineMessage, setShowOfflineMessage] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    const checkInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      // iOS Safari has a non-standard 'standalone' property
      const isIOSStandalone = 'standalone' in window.navigator && (window.navigator as { standalone?: boolean }).standalone === true;

      setIsInstalled(isStandalone || (isIOS && isIOSStandalone));
    };

    checkInstalled();

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
      setDeferredPrompt(e as BeforeInstallPromptEvent);

      // Check if user has previously dismissed the install prompt
      const isDismissed = getCookie(INSTALL_DISMISSED_COOKIE) === 'true';

      // Show install prompt after a delay (don't be too aggressive)
      // Only show if not already installed and not previously dismissed
      setTimeout(() => {
        if (!isInstalled && !isDismissed) {
          setShowInstallPrompt(true);
        }
      }, 5000);
    };

    // App installed handler
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
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
  }, [isInstalled, onNetworkStatusChange]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      return;
    }

    // Show the install prompt
    await deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('[PWA] User accepted the install prompt');
    } else {
      console.log('[PWA] User dismissed the install prompt');
    }

    // Clear the deferred prompt
    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  const handleDismissInstall = () => {
    setShowInstallPrompt(false);
    // Store dismissal preference in a cookie for 30 days
    setCookie(INSTALL_DISMISSED_COOKIE, 'true', { days: 30 });
  };

  // Don't show install prompt if previously dismissed (check cookie on mount)
  useEffect(() => {
    const isDismissed = getCookie(INSTALL_DISMISSED_COOKIE) === 'true';
    if (isDismissed) {
      setShowInstallPrompt(false);
    }
  }, []);

  return (
    <>
      {/* Offline Indicator */}
      {showOfflineMessage && (
        <div className="offline-indicator offline">
          <div className="offline-content">
            <span className="offline-icon">📡</span>
            <div className="offline-text">
              <strong>You're offline</strong>
              <p>Don't worry, the app will continue to work with cached content.</p>
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
              <p>Install this app for a better experience and offline access.</p>
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

