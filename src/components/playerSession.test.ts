/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 */

import { describe, expect, it } from 'vitest';
import type { DosApp } from '../types/dos-app';
import {
  initialPlayerState,
  playerReducer,
  sessionOf,
  statusOf,
  type PlayerState,
} from './playerSession';

const demo: DosApp = {
  id: 'demo',
  name: 'Demo',
  description: 'A demo',
  kind: 'demo',
  archiveBytes: 1,
  loadMethod: 'zip',
  dosboxConf: '',
  loader: async () => new Uint8Array([1]),
};

const tracker: DosApp = {
  ...demo,
  id: 'tracker',
  name: 'Tracker',
  kind: 'tracker',
  saveFiles: true,
};

const loadedAction = (app: DosApp, play: boolean) =>
  ({ type: 'loaded', app, files: new Uint8Array([1]), dosboxConf: '', play }) as const;

describe('playerReducer', () => {
  it('starts the DOS prompt for no requested app, and loads a requested one', () => {
    expect(initialPlayerState({ requestedApp: null }).phase).toMatchObject({
      kind: 'running',
      session: { app: null },
    });
    expect(initialPlayerState({ requestedApp: demo }).phase).toEqual({
      kind: 'loading',
      app: demo,
    });
  });

  it('waits on the page for Play once a production has loaded', () => {
    const loaded = playerReducer(initialPlayerState({ requestedApp: demo }), {
      type: 'loaded',
      app: demo,
      files: new Uint8Array([1]),
      dosboxConf: '',
      play: false,
    });
    expect(loaded.phase.kind).toBe('poster');
    expect(statusOf(loaded)).toBe('idle');
    expect(playerReducer(loaded, { type: 'played' }).phase.kind).toBe('running');
  });

  it('marks a Try Again load as a retry, which may start at once', () => {
    const failed = {
      ...initialPlayerState({ requestedApp: demo }),
      phase: { kind: 'error', error: { message: 'x', app: demo } },
    } as PlayerState;
    const retried = playerReducer(failed, { type: 'retried', app: demo });
    expect(retried.phase).toEqual({ kind: 'loading', app: demo, retry: true });
    const loaded = playerReducer(retried, {
      type: 'loaded',
      app: demo,
      files: new Uint8Array([1]),
      dosboxConf: '',
      play: true,
    });
    expect(loaded.phase.kind).toBe('running');
  });

  it('takes a tracker from its saved files to its page, not straight to running', () => {
    const loaded = playerReducer(
      initialPlayerState({ requestedApp: tracker }),
      loadedAction(tracker, false)
    );
    expect(loaded.phase.kind).toBe('preparing');
    expect(statusOf(loaded)).toBe('loading');
    if (loaded.phase.kind !== 'preparing') return;

    const prepared = playerReducer(loaded, {
      type: 'prepared',
      sessionId: loaded.phase.session.id,
      saved: new Uint8Array([9]),
    });

    expect(prepared.phase).toMatchObject({
      kind: 'poster',
      session: { app: tracker, saved: new Uint8Array([9]) },
    });
  });

  it('starts a tracker Try Again loaded once its saved files are read', () => {
    const retried = playerReducer(initialPlayerState({ requestedApp: tracker }), {
      type: 'retried',
      app: tracker,
    });
    const loaded = playerReducer(retried, loadedAction(tracker, true));
    if (loaded.phase.kind !== 'preparing') throw new Error(`${loaded.phase.kind}, not preparing`);

    const prepared = playerReducer(loaded, {
      type: 'prepared',
      sessionId: loaded.phase.session.id,
      saved: null,
    });

    expect(prepared.phase.kind).toBe('running');
  });

  it('keeps a running DOS prompt when no app is requested again', () => {
    const prompt = initialPlayerState({ requestedApp: null });

    const next = playerReducer(prompt, { type: 'requested', app: null });

    expect(sessionOf(next)?.id).toBe(sessionOf(prompt)?.id);
  });

  it('boots a new DOS prompt when a production gives way to none', () => {
    const prompt = initialPlayerState({ requestedApp: null });
    const loading = playerReducer(prompt, { type: 'requested', app: demo });
    expect(loading.phase).toEqual({ kind: 'loading', app: demo });

    const next = playerReducer(loading, { type: 'requested', app: null });

    expect(next.phase).toMatchObject({ kind: 'running', session: { app: null } });
    expect(sessionOf(next)?.id).not.toBe(sessionOf(prompt)?.id);
    expect(next.requestedId).toBeNull();
  });

  // Back or Forward to the production waiting for Play, or already running
  it('changes nothing for a request for the production already on its page', () => {
    const poster = playerReducer(
      initialPlayerState({ requestedApp: demo }),
      loadedAction(demo, false)
    );

    expect(playerReducer(poster, { type: 'requested', app: demo })).toBe(poster);
  });

  it('drops a load result for an app no longer loading', () => {
    const loading = playerReducer(initialPlayerState({ requestedApp: demo }), {
      type: 'requested',
      app: tracker,
    });

    expect(playerReducer(loading, loadedAction(demo, true))).toBe(loading);
  });
});
