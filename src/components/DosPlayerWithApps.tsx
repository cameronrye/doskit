/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * DosPlayer with Application Support
 * Enhanced DosPlayer that supports loading different DOS applications
 */

import { useState, useCallback, useEffect, useEffectEvent } from 'react';
import { DosPlayer } from './DosPlayer';
import { DemoSelector, type LoadedApp } from './DemoSelector';
import type { DosApp } from '../types/dos-app';
import type { CommandInterface } from '../types/js-dos';
import type { InitFileEntry } from '../types/js-dos';
import './DosPlayerWithApps.css';

// Re-export types for use in parent components
export type { DosApp, LoadedApp };

interface DosPlayerWithAppsProps {
  onReady?: (ci: CommandInterface) => void;
  onExit?: () => void;
  className?: string;
  showSelector?: boolean;
  /**
   * App to run, such as the one a URL names. Each new value loads that app unless it is
   * already running; null runs the default DOS prompt. Apps picked in the selector run
   * without it.
   */
  requestedApp?: DosApp | null;
  /** Called when an app starts running (picked or requested), and with null after a reset */
  onAppChange?: (app: DosApp | null) => void;
  onSelectorVisibilityChange?: (visible: boolean) => void;
}

/** What the emulator runs: an app with its files, or the default DOS prompt */
interface Session {
  app: DosApp | null;
  files?: InitFileEntry[] | Uint8Array;
  dosboxConf?: string;
}

const DEFAULT_PROMPT: Session = { app: null };

export function DosPlayerWithApps({
  onReady,
  onExit,
  className,
  showSelector = false,
  requestedApp = null,
  onAppChange,
  onSelectorVisibilityChange,
}: DosPlayerWithAppsProps) {
  // Nothing runs until a requested app has loaded, so a deep link never boots the
  // default prompt first
  const [session, setSession] = useState<Session | null>(requestedApp ? null : DEFAULT_PROMPT);
  const [loadingApp, setLoadingApp] = useState<DosApp | null>(requestedApp);
  const [requestedId, setRequestedId] = useState(requestedApp?.id ?? null);
  const [showAppSelector, setShowAppSelector] = useState(showSelector);
  const [error, setError] = useState<string | null>(null);

  // A new request. Adjusting state while rendering instead of in an effect:
  // https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  if ((requestedApp?.id ?? null) !== requestedId) {
    setRequestedId(requestedApp?.id ?? null);
    setError(null);
    if (!requestedApp) {
      setSession(DEFAULT_PROMPT);
    } else if (requestedApp.id !== session?.app?.id) {
      setLoadingApp(requestedApp);
    }
  }

  // Sync showSelector prop with local state
  useEffect(() => {
    setShowAppSelector(showSelector);
  }, [showSelector]);

  const runLoadedApp = useEffectEvent((app: DosApp, files: Session['files'], conf: string) => {
    setSession({ app, files, dosboxConf: conf });
    setLoadingApp(null);
    onAppChange?.(app);
  });

  const showLoadError = useEffectEvent((err: unknown) => {
    console.error('[DosPlayerWithApps] Error loading application:', err);
    setError(err instanceof Error ? err.message : 'Failed to load application');
    setLoadingApp(null);
  });

  // Load the requested app's files and DOSBox config
  useEffect(() => {
    if (!loadingApp) return;

    if (import.meta.env.DEV) {
      console.log('[DosPlayerWithApps] Loading requested app:', loadingApp.name);
    }

    Promise.all([
      loadingApp.loader(),
      loadingApp.loadDosboxConf
        ? loadingApp.loadDosboxConf()
        : Promise.resolve(loadingApp.dosboxConf),
    ]).then(
      ([files, conf]) => runLoadedApp(loadingApp, files, conf),
      (err: unknown) => showLoadError(err)
    );
  }, [loadingApp]);

  const handleSelectApp = useCallback(
    (loadedApp: LoadedApp) => {
      // Files are already loaded by DemoSelector, just set the state
      setSession({ app: loadedApp.app, files: loadedApp.files, dosboxConf: loadedApp.dosboxConf });
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

  const handleReset = useCallback(() => {
    setSession(DEFAULT_PROMPT);
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
          <DemoSelector onSelect={handleSelectApp} onCancel={handleCancelSelector} />
        </>
      )}

      {/* Loading State */}
      {loadingApp && (
        <div className="loading-overlay">
          <div className="loading-spinner" />
          <p>Loading application...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="error-overlay">
          <div className="error-box">
            <h3>Error Loading Application</h3>
            <p>{error}</p>
            <button onClick={handleReset}>Try Again</button>
          </div>
        </div>
      )}

      {/* DOS Player */}
      {session && (
        <DosPlayer
          key={session.app?.id ?? 'default'} // Force remount when app changes
          dosboxConf={session.dosboxConf}
          options={session.app ? { initFs: session.files } : {}}
          onReady={onReady}
          onExit={onExit}
          className="dos-player-instance"
        />
      )}
    </div>
  );
}
