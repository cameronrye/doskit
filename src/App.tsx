/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 */

import { useState, useEffect, useRef } from 'react';
import { DosPlayerWithApps, type PlayerStatus } from './components/DosPlayerWithApps';
import { StartPage } from './components/StartPage';
import { OfflineIndicator } from './components/OfflineIndicator';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AppInfo } from './components/AppInfo';
import { availableApps, findAppById } from './config/apps.config';
import type { DosApp } from './types/dos-app';
import type { KindFilter } from './utils/productionFilter';
import { saveStartPageState } from './utils/startPageState';
import {
  getAppRequestFromUrl,
  isPromptUrl,
  updateUrlForPrompt,
  updateUrlWithApp,
  updateDocumentTitle,
} from './utils/urlRouting';
import { keepKeyFromDos, watchKeysAroundDos } from './utils/keysAroundDos';
import './App.css';

/**
 * What the URL asks App to show: the start page, with a notice for a link that named no
 * production; a production; or the plain DOS prompt
 */
type Route =
  | { view: 'start'; notice: string | null }
  | { view: 'app'; app: DosApp }
  | { view: 'prompt' };

function readUrlRoute(): Route {
  if (isPromptUrl()) return { view: 'prompt' };
  const { appId, unknownApp, unknownAppId } = getAppRequestFromUrl();
  const app = appId ? findAppById(appId) : undefined;
  if (app) return { view: 'app', app };
  if (!unknownApp) return { view: 'start', notice: null };
  // A value with no safe characters, or too long to show, is left out of the notice
  return {
    view: 'start',
    notice: unknownAppId
      ? `No production called "${unknownAppId}". Here's everything on DosKit.`
      : `No production by that name. Here's everything on DosKit.`,
  };
}

/** Set the page title of a route */
function setTitleFor(route: Route): void {
  if (route.view === 'app') {
    updateDocumentTitle(route.app.name);
  } else {
    updateDocumentTitle(route.view === 'prompt' ? 'DOS prompt' : undefined);
  }
}

/**
 * Set the title for the route the URL names, and bring the URL to the form the app pushes
 * without a new history entry: /<id> for an app, its own page (also for /?app=stars, an old
 * link, or ?app=Stars), /dos for the prompt (also /DOS/), and the start page for an unknown
 * app. A path that names nothing, such as /index.html, is left as it is.
 */
function applyUrlRoute(route: Route): void {
  if (route.view === 'app') {
    updateUrlWithApp(route.app.id, true);
  } else if (route.view === 'prompt') {
    updateUrlForPrompt(true);
  } else if (route.notice) {
    updateUrlWithApp(null, true);
  }
  setTitleFor(route);
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
 * them, so Tab, Enter and Space work on those controls and keys meant for them never reach
 * the running program; keysAroundDos keeps their releases from it too. Keys pressed
 * in the player, or with nothing focused, still reach DOS.
 */
function keepKeysFromDos(event: React.KeyboardEvent) {
  if (!(event.target instanceof Element && event.target.closest('.dos-player-container'))) {
    keepKeyFromDos(event);
  }
}

/** What the footer's DOS badge shows for each status of the player */
const STATUS_BADGES: Record<PlayerStatus, { className: string; label: string; title: string }> = {
  idle: { className: 'is-idle', label: 'Idle', title: 'No application is running' },
  loading: { className: 'is-loading', label: 'Loading', title: 'Loading DOS emulator' },
  ready: { className: 'ready', label: 'Ready', title: 'DOS emulator is ready' },
  error: {
    className: 'is-error',
    label: 'Error',
    title: 'The application could not be loaded or started',
  },
};

function App() {
  // The route the page was loaded with, and the one it shows
  const [initialRoute] = useState(readUrlRoute);
  const [route, setRoute] = useState(initialRoute);
  // The production DosPlayerWithApps runs, or null for the start page and the DOS prompt
  const currentApp = route.view === 'app' ? route.app : null;
  // Nothing runs on the start page
  const [playerStatus, setPlayerStatus] = useState<PlayerStatus>(
    initialRoute.view === 'start' ? 'idle' : 'loading'
  );
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  // The About panel, for the current app; it closes when the route changes
  const [infoFor, setInfoFor] = useState<DosApp | null>(null);
  const aboutButtonRef = useRef<HTMLButtonElement>(null);
  const showInfo = infoFor !== null && infoFor === currentApp;
  // Closed from the keyboard, the About button gets the focus back; with the mouse, the page
  // keeps it, where keys go to DOS
  const closeInfo = (fromKeyboard: boolean) => {
    setInfoFor(null);
    if (fromKeyboard) {
      aboutButtonRef.current?.focus();
    } else if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  };

  const handleNetworkStatusChange = (online: boolean) => {
    if (import.meta.env.DEV) {
      console.log('[App] Network status changed:', online ? 'online' : 'offline');
    }
    setIsOnline(online);
  };

  /** Show a route: the start page stops what runs, and its status with it */
  const show = (next: Route) => {
    setRoute(next);
    setInfoFor(null);
    if (next.view === 'start') setPlayerStatus('idle');
  };

  /** Go to a route in the app, with a history entry, as a link would */
  const navigate = (next: Route) => {
    if (next.view === 'app') {
      updateUrlWithApp(next.app.id);
    } else if (next.view === 'prompt') {
      updateUrlForPrompt();
    } else {
      updateUrlWithApp(null);
    }
    setTitleFor(next);
    show(next);
  };

  // The start page, with a kind's tab selected when one is given; with none, as it was left
  const handleBrowse = (kind?: KindFilter) => {
    if (kind) saveStartPageState({ kind, query: '', scrollTop: 0, focusId: null });
    navigate({ view: 'start', notice: null });
  };

  useEffect(() => {
    applyUrlRoute(initialRoute);
  }, [initialRoute]);

  // A key's release follows its press, whatever has the focus when it comes up
  useEffect(() => watchKeysAroundDos(), []);

  // Browser back/forward: show what the URL asks for
  useEffect(() => {
    const handlePopState = () => {
      const next = readUrlRoute();

      if (import.meta.env.DEV) {
        console.log('[App] Popstate event - route from URL:', next.view);
      }

      applyUrlRoute(next);
      show(next);
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // Ask before the page goes while an app people make things in runs. Its work lives only
  // in the emulator's memory, and on Windows, Linux and ChromeOS browsers keep keys such as
  // Ctrl+W (Scream Tracker's save) for themselves, so one key press could close the tab.
  // Only once its player is ready: while it downloads, or after it failed, there is nothing
  // to lose.
  const warnBeforeLeaving = (currentApp?.warnBeforeLeaving ?? false) && playerStatus === 'ready';
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

      {route.view === 'start' ? (
        // A page of its own, with its header and footer
        <StartPage
          apps={availableApps}
          notice={route.notice}
          onOpen={(app) => navigate({ view: 'app', app })}
          onOpenPrompt={() => navigate({ view: 'prompt' })}
        />
      ) : (
        <>
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
                {currentApp && (
                  <button
                    ref={aboutButtonRef}
                    className="header-about-button"
                    onClick={() => setInfoFor(currentApp)}
                  >
                    About
                  </button>
                )}
                <button className="header-change-app-button" onClick={() => handleBrowse()}>
                  Browse
                </button>
              </div>
            </div>
          </header>

          {showInfo && <AppInfo app={currentApp} onClose={closeInfo} />}

          <main className="app-main">
            {/* A render error takes the player down with it, and no status comes from it then */}
            <ErrorBoundary onError={() => setPlayerStatus('error')}>
              <DosPlayerWithApps
                requestedApp={currentApp}
                onBrowse={handleBrowse}
                onStatusChange={setPlayerStatus}
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
        </>
      )}
    </div>
  );
}

export default App;
