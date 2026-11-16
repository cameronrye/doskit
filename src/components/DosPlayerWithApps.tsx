/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * DosPlayer with Application Support
 * Runs the production a page asks for, or the plain DOS prompt: it downloads the production
 * on its page, waits there for Play, and runs it under the run bar
 */

import { useState, useEffect, useEffectEvent, useReducer, useRef, type Ref } from 'react';
import { DosPlayer } from './DosPlayer';
import DosWindow from './DosWindow';
import { ProductionPage, type ProductionPageStatus } from './ProductionPage';
import { RunBar } from './RunBar';
import type { DosApp } from '../types/dos-app';
import type { CommandInterface } from '../types/js-dos';
import type { PlayerHandle } from '../hooks/useDosEmulator';
import type { LoadProgress } from '../utils/diskLoader';
import type { KindFilter } from '../utils/productionFilter';
import { getUserFriendlyError } from '../utils/errorMessages';
import { endMarkerFor, withEndMarker } from '../utils/endMarker';
import { runStartRecipe, type RecipeEmulator, type RecipeState } from '../utils/startRecipe';
import { createPersistQueue } from '../utils/persistQueue';
import { getSavedFiles, putSavedFiles, removeSavedFiles } from '../utils/savedFiles';
import { dosPathFor, zipEntryNames } from '../utils/dosNames';
import { TrackerFiles } from './TrackerFiles';
import { fnv1a } from '../utils/frameHash';
import {
  initialPlayerState,
  playerReducer,
  posterOf,
  preparingOf,
  sessionOf,
  statusOf,
  type Phase,
  type PlayerStatus,
} from './playerSession';
import './DosPlayerWithApps.css';

export type { PlayerStatus } from './playerSession';

interface DosPlayerWithAppsProps {
  /**
   * The production to run, or null for the plain DOS prompt. Each new value stops what is
   * running and loads that production, unless it is already running or waiting for Play.
   */
  requestedApp: DosApp | null;
  /** To the start page, with a kind to select; a running tracker asks first (the Leave dialog) */
  onBrowse: (kind?: KindFilter) => void;
  /** To another production's page, from a "More by" link on this one's */
  onOpenApp: (app: DosApp) => void;
  /** About the production, from its page or the run bar: App shows the panel */
  onAbout: () => void;
  /** About's button on the page or in the bar, whichever shows: it gets the focus back */
  aboutButtonRef?: Ref<HTMLButtonElement>;
  /** Whether the browser is online, for the run bar's status */
  isOnline: boolean;
  /** Every production, for the page's "More by" */
  apps: readonly DosApp[];
  /** Called with the status on mount, and again whenever it changes */
  onStatusChange?: (status: PlayerStatus) => void;
  onReady?: (ci: CommandInterface) => void;
  onExit?: () => void;
  className?: string;
}

/**
 * How long a load may report nothing before its download has started, as a stall would: the
 * download times itself out only from its request on
 */
const START_TIMEOUT_MS = 20_000;

/**
 * Whether the page has a click or key press of the last few seconds to start sound with.
 * Browsers start sound only within a few seconds of one (Safari after about 5). A production
 * waits on its page for the click on Play that starts it, however it was opened; only Try
 * Again, a click on the same page, starts it at once while that click is this fresh.
 */
function hasFreshActivation(): boolean {
  return navigator.userActivation?.isActive ?? false;
}

/** What the start keys need of a running emulator */
function recipeEmulatorOf(handle: PlayerHandle): RecipeEmulator {
  return {
    stdout: handle.stdout,
    messages: handle.messages,
    latestFrame: () => handle.frames.latest(),
    onFrame: (listener) => handle.frames.subscribe(listener),
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
  requestedApp,
  onBrowse,
  onOpenApp,
  onAbout,
  aboutButtonRef,
  isOnline,
  apps,
  onStatusChange,
  onReady,
  onExit,
  className,
}: DosPlayerWithAppsProps) {
  const [state, dispatch] = useReducer(playerReducer, { requestedApp }, initialPlayerState);
  const session = sessionOf(state);
  const posterSession = posterOf(state);
  const preparingSession = preparingOf(state);
  const loading = state.phase.kind === 'loading' ? state.phase : null;
  const error = state.phase.kind === 'error' ? state.phase.error : null;
  const containerRef = useRef<HTMLDivElement>(null);
  // The running session's emulator, once js-dos has handed it out
  const [handed, setHanded] = useState<{ sessionId: number; handle: PlayerHandle } | null>(null);
  const handle = handed && handed.sessionId === session?.id ? handed.handle : null;

  const status = statusOf(state);
  const reportStatus = useEffectEvent((current: PlayerStatus) => onStatusChange?.(current));
  useEffect(() => {
    reportStatus(status);
  }, [status]);

  // The parent's prop, adjusted for while rendering instead of in an effect. A new request
  // supersedes any load still running for an earlier one, and a request for the app already
  // running changes nothing.
  // https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  if ((requestedApp?.id ?? null) !== state.requestedId) {
    dispatch({ type: 'requested', app: requestedApp });
  }

  // How much of the archive has arrived, for the load that reported it: a new load, even of
  // the same production, as on Try Again, starts from nothing. While a tracker's saved files
  // are read next, its download stays as it finished.
  const [progress, setProgress] = useState<{
    load: Extract<Phase, { kind: 'loading' }>;
    progress: LoadProgress;
  } | null>(null);
  const reported =
    progress !== null && (progress.load === loading || progress.load.app === preparingSession?.app)
      ? progress.progress
      : null;

  // The production's page, until Play: its download, its load error, then Play
  const pageApp = loading?.app ?? error?.app ?? preparingSession?.app ?? posterSession?.app ?? null;
  const pageStatus: ProductionPageStatus = error
    ? { kind: 'error', error }
    : posterSession
      ? { kind: 'ready' }
      : { kind: 'loading', progress: reported };

  // Load the requested app's files and DOSBox config. A newer request, Try Again or
  // unmounting starts another load or none, which aborts this one and drops its result.
  useEffect(() => {
    if (!loading) return;
    const { app } = loading;

    if (import.meta.env.DEV) {
      console.log('[DosPlayerWithApps] Loading requested app:', app.name);
    }

    const controller = new AbortController();
    // The download times itself out once it has reported its start: a load that has not for
    // as long, such as one whose request never goes out, gives up here as a stall does
    const startTimer = setTimeout(() => {
      controller.abort();
      const timedOut = Object.assign(
        new Error(`Loading timed out: nothing arrived for ${START_TIMEOUT_MS / 1000} seconds`),
        { name: 'TimeoutError' }
      );
      console.error('[DosPlayerWithApps] Error loading application:', timedOut);
      dispatch({
        type: 'loadFailed',
        app,
        error: getUserFriendlyError(timedOut, { online: navigator.onLine }),
      });
    }, START_TIMEOUT_MS);
    Promise.all([
      app.loader((reported) => {
        clearTimeout(startTimer);
        if (!controller.signal.aborted) setProgress({ load: loading, progress: reported });
      }, controller.signal),
      app.loadDosboxConf ? app.loadDosboxConf() : Promise.resolve(app.dosboxConf),
    ])
      .then(
        ([files, conf]) => {
          if (controller.signal.aborted) return;
          dispatch({
            type: 'loaded',
            app,
            files,
            dosboxConf: conf,
            // Only Try Again starts the production at once, while its click can still start
            // sound. A production that flashes, or has a content note, waits for Play on its
            // page all the same, which warns of it.
            play:
              loading.retry === true && hasFreshActivation() && !app.flashing && !app.contentNote,
          });
        },
        (err: unknown) => {
          if (controller.signal.aborted) return;
          console.error('[DosPlayerWithApps] Error loading application:', err);
          dispatch({
            type: 'loadFailed',
            app,
            error: getUserFriendlyError(err, { online: navigator.onLine }),
          });
        }
      )
      .finally(() => clearTimeout(startTimer));
    return () => {
      clearTimeout(startTimer);
      controller.abort();
    };
  }, [loading]);

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
    runStartRecipe(recipeEmulatorOf(handle), startRecipe, {
      signal: controller.signal,
      onState: (current) => setRecipe({ sessionId, state: current }),
    }).catch((err: unknown) => {
      console.warn('[DosPlayerWithApps] The start keys could not be sent:', err);
      setRecipe({ sessionId, state: 'fallback' });
    });
    return () => controller.abort();
  }, [handle, startRecipe, session]);
  const showHint =
    session !== null &&
    sessionApp?.hint !== undefined &&
    recipe?.sessionId === session.id &&
    recipe.state === 'fallback' &&
    hintDismissed !== session.id;

  // Going to the start page would end a running tracker: that waits for the visitor to say
  // so, as unsaved work in it would be lost, and its saved files are kept first
  const [pendingLeave, setPendingLeave] = useState<{ sessionId: number; kind?: KindFilter } | null>(
    null
  );
  // Back or Forward can end the tracker the question is about: it goes with that session
  const leaveAsked =
    pendingLeave !== null && session !== null && pendingLeave.sessionId === session.id;
  const trackerRuns = sessionApp?.saveFiles === true && status === 'ready';
  const requestBrowse = (kind?: KindFilter) => {
    if (trackerRuns && session) {
      setPendingLeave({ sessionId: session.id, kind });
    } else {
      onBrowse(kind);
    }
  };
  const handleLeave = async () => {
    const pending = leaveAsked ? pendingLeave : null;
    setPendingLeave(null);
    if (!pending) return;
    await keepFilesNow();
    onBrowse(pending.kind);
  };

  // Play again: for a tracker, with the files it saved this session, packed first
  const handlePlayAgain = async () => {
    const saved = sessionApp?.saveFiles ? await keepFilesNow() : null;
    dispatch({ type: 'replayed', saved });
  };

  // The Files panel of a running tracker
  const [filesOpenFor, setFilesOpenFor] = useState<number | null>(null);
  const filesButtonRef = useRef<HTMLButtonElement>(null);
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
    // Names of their own: the files of a later bundle replace those of the same name before
    const taken = new Set([
      ...zipEntryNames(session.files),
      ...(saved ? zipEntryNames(saved) : []),
      ...(session.imports ?? []).map((file) => file.path),
    ]);
    const imports = [...(session.imports ?? [])];
    for (const file of chosen) {
      const path = dosPathFor(file.name, session.app.modules?.folder, taken);
      taken.add(path);
      try {
        imports.push({ path, contents: await readBytes(file) });
      } catch (err) {
        console.warn('[DosPlayerWithApps] A file could not be read:', err);
        setFilesNotice(`${file.name} could not be read, so nothing was brought in.`);
        return;
      }
    }
    setFilesOpenFor(null);
    dispatch({ type: 'restarted', saved, imports });
  };
  const handleReset = async () => {
    if (!sessionApp) return;
    // A save still running would write the files back after they are deleted
    await keepFilesNow();
    await removeSavedFiles(sessionApp.id).catch((err: unknown) => {
      console.warn('[DosPlayerWithApps] Saved files could not be deleted:', err);
    });
    setFilesOpenFor(null);
    dispatch({ type: 'restarted', saved: null, imports: [] });
  };

  // Browse, in the run bar or on the end card: the start page, once the question over a
  // running tracker has been answered. The end card gives way to the question: a tracker that
  // has quit to DOS is still ready, and the card would cover the question.
  const handleBrowse = () => {
    dispatch({ type: 'endDismissed' });
    requestBrowse();
  };

  // A tracker's files from its earlier visits come back after its archive. Where the
  // browser cannot keep files, it starts without them.
  const [filesKept, setFilesKept] = useState(true);
  useEffect(() => {
    if (!preparingSession?.app) return;
    const sessionId = preparingSession.id;
    let current = true;
    // A browser whose storage never answers starts the tracker without its files
    let timer: ReturnType<typeof setTimeout> | undefined;
    Promise.race([
      getSavedFiles(preparingSession.app.id),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error('IndexedDB did not answer in 3 s')), 3_000);
      }),
    ])
      .then(
        (found) => {
          if (current) dispatch({ type: 'prepared', sessionId, saved: found?.bytes ?? null });
        },
        (err: unknown) => {
          console.warn('[DosPlayerWithApps] Saved files could not be read:', err);
          if (!current) return;
          setFilesKept(false);
          dispatch({ type: 'prepared', sessionId, saved: null });
        }
      )
      .finally(() => clearTimeout(timer));
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
    // What js-dos packed, whether or not the browser could keep it: Download, Bring in
    // modules and Play again start from these bytes
    const saveNow = async (): Promise<Uint8Array | null> => {
      const bytes = await queue.save();
      if (!bytes) return null;
      const written = fnv1a(bytes);
      if (written !== lastWritten) {
        try {
          await putSavedFiles(appId, bytes);
          lastWritten = written;
          setFilesSavedAt({ sessionId, at: Date.now() });
        } catch (err) {
          console.warn('[DosPlayerWithApps] Files could not be kept:', err);
          setFilesKept(false);
        }
      }
      return bytes;
    };
    // A save that js-dos is slow to answer says nothing about the browser's storage: only a
    // failed write does
    const saveQuietly = () => {
      saveNow().catch((err: unknown) => {
        console.warn('[DosPlayerWithApps] Files could not be packed:', err);
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
    // Modules just brought in are only in this session until a save packs them
    const soon = session.imports?.length ? setTimeout(saveQuietly, 1_000) : undefined;
    window.addEventListener('keydown', onKey);
    // A tap counts too: a phone's on-screen keyboard sends its keys to DOS from taps, never
    // as key events. A tap on DosKit's own controls costs only a save that writes nothing
    // new. In the capture phase, so that no handler of js-dos's can stop it first
    window.addEventListener('pointerup', onKey, true);
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('pagehide', saveQuietly);
    saveFilesRef.current = saveNow;
    return () => {
      clearTimeout(afterKeys);
      clearTimeout(soon);
      clearInterval(every);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('pointerup', onKey, true);
      document.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('pagehide', saveQuietly);
      if (saveFilesRef.current === saveNow) saveFilesRef.current = null;
    };
  }, [handle, sessionApp, session]);

  return (
    <div ref={containerRef} className={`dos-player-with-apps ${className || ''}`}>
      {/* The production's page, with nothing running: a page of its own for each production,
          which opens at its top. Its Cancel goes to the start page, which stops the download as
          it replaces the player; its Try Again loads the production once more. */}
      {pageApp && (
        <ProductionPage
          key={pageApp.id}
          app={pageApp}
          apps={apps}
          status={pageStatus}
          onPlay={() => dispatch({ type: 'played' })}
          onRetry={() => dispatch({ type: 'retried', app: pageApp })}
          onCancel={() => onBrowse()}
          onBrowse={onBrowse}
          onAbout={onAbout}
          onOpenApp={onOpenApp}
          aboutButtonRef={aboutButtonRef}
        />
      )}

      {/* A running production, or the DOS prompt, under its bar. Browse asks first over a
          running tracker. */}
      {session && (
        <RunBar
          title={session.app?.name ?? 'DOS prompt'}
          meta={(session.app && releaseOf(session.app)) || null}
          status={status}
          isOnline={isOnline}
          onBrowse={handleBrowse}
          onAbout={session.app ? onAbout : undefined}
          // The prompt has no About, where a production's bar leads to the licenses
          showLicenses={!session.app}
          onFiles={
            trackerRuns
              ? () => {
                  setFilesNotice(null);
                  setFilesOpenFor(session.id);
                }
              : undefined
          }
          aboutButtonRef={aboutButtonRef}
          filesButtonRef={filesButtonRef}
        />
      )}

      {session && (
        <div className="doskit-stage">
          {/* The keys to press, once DosKit's own start has given up. Its button takes no
              focus from a click, so that keys go on reaching DOS. */}
          {showHint && (
            <div className="doskit-start-hint" role="status">
              <DosWindow title="Keys">
                <p>{sessionApp?.hint}</p>
                <button
                  aria-label="Dismiss the hint"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => setHintDismissed(session.id)}
                >
                  ✕
                </button>
              </DosWindow>
            </div>
          )}

          {/* A running tracker's files, from the run bar's Files */}
          {filesOpen && session.app && (
            <TrackerFiles
              appName={session.app.name}
              accept={session.app.modules?.accept}
              savedAt={filesSavedAt?.sessionId === session.id ? filesSavedAt.at : null}
              kept={filesKept}
              notice={filesNotice}
              onDownload={() => void handleDownload()}
              onImport={(chosen) => void handleImport(chosen)}
              onReset={() => void handleReset()}
              onClose={(fromKeyboard) => {
                setFilesOpenFor(null);
                // From the keyboard, back to the Files button; with the mouse, to the page,
                // where keys go to DOS
                if (fromKeyboard) {
                  filesButtonRef.current?.focus();
                } else if (document.activeElement instanceof HTMLElement) {
                  document.activeElement.blur();
                }
              }}
            />
          )}

          {/* Leaving a running tracker: its saved files are kept, unsaved work is lost */}
          {leaveAsked && sessionApp && (
            <div className="doskit-end-card" role="dialog" aria-labelledby="doskit-leave-title">
              <DosWindow title="Leave">
                <h2 id="doskit-leave-title">Leave {sessionApp.name}?</h2>
                <p>
                  {filesKept
                    ? "What you saved in it stays in this browser. Work you haven't saved with its own save is lost."
                    : "This browser can't keep files, so what you saved in it is lost when you leave: download it first with the Files button."}
                </p>
                <div className="doskit-end-actions">
                  <button autoFocus onClick={() => void handleLeave()}>
                    Leave
                  </button>
                  <button onClick={() => setPendingLeave(null)}>Stay</button>
                </div>
              </DosWindow>
            </div>
          )}

          {/* End card, once the program has returned to DOS */}
          {ended && endMarker && (
            <div className="doskit-end-card" role="dialog" aria-labelledby="doskit-end-title">
              <DosWindow title="The end">
                <h2 id="doskit-end-title">{endMarker}</h2>
                <div className="doskit-end-actions">
                  <button autoFocus onClick={() => void handlePlayAgain()}>
                    Play again
                  </button>
                  <button onClick={handleBrowse}>Browse</button>
                  <button onClick={() => dispatch({ type: 'endDismissed' })}>Back to DOS</button>
                </div>
              </DosWindow>
            </div>
          )}

          <DosPlayer
            key={session.id} // A new session starts a new player
            dosboxConf={sessionConf}
            options={
              session.app && session.files
                ? {
                    // The archive, then the visitor's own files packed as a bundle, then what
                    // the app saved, whose files replace those of the same name before them: a
                    // module brought in and since saved with edits comes back edited. js-dos
                    // packs every file of the bundles after the first one with the program's
                    // saves, but never loose start files, so the modules are kept too.
                    initFs: [
                      session.files,
                      ...(session.importsZip ? [session.importsZip] : []),
                      ...(session.saved ? [session.saved] : []),
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
        </div>
      )}
    </div>
  );
}
