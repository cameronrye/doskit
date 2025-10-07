/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 */

import { useState, useEffect, useRef } from 'react';
import { DosPlayerWithApps, type DosApp } from './components/DosPlayerWithApps';
import { OfflineIndicator } from './components/OfflineIndicator';
import { findAppById } from './components/DemoSelector';
import {
  getAppIdFromUrl,
  updateUrlWithApp,
  updateDocumentTitle,
} from './utils/urlRouting';
import './App.css';

function App() {
  const [isReady, setIsReady] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [currentApp, setCurrentApp] = useState<DosApp | null>(null);
  const [showAppSelector, setShowAppSelector] = useState(true); // Show selector on initial load
  const [urlError, setUrlError] = useState<string | null>(null);
  const isInitialMount = useRef(true);
  const isHandlingPopState = useRef(false);

  const handleDosReady = () => {
    if (import.meta.env.DEV) {
      console.log('[App] DOS is ready!');
    }
    setIsReady(true);
  };

  const handleDosExit = () => {
    if (import.meta.env.DEV) {
      console.log('[App] DOS exited');
    }
    setIsReady(false);
  };

  const handleNetworkStatusChange = (online: boolean) => {
    if (import.meta.env.DEV) {
      console.log('[App] Network status changed:', online ? 'online' : 'offline');
    }
    setIsOnline(online);
  };

  const handleAppChange = (app: DosApp | null) => {
    if (import.meta.env.DEV) {
      console.log('[App] Application changed:', app?.name || 'none');
    }
    setCurrentApp(app);

    // Update URL when app changes (but not during popstate handling to avoid loops)
    if (!isHandlingPopState.current) {
      updateUrlWithApp(app?.id || null);
    }

    // Update document title
    updateDocumentTitle(app?.name);

    // Clear any URL error when successfully loading an app
    if (app) {
      setUrlError(null);
    }
  };

  const handleSelectorVisibilityChange = (visible: boolean) => {
    if (import.meta.env.DEV) {
      console.log('[App] Selector visibility changed:', visible);
    }
    setShowAppSelector(visible);
  };

  const handleChangeAppClick = () => {
    setShowAppSelector(true);
  };

  // Handle initial URL-based app loading on mount
  useEffect(() => {
    if (!isInitialMount.current) return;
    isInitialMount.current = false;

    const appIdFromUrl = getAppIdFromUrl();

    if (appIdFromUrl) {
      if (import.meta.env.DEV) {
        console.log('[App] Loading app from URL:', appIdFromUrl);
      }

      const app = findAppById(appIdFromUrl);

      if (app) {
        // Valid app ID in URL - hide selector and let DosPlayerWithApps load it
        setShowAppSelector(false);
        setCurrentApp(app);
        updateDocumentTitle(app.name);

        // Trigger app loading by simulating selection
        // The app will be loaded by DosPlayerWithApps when it receives the app change
        setTimeout(() => {
          // This ensures the component is mounted before we try to load
          const event = new CustomEvent('load-app-from-url', { detail: { app } });
          window.dispatchEvent(event);
        }, 100);
      } else {
        // Invalid app ID in URL
        if (import.meta.env.DEV) {
          console.warn('[App] Invalid app ID in URL:', appIdFromUrl);
        }
        setUrlError(`Application "${appIdFromUrl}" not found. Please select from available applications.`);
        setShowAppSelector(true);
        // Clear the invalid app parameter from URL
        updateUrlWithApp(null, true);
      }
    } else {
      // No app in URL - show selector (default behavior)
      updateDocumentTitle();
    }
  }, []);

  // Handle browser back/forward navigation
  useEffect(() => {
    const handlePopState = () => {
      isHandlingPopState.current = true;

      const appIdFromUrl = getAppIdFromUrl();

      if (import.meta.env.DEV) {
        console.log('[App] Popstate event - app ID from URL:', appIdFromUrl);
      }

      if (appIdFromUrl) {
        const app = findAppById(appIdFromUrl);

        if (app) {
          setCurrentApp(app);
          setShowAppSelector(false);
          updateDocumentTitle(app.name);

          // Trigger app loading
          const event = new CustomEvent('load-app-from-url', { detail: { app } });
          window.dispatchEvent(event);
        } else {
          setUrlError(`Application "${appIdFromUrl}" not found.`);
          setShowAppSelector(true);
        }
      } else {
        // No app in URL - show selector
        setCurrentApp(null);
        setShowAppSelector(true);
        updateDocumentTitle();
      }

      // Reset flag after a short delay
      setTimeout(() => {
        isHandlingPopState.current = false;
      }, 100);
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  return (
    <div className="app">
      {/* PWA Offline Indicator and Install Prompt */}
      <OfflineIndicator onNetworkStatusChange={handleNetworkStatusChange} />

      <header className="app-header">
        <div className="header-content">
          <div className="header-left">
            <img src="/logo.svg" alt="DosKit Logo" className="header-logo" />
            <h1>DosKit</h1>
          </div>
          {currentApp && (
            <div className="header-center">
              <div className="header-app-info">
                <span className="header-app-name">{currentApp.name}</span>
                {currentApp.author && currentApp.year && (
                  <span className="header-app-meta">
                    {currentApp.author} ({currentApp.year})
                  </span>
                )}
              </div>
            </div>
          )}
          <div className="header-right">
            <button className="header-change-app-button" onClick={handleChangeAppClick}>
              {currentApp ? 'Change Application' : 'Select Application'}
            </button>
          </div>
        </div>
      </header>

      <main className="app-main">
        {/* URL Error Message */}
        {urlError && (
          <div className="url-error-banner">
            <span className="error-icon">⚠️</span>
            <span className="error-message">{urlError}</span>
            <button
              className="error-dismiss"
              onClick={() => setUrlError(null)}
              aria-label="Dismiss error"
            >
              ✕
            </button>
          </div>
        )}

        <DosPlayerWithApps
          onReady={handleDosReady}
          onExit={handleDosExit}
          showSelector={showAppSelector}
          onAppChange={handleAppChange}
          onSelectorVisibilityChange={handleSelectorVisibilityChange}
          className="dos-player"
        />
      </main>

      <footer className="app-footer">
        <div className="info">
          <div className="status-indicators">
            {/* DOS Status */}
            {isReady ? (
              <span className="status-badge ready" title="DOS emulator is ready">
                <span className="status-dot"></span>
                <span>Ready</span>
              </span>
            ) : (
              <span className="status-badge loading" title="Loading DOS emulator">
                <span className="status-dot"></span>
                <span>Loading</span>
              </span>
            )}

            {/* Network Status */}
            <span
              className={`status-badge ${isOnline ? 'online' : 'offline'}`}
              title={isOnline ? 'Connected to internet' : 'No internet connection'}
            >
              <span className="status-dot"></span>
              <span>{isOnline ? 'Online' : 'Offline'}</span>
            </span>
          </div>
        </div>
        <div className="made-with">
          Made with <span className="heart">❤️</span> by{' '}
          <a
            href="https://rye.dev/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Cameron Rye
          </a>
        </div>
        <div className="credits">
          Powered by{' '}
          <a
            href="https://js-dos.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            js-dos v8.3.20
          </a>
        </div>
      </footer>
    </div>
  );
}

export default App;
