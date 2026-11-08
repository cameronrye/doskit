/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * DosPlayer with Application Support
 * Enhanced DosPlayer that supports loading different DOS applications
 */

import { useState, useCallback, useEffect, useEffectEvent, useRef } from 'react';
import { DosPlayer } from './DosPlayer';
import { DemoSelector, type LoadedApp } from './DemoSelector';
import type { DosApp } from '../types/dos-app';
import type { CommandInterface } from '../types/js-dos';
import type { InitFileEntry } from '../types/js-dos';
import { getUserFriendlyError, type FriendlyError } from '../utils/errorMessages';
import './DosPlayerWithApps.css';

// Re-export the app type for use in parent components
export type { DosApp };

interface DosPlayerWithAppsProps {
  onReady?: (ci: CommandInterface) => void;
  onExit?: () => void;
  className?: string;
  showSelector?: boolean;
  /**
   * App to run, such as the one a URL names. Each new value stops what is running and loads
   * that app, unless it is already running; null runs the default DOS prompt. Apps picked in
   * the selector run without it.
   */
  requestedApp?: DosApp | null;
  /**
   * Called when an app starts running (picked or requested), and with null when Choose
   * Another Application after a failed load, or Cancel during one, returns to the default
   * DOS prompt
   */
  onAppChange?: (app: DosApp | null) => void;
  onSelectorVisibilityChange?: (visible: boolean) => void;
  /** Called with the status on mount, and again whenever it changes */
  onStatusChange?: (status: PlayerStatus) => void;
}

/**
 * How the player is doing: 'loading' while an app downloads or its emulator starts, and
 * after DOS has exited until the next start; 'ready' once js-dos reports the emulator
 * ready; 'error' while the load error or the emulator's start error shows
 */
export type PlayerStatus = 'loading' | 'ready' | 'error';

/** What the emulator runs: an app with its files, or the default DOS prompt */
interface Session {
  /** Tells the sessions apart: each one starts its own player */
  id: number;
  app: DosApp | null;
  files?: InitFileEntry[] | Uint8Array;
  dosboxConf?: string;
}

/** A requested app that failed to load: what the error overlay says, and the app to retry */
interface LoadError extends FriendlyError {
  app: DosApp;
}

const DEFAULT_PROMPT: Session = { id: 0, app: null };

/** The id of the last session newSession() made */
let lastSessionId = 0;

/**
 * A session with an id of its own, so that it starts a new player even for the app already
 * running: picking that app runs it again, such as a demo that has ended at the DOS prompt
 */
function newSession(app: DosApp | null, files?: Session['files'], dosboxConf?: string): Session {
  lastSessionId += 1;
  return { id: lastSessionId, app, files, dosboxConf };
}

export function DosPlayerWithApps({
  onReady,
  onExit,
  className,
  showSelector = false,
  requestedApp = null,
  onAppChange,
  onSelectorVisibilityChange,
  onStatusChange,
}: DosPlayerWithAppsProps) {
  // Nothing runs while a requested app loads: a deep link never boots the default prompt
  // first, and the app or prompt that was running stops, sound and all, as the load starts
  const [session, setSession] = useState<Session | null>(requestedApp ? null : DEFAULT_PROMPT);
  const [loadingApp, setLoadingApp] = useState<DosApp | null>(requestedApp);
  const [requestedId, setRequestedId] = useState(requestedApp?.id ?? null);
  const [showAppSelector, setShowAppSelector] = useState(showSelector);
  const [error, setError] = useState<LoadError | null>(null);
  // What became of the session's emulator, once it is ready or has failed to start
  const [started, setStarted] = useState<{
    session: Session;
    status: 'ready' | 'error';
  } | null>(null);
  const tryAgainRef = useRef<HTMLButtonElement>(null);

  // A new session is loading until its own emulator is ready
  const status: PlayerStatus = error
    ? 'error'
    : session && started?.session === session
      ? started.status
      : 'loading';

  const reportStatus = useEffectEvent((current: PlayerStatus) => onStatusChange?.(current));
  useEffect(() => {
    reportStatus(status);
  }, [status]);

  // A new request supersedes any load still running for an earlier one, and a request for
  // the app already running changes nothing. Adjusting state while rendering instead of in
  // an effect:
  // https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  if ((requestedApp?.id ?? null) !== requestedId) {
    setRequestedId(requestedApp?.id ?? null);
    setError(null);
    if (!requestedApp) {
      setLoadingApp(null);
      // A DOS prompt already running, such as Choose Another Application's, goes on running
      if (session?.app !== null) setSession(DEFAULT_PROMPT);
    } else if (requestedApp.id === session?.app?.id) {
      setLoadingApp(null);
    } else {
      setLoadingApp(requestedApp);
      setSession(null);
    }
  }

  // Sync showSelector prop with local state
  useEffect(() => {
    setShowAppSelector(showSelector);
  }, [showSelector]);

  const runLoadedApp = useEffectEvent((app: DosApp, files: Session['files'], conf: string) => {
    setSession(newSession(app, files, conf));
    setLoadingApp(null);
    onAppChange?.(app);
  });

  const showLoadError = useEffectEvent((app: DosApp, err: unknown) => {
    console.error('[DosPlayerWithApps] Error loading application:', err);
    setError({ ...getUserFriendlyError(err, { online: navigator.onLine }), app });
    setLoadingApp(null);
  });

  // Give Try Again the keyboard focus when the error appears, and when the selector over it
  // closes, without taking the focus from an open selector
  useEffect(() => {
    if (error && !showAppSelector) tryAgainRef.current?.focus();
  }, [error, showAppSelector]);

  // Load the requested app's files and DOSBox config. A newer request, a pick in the
  // selector or unmounting changes loadingApp, which aborts this load and drops its result.
  useEffect(() => {
    if (!loadingApp) return;

    if (import.meta.env.DEV) {
      console.log('[DosPlayerWithApps] Loading requested app:', loadingApp.name);
    }

    const controller = new AbortController();
    Promise.all([
      loadingApp.loader(undefined, controller.signal),
      loadingApp.loadDosboxConf
        ? loadingApp.loadDosboxConf()
        : Promise.resolve(loadingApp.dosboxConf),
    ]).then(
      ([files, conf]) => {
        if (!controller.signal.aborted) runLoadedApp(loadingApp, files, conf);
      },
      (err: unknown) => {
        if (!controller.signal.aborted) showLoadError(loadingApp, err);
      }
    );
    return () => controller.abort();
  }, [loadingApp]);

  const handleSelectApp = useCallback(
    (loadedApp: LoadedApp) => {
      // Files are already loaded by DemoSelector. The user's pick wins over a requested
      // app still loading, and starts the app again if it is the one running.
      setLoadingApp(null);
      setError(null);
      setSession(newSession(loadedApp.app, loadedApp.files, loadedApp.dosboxConf));
      setShowAppSelector(false);
      onAppChange?.(loadedApp.app);
      onSelectorVisibilityChange?.(false);
    },
    [onAppChange, onSelectorVisibilityChange]
  );

  const handleCancelSelector = useCallback(() => {
    setShowAppSelector(false);
    onSelectorVisibilityChange?.(false);
  }, [onSelectorVisibilityChange]);

  // Try Again: load the app that failed once more, behind the loading overlay
  const handleRetry = useCallback((app: DosApp) => {
    setError(null);
    setLoadingApp(app);
  }, []);

  // Choose Another Application, and Cancel while a requested app loads, which stops the
  // load: the default DOS prompt, with the selector open over it
  const handleChooseAnother = useCallback(() => {
    setSession(newSession(null));
    setLoadingApp(null);
    setError(null);
    setShowAppSelector(true);
    onAppChange?.(null);
    onSelectorVisibilityChange?.(true);
  }, [onAppChange, onSelectorVisibilityChange]);

  return (
    <div className={`dos-player-with-apps ${className || ''}`}>
      {/* Application Selector Modal */}
      {showAppSelector && (
        <>
          <div className="selector-overlay" onClick={handleCancelSelector} />
          {/* A new request remounts the selector, which aborts a download it still runs */}
          <DemoSelector
            key={requestedId ?? 'none'}
            onSelect={handleSelectApp}
            onCancel={handleCancelSelector}
          />
        </>
      )}

      {/* Loading State, which screen readers announce */}
      {loadingApp && (
        <div className="loading-overlay" role="status">
          <div className="dos-app-loading-spinner" />
          <p>Loading application...</p>
          <button onClick={handleChooseAnother}>Cancel</button>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="error-overlay">
          <div className="error-box" role="alert">
            <h3>Error Loading Application</h3>
            <p>{error.message}</p>
            {error.suggestion && <p className="error-suggestion">{error.suggestion}</p>}
            {error.originalError && (
              <details className="error-details">
                <summary>Details</summary>
                <code>{error.originalError}</code>
              </details>
            )}
            <div className="error-actions">
              <button ref={tryAgainRef} onClick={() => handleRetry(error.app)}>
                Try Again
              </button>
              <button className="error-secondary-action" onClick={handleChooseAnother}>
                Choose Another Application
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DOS Player */}
      {session && (
        <DosPlayer
          key={session.id} // A new session starts a new player
          dosboxConf={session.dosboxConf}
          options={session.app ? { initFs: session.files } : {}}
          onReady={(ci) => {
            setStarted({ session, status: 'ready' });
            onReady?.(ci);
          }}
          onExit={() => {
            setStarted(null);
            onExit?.();
          }}
          onError={() => setStarted({ session, status: 'error' })}
          className="dos-player-instance"
        />
      )}
    </div>
  );
}
