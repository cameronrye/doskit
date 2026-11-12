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
import { runStartRecipe, type RecipeEmulator, type RecipeState } from '../utils/startRecipe';
import { createPersistQueue } from '../utils/persistQueue';
import { getSavedFiles, putSavedFiles, removeSavedFiles } from '../utils/savedFiles';
import { dosNameFor, zipEntryNames } from '../utils/dosNames';
import { TrackerFiles } from './TrackerFiles';
import { fnv1a } from '../utils/frameHash';
import {
  initialPlayerState,
  playerReducer,
  posterOf,
  preparingOf,
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

/**
 * Whether the page has a click or key press of the last few seconds to start sound with.
 * Browsers start sound only within a few seconds of one (Safari after about 5), and a demo
 * opened from a link has none: it waits on the Play screen for the click that starts it.
 */
function hasFreshActivation(): boolean {
  return navigator.userActivation?.isActive ?? false;
}

/** What the start keys need of a running emulator */
function recipeEmulatorOf(handle: PlayerHandle): RecipeEmulator {
  return {
    stdout: handle.stdout,
    messages: handle.messages,
    onFrame: (listener) => handle.ci.events().onFrame(listener),
    onSoundPush: (listener) => handle.ci.events().onSoundPush(listener),
    width: () => handle.ci.width(),
    height: () => handle.ci.height(),
    sendKeyEvent: (keyCode, pressed) => handle.ci.sendKeyEvent(keyCode, pressed),
  };
}

/** A file's bytes, through FileReader, which every supported browser has */
function readBytes(file: Blob): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(new Uint8Array(reader.result as ArrayBuffer));
    reader.onerror = () =>
      reject(reader.error ?? new Error(`${file.size} bytes could not be read`));
    reader.readAsArrayBuffer(file);
  });
}

/** "Author · year", or whichever of the two an app gives */
function releaseOf({ author, year }: DosApp): string {
  return [author, year].filter(Boolean).join(' · ');
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
  const posterSession = posterOf(state);
  const preparingSession = preparingOf(state);
  const loadingApp = state.phase.kind === 'loading' ? state.phase.app : null;
  const error = state.phase.kind === 'error' ? state.phase.error : null;
  const showAppSelector = state.selectorOpen;
  const tryAgainRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
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
        dispatch({
          type: 'loaded',
          app: loadingApp,
          files,
          dosboxConf: conf,
          play: hasFreshActivation(),
        });
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
      if (!line.includes(endMarker)) return;
      // The end card shows in the page, which js-dos's fullscreen player would cover. Only
      // when it is in fullscreen: otherwise js-dos calls document.exitFullscreen(), which
      // throws outside fullscreen.
      const softFullscreen = containerRef.current?.querySelector('.jsdos-fullscreen-workaround');
      if (softFullscreen || document.fullscreenElement) handle.player.setFullScreen(false);
      dispatch({ type: 'ended', sessionId });
    });
  }, [handle, endMarker, session]);
  const ended = session !== null && state.endedSessionId === session.id;

  // A production that waits at a setup screen gets its keys once that screen is up; if they
  // cannot be sent, or did not take, the visitor gets the keys to press instead
  const [recipe, setRecipe] = useState<{ sessionId: number; state: RecipeState } | null>(null);
  const [hintDismissed, setHintDismissed] = useState<number | null>(null);
  const startRecipe = sessionApp?.start;
  useEffect(() => {
    if (!handle || !startRecipe || !session) return;
    const sessionId = session.id;
    const controller = new AbortController();
    void runStartRecipe(recipeEmulatorOf(handle), startRecipe, {
      signal: controller.signal,
      onState: (current) => setRecipe({ sessionId, state: current }),
    });
    return () => controller.abort();
  }, [handle, startRecipe, session]);
  const showHint =
    session !== null &&
    sessionApp?.hint !== undefined &&
    recipe?.sessionId === session.id &&
    recipe.state === 'fallback' &&
    hintDismissed !== session.id;

  // Run an app picked in the selector, its files already loaded. The pick wins over a
  // requested app still loading, and starts the app again if it is the one running.
  const runPick = (loadedApp: LoadedApp) => {
    dispatch({
      type: 'picked',
      app: loadedApp.app,
      files: loadedApp.files,
      dosboxConf: loadedApp.dosboxConf,
      play: hasFreshActivation(),
    });
    onAppChange?.(loadedApp.app);
  };

  // A pick that would end a running tracker waits for the visitor to say so: unsaved work in
  // it would be lost, and its saved files are kept first
  const [pendingPick, setPendingPick] = useState<LoadedApp | null>(null);
  const trackerRuns = sessionApp?.saveFiles === true && status === 'ready';
  const handleSelectApp = (loadedApp: LoadedApp) => {
    if (trackerRuns) {
      setPendingPick(loadedApp);
      dispatch({ type: 'selectorCancelled' });
    } else {
      runPick(loadedApp);
    }
    onSelectorVisibilityChange?.(false);
  };
  const handleLeave = async () => {
    const pick = pendingPick;
    setPendingPick(null);
    if (!pick) return;
    await keepFilesNow();
    runPick(pick);
  };

  // The Files panel of a running tracker
  const [filesOpenFor, setFilesOpenFor] = useState<number | null>(null);
  const [filesNotice, setFilesNotice] = useState<string | null>(null);
  const filesOpen = session !== null && filesOpenFor === session.id;
  /** Keep the tracker's files now, giving up after 3 s; the bundle, if any */
  const keepFilesNow = async (): Promise<Uint8Array | null> => {
    const saveNow = saveFilesRef.current;
    if (!saveNow) return null;
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      return await Promise.race([
        saveNow(),
        new Promise<null>((resolve) => {
          timer = setTimeout(() => resolve(null), 3_000);
        }),
      ]);
    } catch (err) {
      console.warn('[DosPlayerWithApps] Files could not be kept:', err);
      return null;
    } finally {
      clearTimeout(timer);
    }
  };
  const handleDownload = async () => {
    if (!sessionApp) return;
    const bytes =
      (await keepFilesNow()) ??
      (await getSavedFiles(sessionApp.id).catch(() => null))?.bytes ??
      null;
    if (!bytes) {
      setFilesNotice(`Nothing to download yet: save something in ${sessionApp.name} first.`);
      return;
    }
    // The bundle as js-dos packed it: a ZIP of the saved files, byte for byte
    const url = URL.createObjectURL(new Blob([bytes.slice()], { type: 'application/zip' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `${sessionApp.id}-files.zip`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  };
  const handleImport = async (chosen: File[]) => {
    if (!session?.app || !session.files) return;
    const saved = (await keepFilesNow()) ?? session.saved ?? null;
    // Names of their own: js-dos writes loose files before it unpacks the archive and the
    // saved files, whose files of the same name would replace them
    const taken = new Set([
      ...zipEntryNames(session.files),
      ...(saved ? zipEntryNames(saved) : []),
      ...(session.imports ?? []).map((file) => file.path),
    ]);
    const imports = [...(session.imports ?? [])];
    for (const file of chosen) {
      const path = dosNameFor(file.name, taken);
      taken.add(path);
      imports.push({ path, contents: await readBytes(file) });
    }
    setFilesOpenFor(null);
    dispatch({ type: 'restarted', saved, imports });
  };
  const handleReset = async () => {
    if (!sessionApp) return;
    await removeSavedFiles(sessionApp.id).catch((err: unknown) => {
      console.warn('[DosPlayerWithApps] Saved files could not be deleted:', err);
    });
    setFilesOpenFor(null);
    dispatch({ type: 'restarted', saved: null, imports: [] });
  };

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

  // A tracker's files from its earlier visits come back after its archive. Where the
  // browser cannot keep files, it starts without them.
  const [filesKept, setFilesKept] = useState(true);
  useEffect(() => {
    if (!preparingSession?.app) return;
    const sessionId = preparingSession.id;
    let current = true;
    getSavedFiles(preparingSession.app.id).then(
      (found) => {
        if (current) dispatch({ type: 'prepared', sessionId, saved: found?.bytes ?? null });
      },
      (err: unknown) => {
        console.warn('[DosPlayerWithApps] Saved files could not be read:', err);
        if (!current) return;
        setFilesKept(false);
        dispatch({ type: 'prepared', sessionId, saved: null });
      }
    );
    return () => {
      current = false;
    };
  }, [preparingSession]);

  // What a tracker saves is kept: a few seconds after keys reach DOS, every 30 seconds, and
  // when the tab is hidden or the page goes. ci.persist() packs the files that differ from
  // the archive, the earlier visits' included, and the browser keeps that bundle.
  const [filesSavedAt, setFilesSavedAt] = useState<{ sessionId: number; at: number } | null>(null);
  const saveFilesRef = useRef<(() => Promise<Uint8Array | null>) | null>(null);
  useEffect(() => {
    if (!handle || !sessionApp?.saveFiles || !session) return;
    const appId = sessionApp.id;
    const sessionId = session.id;
    const queue = createPersistQueue((onlyChanges) => handle.ci.persist(onlyChanges));
    let lastWritten = session.saved ? fnv1a(session.saved) : null;
    const saveNow = async (): Promise<Uint8Array | null> => {
      const bytes = await queue.save();
      if (!bytes) return null;
      const written = fnv1a(bytes);
      if (written !== lastWritten) {
        await putSavedFiles(appId, bytes);
        lastWritten = written;
        setFilesSavedAt({ sessionId, at: Date.now() });
      }
      return bytes;
    };
    const saveQuietly = () => {
      saveNow().catch((err: unknown) => {
        console.warn('[DosPlayerWithApps] Files could not be kept:', err);
        setFilesKept(false);
      });
    };
    let afterKeys: ReturnType<typeof setTimeout> | undefined;
    // On window, where keys DosKit's own controls stop never arrive: these went to DOS
    const onKey = () => {
      clearTimeout(afterKeys);
      afterKeys = setTimeout(saveQuietly, 3_000);
    };
    const onHide = () => {
      if (document.visibilityState === 'hidden') saveQuietly();
    };
    const every = setInterval(saveQuietly, 30_000);
    window.addEventListener('keydown', onKey);
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('pagehide', saveQuietly);
    saveFilesRef.current = saveNow;
    return () => {
      clearTimeout(afterKeys);
      clearInterval(every);
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('pagehide', saveQuietly);
      if (saveFilesRef.current === saveNow) saveFilesRef.current = null;
    };
  }, [handle, sessionApp, session]);

  // The selector, opened from the end card
  const handleOpenSelector = useCallback(() => {
    dispatch({ type: 'selectorOpened' });
    onSelectorVisibilityChange?.(true);
  }, [onSelectorVisibilityChange]);

  return (
    <div ref={containerRef} className={`dos-player-with-apps ${className || ''}`}>
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

      {/* Play screen: the click on Play starts the emulator, and with it the sound */}
      {posterSession?.app && (
        <div className="doskit-poster">
          <div className="doskit-poster-box" role="group" aria-labelledby="doskit-poster-title">
            <h2 id="doskit-poster-title">{posterSession.app.name}</h2>
            {releaseOf(posterSession.app) && (
              <p className="doskit-poster-release">{releaseOf(posterSession.app)}</p>
            )}
            <p>{posterSession.app.description}</p>
            {posterSession.app.flashing && (
              <p className="doskit-flash-warning">
                <span aria-hidden="true">⚠ </span>
                Contains flashing lights, which may affect people with photosensitive epilepsy.
              </p>
            )}
            {posterSession.app.startNote && (
              <p className="doskit-poster-note">{posterSession.app.startNote}</p>
            )}
            <button
              className="doskit-play-button"
              autoFocus
              onClick={() => dispatch({ type: 'played' })}
            >
              {posterSession.app.kind === 'tracker' ? 'Start' : 'Play'}
            </button>
          </div>
        </div>
      )}

      {/* The keys to press, once DosKit's own start has given up. Its button takes no focus
          from a click, so that keys go on reaching DOS. */}
      {showHint && session && (
        <div className="doskit-start-hint" role="status">
          <p>{sessionApp?.hint}</p>
          <button
            aria-label="Dismiss the hint"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => setHintDismissed(session.id)}
          >
            ✕
          </button>
        </div>
      )}

      {/* A running tracker's files. The button takes no focus from a click, so that keys go
          on reaching DOS. */}
      {session?.app?.saveFiles && status === 'ready' && (
        <button
          className="doskit-files-open"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => {
            setFilesNotice(null);
            setFilesOpenFor(session.id);
          }}
        >
          Files
        </button>
      )}
      {filesOpen && session?.app && (
        <TrackerFiles
          appName={session.app.name}
          savedAt={filesSavedAt?.sessionId === session.id ? filesSavedAt.at : null}
          kept={filesKept}
          notice={filesNotice}
          onDownload={() => void handleDownload()}
          onImport={(chosen) => void handleImport(chosen)}
          onReset={() => void handleReset()}
          onClose={() => setFilesOpenFor(null)}
        />
      )}

      {/* Leaving a running tracker: its saved files are kept, unsaved work is lost */}
      {pendingPick && sessionApp && (
        <div className="doskit-end-card" role="dialog" aria-labelledby="doskit-leave-title">
          <h2 id="doskit-leave-title">Leave {sessionApp.name}?</h2>
          <p>
            What you saved in it stays in this browser. Work you haven't saved with its own save is
            lost.
          </p>
          <div className="doskit-end-actions">
            <button autoFocus onClick={() => void handleLeave()}>
              Leave
            </button>
            <button onClick={() => setPendingPick(null)}>Stay</button>
          </div>
        </div>
      )}

      {/* End card, once the program has returned to DOS */}
      {ended && session && endMarker && (
        <div className="doskit-end-card" role="dialog" aria-labelledby="doskit-end-title">
          <h2 id="doskit-end-title">{endMarker}</h2>
          <div className="doskit-end-actions">
            <button autoFocus onClick={() => dispatch({ type: 'replayed' })}>
              Play again
            </button>
            <button onClick={handleOpenSelector}>Choose another</button>
            <button onClick={() => dispatch({ type: 'endDismissed' })}>Back to DOS</button>
          </div>
        </div>
      )}

      {/* DOS Player */}
      {session && (
        <DosPlayer
          key={session.id} // A new session starts a new player
          dosboxConf={sessionConf}
          options={
            session.app && session.files
              ? {
                  // The archive, then what the app saved before, whose files replace the
                  // archive's; loose files of the visitor's own are written before both
                  initFs: [
                    session.files,
                    ...(session.saved ? [session.saved] : []),
                    ...(session.imports ?? []),
                  ],
                  ...session.app.jsdos,
                }
              : {}
          }
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
