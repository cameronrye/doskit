import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  START_PAGE_STATE_KEY,
  loadStartPageState,
  saveStartPageState,
  type StartPageState,
} from './startPageState';

describe('start page state', () => {
  beforeEach(() => sessionStorage.clear());
  afterEach(() => vi.restoreAllMocks());

  it('round-trips a state', () => {
    const state: StartPageState = {
      kind: 'tracker',
      query: 'fast',
      scrollTop: 320,
      focusId: 'unreal',
    };
    saveStartPageState(state);
    expect(loadStartPageState()).toEqual(state);
  });

  it('keeps it in sessionStorage, not localStorage', () => {
    saveStartPageState({ kind: 'all', query: '', scrollTop: 0, focusId: null });
    expect(sessionStorage.getItem(START_PAGE_STATE_KEY)).not.toBeNull();
    expect(localStorage.getItem(START_PAGE_STATE_KEY)).toBeNull();
  });

  it('is null when nothing is saved', () => {
    expect(loadStartPageState()).toBeNull();
  });

  it.each([
    'not json',
    'null',
    '[]',
    '{"kind":"games","query":"","scrollTop":0,"focusId":null}',
    '{"kind":"demo","query":5,"scrollTop":0,"focusId":null}',
    '{"kind":"demo","query":"","scrollTop":"0","focusId":null}',
    '{"kind":"demo","query":"","scrollTop":0,"focusId":7}',
    '{"kind":"demo","query":"","scrollTop":0}',
  ])('ignores %s', (raw) => {
    sessionStorage.setItem(START_PAGE_STATE_KEY, raw);
    expect(loadStartPageState()).toBeNull();
  });

  it('never throws when storage does', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('blocked', 'SecurityError');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('full', 'QuotaExceededError');
    });
    expect(loadStartPageState()).toBeNull();
    expect(() =>
      saveStartPageState({ kind: 'all', query: '', scrollTop: 0, focusId: null })
    ).not.toThrow();
  });
});
