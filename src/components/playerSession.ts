/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * What DosPlayerWithApps runs, as one reducer: whether anything runs, what loads, what failed,
 * whether the selector is open, and what became of the running emulator
 */

import type { DosApp } from '../types/dos-app';
import type { InitFileEntry } from '../types/js-dos';
import { zipFiles } from '../utils/zipFiles';
import type { FriendlyError } from '../utils/errorMessages';

/** What the emulator runs: an app with its files, or the default DOS prompt */
export interface Session {
  /** Tells the sessions apart: each one starts its own player */
  id: number;
  app: DosApp | null;
  files?: Uint8Array;
  dosboxConf?: string;
  /** The files the app saved before, as a bundle that follows its archive */
  saved?: Uint8Array;
  /** Files of the visitor's own, brought in through the Files panel, under DOS names */
  imports?: InitFileEntry[];
  /** The same files as one bundle, which the player starts with: made once per restart */
  importsZip?: Uint8Array;
}

/** A requested app that failed to load: what the error overlay says, and the app to retry */
export interface LoadError extends FriendlyError {
  app: DosApp;
}

/**
 * Where the player is: nothing runs (the selector is open over an empty stage), a requested
 * app downloads, it failed to, or a session runs
 */
export type Phase =
  | { kind: 'idle' }
  | { kind: 'loading'; app: DosApp }
  | { kind: 'error'; error: LoadError }
  /** A tracker's files are in, and the files it saved before are being read */
  | { kind: 'preparing'; session: Session; play: boolean }
  /** An app's files are in, waiting for Play: a start with sound needs the visitor's click */
  | { kind: 'poster'; session: Session }
  | { kind: 'running'; session: Session };

export interface PlayerState {
  phase: Phase;
  /** The requestedApp prop last seen, by id */
  requestedId: string | null;
  /** The showSelector prop last seen */
  shownBy: boolean;
  selectorOpen: boolean;
  /** What became of the running session's emulator, once it is ready or has failed to start */
  started: { sessionId: number; status: 'ready' | 'error' } | null;
  /** The session whose program has returned to DOS */
  endedSessionId: number | null;
}

export type PlayerAction =
  /** The requestedApp prop changed */
  | { type: 'requested'; app: DosApp | null }
  /** The showSelector prop changed */
  | { type: 'selectorProp'; open: boolean }
  /**
   * A requested app's files and config arrived. It starts at once with play, when the page has
   * a fresh click or key press to start sound with, and shows the Play screen otherwise.
   */
  | { type: 'loaded'; app: DosApp; files: Uint8Array; dosboxConf: string; play: boolean }
  /** A requested app failed to load */
  | { type: 'loadFailed'; app: DosApp; error: FriendlyError }
  /** An app was picked in the selector, its files already loaded; play as for 'loaded' */
  | { type: 'picked'; app: DosApp; files: Uint8Array; dosboxConf: string; play: boolean }
  /** The files a tracker saved before were read: null for none, or none to be had */
  | { type: 'prepared'; sessionId: number; saved: Uint8Array | null }
  /** Play on the Play screen */
  | { type: 'played' }
  /**
   * Play again, once the program has returned to DOS: the same files, a new player, and for
   * a tracker the files it saved this session, which it packed just before
   */
  | { type: 'replayed'; saved?: Uint8Array | null }
  /** Back to DOS: the end card goes, the DOS prompt stays */
  | { type: 'endDismissed' }
  /**
   * The running app starts again with other saved files or files of the visitor's own, such
   * as a tracker after Bring in modules or Start over
   */
  | { type: 'restarted'; saved: Uint8Array | null; imports: InitFileEntry[] }
  /** The selector, opened from inside the player */
  | { type: 'selectorOpened' }
  /** The selector closed without a pick */
  | { type: 'selectorCancelled' }
  /** Try Again on a load error */
  | { type: 'retried'; app: DosApp }
  /** Choose Another Application, or Cancel during a requested load */
  | { type: 'choseAnother' }
  | { type: 'started'; sessionId: number; status: 'ready' | 'error' }
  | { type: 'exited'; sessionId: number }
  /** The session's program printed its end marker */
  | { type: 'ended'; sessionId: number };

/**
 * How the player is doing: 'idle' while nothing runs; 'loading' while a requested app
 * downloads or an emulator starts, and after DOS has exited until the next start; 'ready' once
 * js-dos reports the emulator ready; 'error' while the load error or the emulator's start
 * error shows
 */
export type PlayerStatus = 'idle' | 'loading' | 'ready' | 'error';

/** The id of the last session newSession() made */
let lastSessionId = 0;

/**
 * A session with an id of its own, so that it starts a new player even for the app already
 * running: picking that app runs it again, such as a demo that has ended at the DOS prompt.
 * The default DOS prompt gets one each time too, so that its status is its own.
 */
export function newSession(app: DosApp | null, files?: Uint8Array, dosboxConf?: string): Session {
  lastSessionId += 1;
  return { id: lastSessionId, app, files, dosboxConf };
}

const running = (session: Session): Phase => ({ kind: 'running', session });

/** The running session, if any */
export function sessionOf(state: PlayerState): Session | null {
  return state.phase.kind === 'running' ? state.phase.session : null;
}

/** The session waiting for Play, if any */
export function posterOf(state: PlayerState): Session | null {
  return state.phase.kind === 'poster' ? state.phase.session : null;
}

/** The session whose saved files are being read, if any */
export function preparingOf(state: PlayerState): Session | null {
  return state.phase.kind === 'preparing' ? state.phase.session : null;
}

/** A session that starts now, or waits on the Play screen */
const starting = (session: Session, play: boolean): Phase =>
  play || !session.app ? running(session) : { kind: 'poster', session };

/** A new session: a tracker reads the files it saved first */
const opening = (session: Session, play: boolean): Phase =>
  session.app?.saveFiles ? { kind: 'preparing', session, play } : starting(session, play);

/**
 * The state a player starts in. A deep link never boots the default prompt first, and nothing
 * runs behind a selector that is open from the start: the prompt boots if it is cancelled.
 */
export function initialPlayerState({
  requestedApp,
  showSelector,
}: {
  requestedApp: DosApp | null;
  showSelector: boolean;
}): PlayerState {
  return {
    phase: requestedApp
      ? { kind: 'loading', app: requestedApp }
      : showSelector
        ? { kind: 'idle' }
        : running(newSession(null)),
    requestedId: requestedApp?.id ?? null,
    shownBy: showSelector,
    selectorOpen: showSelector,
    started: null,
    endedSessionId: null,
  };
}

export function playerReducer(state: PlayerState, action: PlayerAction): PlayerState {
  const session = sessionOf(state);
  const current = session ?? posterOf(state) ?? preparingOf(state);
  switch (action.type) {
    case 'requested': {
      const { app } = action;
      if ((app?.id ?? null) === state.requestedId) return state;
      const next = { ...state, requestedId: app?.id ?? null };
      if (!app) {
        // A DOS prompt already running, such as one a cancelled selector started, goes on
        if (session && session.app === null) return next;
        return {
          ...next,
          phase: state.selectorOpen ? { kind: 'idle' } : running(newSession(null)),
        };
      }
      // A request for the app already running, or waiting for Play, changes nothing
      if (current?.app?.id === app.id) return next;
      // Whatever runs stops, sound and all, as the load starts
      return { ...next, phase: { kind: 'loading', app } };
    }

    case 'selectorProp': {
      const next = { ...state, shownBy: action.open, selectorOpen: action.open };
      // Nothing is left to look at once the selector closes over nothing
      if (!action.open && state.phase.kind === 'idle') {
        return { ...next, phase: running(newSession(null)) };
      }
      return next;
    }

    case 'loaded':
      if (state.phase.kind !== 'loading' || state.phase.app !== action.app) return state;
      return {
        ...state,
        phase: opening(newSession(action.app, action.files, action.dosboxConf), action.play),
      };

    case 'loadFailed':
      if (state.phase.kind !== 'loading' || state.phase.app !== action.app) return state;
      return { ...state, phase: { kind: 'error', error: { ...action.error, app: action.app } } };

    case 'picked':
      // The user's pick wins over a requested app still loading, and starts the app again
      // if it is the one running
      return {
        ...state,
        phase: opening(newSession(action.app, action.files, action.dosboxConf), action.play),
        selectorOpen: false,
      };

    case 'prepared': {
      if (state.phase.kind !== 'preparing' || state.phase.session.id !== action.sessionId) {
        return state;
      }
      const prepared = { ...state.phase.session, saved: action.saved ?? undefined };
      return { ...state, phase: starting(prepared, state.phase.play) };
    }

    case 'played':
      if (state.phase.kind !== 'poster') return state;
      return { ...state, phase: running(state.phase.session) };

    case 'replayed':
      if (!session || state.endedSessionId !== session.id) return state;
      return {
        ...state,
        phase: running({
          ...session,
          id: newSession(null).id,
          saved: action.saved ?? session.saved,
        }),
        endedSessionId: null,
      };

    case 'endDismissed':
      return { ...state, endedSessionId: null };

    case 'restarted':
      if (!session) return state;
      return {
        ...state,
        phase: running({
          ...session,
          id: newSession(null).id,
          saved: action.saved ?? undefined,
          imports: action.imports,
          importsZip: action.imports.length > 0 ? zipFiles(action.imports) : undefined,
        }),
        endedSessionId: null,
      };

    case 'selectorOpened':
      return { ...state, selectorOpen: true, endedSessionId: null };

    case 'selectorCancelled':
      return {
        ...state,
        selectorOpen: false,
        phase: state.phase.kind === 'idle' ? running(newSession(null)) : state.phase,
      };

    case 'retried':
      return { ...state, phase: { kind: 'loading', app: action.app } };

    case 'choseAnother':
      return { ...state, phase: { kind: 'idle' }, selectorOpen: true };

    case 'started':
      if (session?.id !== action.sessionId) return state;
      return { ...state, started: { sessionId: action.sessionId, status: action.status } };

    case 'exited':
      if (state.started?.sessionId !== action.sessionId) return state;
      return { ...state, started: null };

    case 'ended':
      if (session?.id !== action.sessionId) return state;
      return { ...state, endedSessionId: action.sessionId };
  }
}

/** The status a state shows: a new session is loading until its own emulator is ready */
export function statusOf(state: PlayerState): PlayerStatus {
  switch (state.phase.kind) {
    case 'idle':
    case 'poster':
      return 'idle';
    case 'loading':
    case 'preparing':
      return 'loading';
    case 'error':
      return 'error';
    case 'running':
      return state.started?.sessionId === state.phase.session.id ? state.started.status : 'loading';
  }
}
