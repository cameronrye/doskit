/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * What DosPlayerWithApps runs, as one reducer: whether anything runs, what loads, what failed,
 * whether the selector is open, and what became of the running emulator
 */

import type { DosApp } from '../types/dos-app';
import type { FriendlyError } from '../utils/errorMessages';

/** What the emulator runs: an app with its files, or the default DOS prompt */
export interface Session {
  /** Tells the sessions apart: each one starts its own player */
  id: number;
  app: DosApp | null;
  files?: Uint8Array;
  dosboxConf?: string;
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
  /** A requested app's files and config arrived */
  | { type: 'loaded'; app: DosApp; files: Uint8Array; dosboxConf: string }
  /** A requested app failed to load */
  | { type: 'loadFailed'; app: DosApp; error: FriendlyError }
  /** An app was picked in the selector, its files already loaded */
  | { type: 'picked'; app: DosApp; files: Uint8Array; dosboxConf: string }
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
      // A request for the app already running changes nothing
      if (session?.app?.id === app.id) return next;
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
      return { ...state, phase: running(newSession(action.app, action.files, action.dosboxConf)) };

    case 'loadFailed':
      if (state.phase.kind !== 'loading' || state.phase.app !== action.app) return state;
      return { ...state, phase: { kind: 'error', error: { ...action.error, app: action.app } } };

    case 'picked':
      // The user's pick wins over a requested app still loading, and starts the app again
      // if it is the one running
      return {
        ...state,
        phase: running(newSession(action.app, action.files, action.dosboxConf)),
        selectorOpen: false,
      };

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
      return 'idle';
    case 'loading':
      return 'loading';
    case 'error':
      return 'error';
    case 'running':
      return state.started?.sessionId === state.phase.session.id ? state.started.status : 'loading';
  }
}
