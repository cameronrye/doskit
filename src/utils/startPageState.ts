/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * The start page's state for the browser session (tab, search, scroll and focus),
 * kept in sessionStorage so Back returns to where the visitor was. Like
 * safeLocalStorage, it never throws: a refused read is no state, and a refused
 * write is dropped.
 */

import { KIND_TABS, type KindFilter } from './productionFilter';

export interface StartPageState {
  kind: KindFilter;
  query: string;
  scrollTop: number;
  focusId: string | null;
}

export const START_PAGE_STATE_KEY = 'doskit:start-page';

/** The saved state, or null if there is none, it is unreadable, or it is not a state */
export function loadStartPageState(): StartPageState | null {
  try {
    const raw = window.sessionStorage.getItem(START_PAGE_STATE_KEY);
    if (raw === null) return null;
    const value: unknown = JSON.parse(raw);
    if (typeof value !== 'object' || value === null) return null;
    const { kind, query, scrollTop, focusId } = value as Record<string, unknown>;
    if (
      typeof kind !== 'string' ||
      !KIND_TABS.some((tab) => tab.kind === kind) ||
      typeof query !== 'string' ||
      typeof scrollTop !== 'number' ||
      !Number.isFinite(scrollTop) ||
      (focusId !== null && typeof focusId !== 'string')
    ) {
      return null;
    }
    return { kind: kind as KindFilter, query, scrollTop, focusId };
  } catch {
    return null;
  }
}

/** Save the state if the browser allows it */
export function saveStartPageState(state: StartPageState): void {
  try {
    window.sessionStorage.setItem(START_PAGE_STATE_KEY, JSON.stringify(state));
  } catch {
    // Not saved: storage is blocked or full
  }
}
