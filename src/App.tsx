/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 */

import { useState, useEffect } from 'react';
import { DosPlayerWithApps, type DosApp } from './components/DosPlayerWithApps';
import { OfflineIndicator } from './components/OfflineIndicator';
import { ErrorBoundary } from './components/ErrorBoundary';
import { findAppById } from './components/DemoSelector';
import { getAppRequestFromUrl, updateUrlWithApp, updateDocumentTitle } from './utils/urlRouting';
import './App.css';

/** What the URL asks App to show */
interface UrlRoute {
  /** The app to run, or null for the start page */
  app: DosApp | null;
  /** Error banner text when the URL names an app that does not exist */
  error: string | null;
}

function readUrlRoute(): UrlRoute {
  const { appId, unknownAppId } = getAppRequestFromUrl();
  return {
    app: appId ? (findAppById(appId) ?? null) : null,
    error: unknownAppId
      ? `Application "${unknownAppId}" not found. Please select from available applications.`
      : null,
  };
}

/**
 * Set the title for a route, and bring the URL to the form the app pushes without a new
 * history entry: /?app=<id> for an app (also for /stars or ?app=Stars), and no app
 * parameter for an unknown one. Apps reporting in once loaded then find their URL in place.
 */
function applyUrlRoute(route: UrlRoute): void {
  if (route.app) {
    updateUrlWithApp(route.app.id, true);
  } else if (route.error) {
    updateUrlWithApp(null, true);
  }
  updateDocumentTitle(route.app?.name);
}

/** "Author (year)" for the header, or whichever of the two an app gives, or null for neither */
function describeRelease({ author, year }: DosApp): string | null {
  if (author && year) {
    return `${author} (${year})`;
  }
  return author || year?.toString() || null;
}

function App() {
  const [isReady, setIsReady] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // The route the page was loaded with
  const [initialRoute] = useState(readUrlRoute);
  // The app the URL asks for: DosPlayerWithApps runs it, and reports apps picked in the selector
  const [currentApp, setCurrentApp] = useState(initialRoute.app);
  const [showAppSelector, setShowAppSelector] = useState(!initialRoute.app);
  const [urlError, setUrlError] = useState(initialRoute.error);

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

    // Apps requested by a deep link or back/forward report in once loaded, when the URL
    // already shows them; updateUrlWithApp then adds no history entry
    updateUrlWithApp(app?.id || null);

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

  useEffect(() => {
    applyUrlRoute(initialRoute);
  }, [initialRoute]);

  // Browser back/forward: run what the URL asks for, or the default prompt with the selector
  useEffect(() => {
    const handlePopState = () => {
      const route = readUrlRoute();

      if (import.meta.env.DEV) {
        console.log('[App] Popstate event - app from URL:', route.app?.id ?? null);
      }

      applyUrlRoute(route);
      setCurrentApp(route.app);
      setShowAppSelector(!route.app);
      if (route.error) {
        setUrlError(route.error);
      }
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const release = currentApp && describeRelease(currentApp);

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
                {release && <span className="header-app-meta">{release}</span>}
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

        <ErrorBoundary>
          <DosPlayerWithApps
            onReady={handleDosReady}
            onExit={handleDosExit}
            requestedApp={currentApp}
            showSelector={showAppSelector}
            onAppChange={handleAppChange}
            onSelectorVisibilityChange={handleSelectorVisibilityChange}
            className="dos-player"
          />
        </ErrorBoundary>
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
          <a href="https://rye.dev/" target="_blank" rel="noopener noreferrer">
            Cameron Rye
          </a>
        </div>
        <div className="credits">
          Powered by{' '}
          <a href="https://js-dos.com" target="_blank" rel="noopener noreferrer">
            js-dos v{import.meta.env.VITE_JSDOS_VERSION}
          </a>
        </div>
      </footer>
    </div>
  );
}

export default App;
