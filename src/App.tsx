/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 */

import { useState, useEffect } from 'react';
import { DosPlayerWithApps, type PlayerStatus } from './components/DosPlayerWithApps';
import { OfflineIndicator } from './components/OfflineIndicator';
import { ErrorBoundary } from './components/ErrorBoundary';
import { findAppById } from './config/apps.config';
import type { DosApp } from './types/dos-app';
import { getAppRequestFromUrl, updateUrlWithApp, updateDocumentTitle } from './utils/urlRouting';
import { keepKeyFromDos, watchKeysAroundDos } from './utils/keysAroundDos';
import './App.css';

/** What the URL asks App to show */
interface UrlRoute {
  /** The app to run, or null for the start page */
  app: DosApp | null;
  /** What the selector tells the user when the URL's ?app= parameter names no app */
  error: string | null;
}

function readUrlRoute(): UrlRoute {
  const { appId, unknownApp, unknownAppId } = getAppRequestFromUrl();
  // A value with no safe characters, or too long to show, is left out of the message
  const named = unknownAppId ? ` "${unknownAppId}"` : '';
  return {
    app: appId ? (findAppById(appId) ?? null) : null,
    error: unknownApp
      ? `Application${named} not found. Please select from available applications.`
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

/**
 * js-dos listens for keys on window, sends each one to DOS and cancels the browser's own
 * handling of it. Keys pressed on DosKit's own controls stop here, once React has handled
 * them, so Tab, Enter and Space work on those controls and keys meant for the selector never
 * reach the running program; keysAroundDos keeps their releases from it too. Keys pressed
 * in the player, or with nothing focused, still reach DOS.
 */
function keepKeysFromDos(event: React.KeyboardEvent) {
  if (!(event.target instanceof Element && event.target.closest('.dos-player-container'))) {
    keepKeyFromDos(event);
  }
}

/** What the footer's DOS badge shows for each status of the player */
const STATUS_BADGES: Record<PlayerStatus, { className: string; label: string; title: string }> = {
  loading: { className: 'is-loading', label: 'Loading', title: 'Loading DOS emulator' },
  ready: { className: 'ready', label: 'Ready', title: 'DOS emulator is ready' },
  error: {
    className: 'is-error',
    label: 'Error',
    title: 'The application could not be loaded or started',
  },
};

function App() {
  const [playerStatus, setPlayerStatus] = useState<PlayerStatus>('loading');
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // The route the page was loaded with
  const [initialRoute] = useState(readUrlRoute);
  // The app the URL asks for: DosPlayerWithApps runs it, and reports apps picked in the selector
  const [currentApp, setCurrentApp] = useState(initialRoute.app);
  const [showAppSelector, setShowAppSelector] = useState(!initialRoute.app);
  const [urlError, setUrlError] = useState(initialRoute.error);

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
    // The selector showed the URL's error: it has been seen once the selector closes
    if (!visible) {
      setUrlError(null);
    }
  };

  const handleChangeAppClick = () => {
    setShowAppSelector(true);
  };

  useEffect(() => {
    applyUrlRoute(initialRoute);
  }, [initialRoute]);

  // A key's release follows its press, whatever has the focus when it comes up
  useEffect(() => watchKeysAroundDos(), []);

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

  // Ask before the page goes while an app people make things in runs. Its work lives only
  // in the emulator's memory, and browsers keep keys such as Ctrl+W (Scream Tracker's save)
  // for themselves, so one key press could close the tab.
  const warnBeforeLeaving = currentApp?.warnBeforeLeaving ?? false;
  useEffect(() => {
    if (!warnBeforeLeaving) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      // Chrome and Edge before 119 ask only when returnValue is set
      event.returnValue = true;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [warnBeforeLeaving]);

  const release = currentApp && describeRelease(currentApp);
  const statusBadge = STATUS_BADGES[playerStatus];

  return (
    <div className="app" onKeyDown={keepKeysFromDos}>
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
        <ErrorBoundary>
          <DosPlayerWithApps
            requestedApp={currentApp}
            showSelector={showAppSelector}
            onAppChange={handleAppChange}
            onSelectorVisibilityChange={handleSelectorVisibilityChange}
            onStatusChange={setPlayerStatus}
            // An unknown app in the URL opens the selector, which says so above the disks
            selectorNotice={urlError}
            className="dos-player"
          />
        </ErrorBoundary>
      </main>

      <footer className="app-footer">
        <div className="info">
          {/* A polite live region: screen readers announce each change of the badges */}
          <div className="status-indicators" role="status">
            {/* DOS Status */}
            <span className={`status-badge ${statusBadge.className}`} title={statusBadge.title}>
              <span className="status-dot"></span>
              <span>{statusBadge.label}</span>
            </span>

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
          <span className="credits-js-dos">
            Powered by{' '}
            <a href="https://js-dos.com" target="_blank" rel="noopener noreferrer">
              js-dos v{import.meta.env.VITE_JSDOS_VERSION}
            </a>
            <span aria-hidden="true"> · </span>
          </span>
          {/* The GPL notices of js-dos and DOSBox, which DosKit ships */}
          <a href="/licenses/" target="_blank" rel="noopener noreferrer">
            Licenses
          </a>
        </div>
      </footer>
    </div>
  );
}

export default App;
