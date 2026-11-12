/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * DosPlayer with Application Support
 * Enhanced DosPlayer that supports loading different DOS applications
 */

import { useState, useCallback, useEffect, useEffectEvent, useReducer, useRef } from 'react';
import { DosPlayer } from './DosPlayer';
import { DemoSelector, type LoadedApp } from './DemoSelector';
import type { DosApp } from '../types/dos-app';
import type { CommandInterface } from '../types/js-dos';
import type { PlayerHandle } from '../hooks/useDosEmulator';
import { getUserFriendlyError } from '../utils/errorMessages';
import { endMarkerFor, withEndMarker } from '../utils/endMarker';
import {
  initialPlayerState,
  playerReducer,
  sessionOf,
  statusOf,
  type PlayerStatus,
} from './playerSession';
import './DosPlayerWithApps.css';

export type { PlayerStatus } from './playerSession';

interface DosPlayerWithAppsProps {
  onReady?: (ci: CommandInterface) => void;
  onExit?: () => void;
  className?: string;
  showSelector?: boolean;
  /**
   * App to run, such as the one a URL names. Each new value stops what is running and loads
   * that app, unless it is already running; null runs the default DOS prompt, or nothing while
   * the selector is open. Apps picked in the selector run without it.
   */
  requestedApp?: DosApp | null;
  /**
   * Called when an app starts running (picked or requested), and with null when Choose
   * Another Application after a failed load, or Cancel during one, returns to the selector
   */
  onAppChange?: (app: DosApp | null) => void;
  onSelectorVisibilityChange?: (visible: boolean) => void;
  /** Called with the status on mount, and again whenever it changes */
  onStatusChange?: (status: PlayerStatus) => void;
  /** A notice for the selector to show above the disks, such as a link that named no app */
  selectorNotice?: string | null;
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
  selectorNotice = null,
}: DosPlayerWithAppsProps) {
  const [state, dispatch] = useReducer(
    playerReducer,
    { requestedApp, showSelector },
    initialPlayerState
  );
  const session = sessionOf(state);
  const loadingApp = state.phase.kind === 'loading' ? state.phase.app : null;
  const error = state.phase.kind === 'error' ? state.phase.error : null;
  const showAppSelector = state.selectorOpen;
  const tryAgainRef = useRef<HTMLButtonElement>(null);
  // The running session's emulator, once js-dos has handed it out
  const [handed, setHanded] = useState<{ sessionId: number; handle: PlayerHandle } | null>(null);
  const handle = handed && handed.sessionId === session?.id ? handed.handle : null;

  const status = statusOf(state);
  const reportStatus = useEffectEvent((current: PlayerStatus) => onStatusChange?.(current));
  useEffect(() => {
    reportStatus(status);
  }, [status]);

  // The parent's props, adjusted for while rendering instead of in an effect: the selector's
  // prop first, so that a request for no app sees whether the selector is open. A new
  // request supersedes any load still running for an earlier one, and a request for the app
  // already running changes nothing.
  // https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  if (showSelector !== state.shownBy) {
    dispatch({ type: 'selectorProp', open: showSelector });
  }
  if ((requestedApp?.id ?? null) !== state.requestedId) {
    dispatch({ type: 'requested', app: requestedApp });
  }

  const reportAppRunning = useEffectEvent((app: DosApp) => onAppChange?.(app));

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
        if (controller.signal.aborted) return;
        dispatch({ type: 'loaded', app: loadingApp, files, dosboxConf: conf });
        reportAppRunning(loadingApp);
      },
      (err: unknown) => {
        if (controller.signal.aborted) return;
        console.error('[DosPlayerWithApps] Error loading application:', err);
        dispatch({
          type: 'loadFailed',
          app: loadingApp,
          error: getUserFriendlyError(err, { online: navigator.onLine }),
        });
      }
    );
    return () => controller.abort();
  }, [loadingApp]);

  // Nobody watches the running app while the selector covers it: pause it there, sound and
  // all, and let it go on once the selector closes. Through the player: js-dos undoes
  // ci.pause() when the tab is hidden and shown again.
  const pausedRef = useRef(false);
  useEffect(() => {
    if (!handle || pausedRef.current === showAppSelector) return;
    pausedRef.current = showAppSelector;
    handle.player.setPaused(showAppSelector);
  }, [handle, showAppSelector]);
  useEffect(() => {
    pausedRef.current = false;
  }, [handle]);

  // An app's autoexec prints its end marker once its program returns to DOS
  const sessionApp = session?.app ?? null;
  const endMarker = sessionApp ? endMarkerFor(sessionApp.name) : null;
  // Read once, as the session's player starts
  const sessionConf =
    session?.dosboxConf && endMarker
      ? withEndMarker(session.dosboxConf, endMarker)
      : session?.dosboxConf;
  useEffect(() => {
    if (!handle || !endMarker || !session) return;
    const sessionId = session.id;
    return handle.stdout.subscribe((line) => {
      if (line.includes(endMarker)) dispatch({ type: 'ended', sessionId });
    });
  }, [handle, endMarker, session]);

  const handleSelectApp = useCallback(
    (loadedApp: LoadedApp) => {
      // Files are already loaded by DemoSelector. The user's pick wins over a requested
      // app still loading, and starts the app again if it is the one running.
      dispatch({
        type: 'picked',
        app: loadedApp.app,
        files: loadedApp.files,
        dosboxConf: loadedApp.dosboxConf,
      });
      onAppChange?.(loadedApp.app);
      onSelectorVisibilityChange?.(false);
    },
    [onAppChange, onSelectorVisibilityChange]
  );

  const handleCancelSelector = useCallback(() => {
    dispatch({ type: 'selectorCancelled' });
    onSelectorVisibilityChange?.(false);
  }, [onSelectorVisibilityChange]);

  // Try Again: load the app that failed once more, behind the loading overlay
  const handleRetry = useCallback((app: DosApp) => {
    dispatch({ type: 'retried', app });
  }, []);

  // Choose Another Application, and Cancel while a requested app loads, which stops the
  // load: the selector, with nothing running under it
  const handleChooseAnother = useCallback(() => {
    dispatch({ type: 'choseAnother' });
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
            key={state.requestedId ?? 'none'}
            onSelect={handleSelectApp}
            onCancel={handleCancelSelector}
            notice={selectorNotice}
          />
        </>
      )}

      {/* Loading State: screen readers announce its message, not the button with it */}
      {loadingApp && (
        <div className="loading-overlay">
          <div className="dos-app-loading-spinner" aria-hidden="true" />
          <p role="status">Loading application...</p>
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
          dosboxConf={sessionConf}
          options={session.app ? { initFs: session.files } : {}}
          onReady={(ci) => {
            dispatch({ type: 'started', sessionId: session.id, status: 'ready' });
            onReady?.(ci);
          }}
          onHandle={(handle) => setHanded({ sessionId: session.id, handle })}
          onExit={() => {
            dispatch({ type: 'exited', sessionId: session.id });
            onExit?.();
          }}
          onError={() => dispatch({ type: 'started', sessionId: session.id, status: 'error' })}
          className="dos-player-instance"
        />
      )}
    </div>
  );
}
