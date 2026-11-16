/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 */

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import DosWindow from './DosWindow';
import KeyHint from './KeyHint';
import SiteFooter from './SiteFooter';
import { ProductionGrid } from './ProductionGrid';
import {
  KIND_TABS,
  countByKind,
  filterProductions,
  kindLabel,
  pickRandom,
  shortYear,
  type KindFilter,
} from '../utils/productionFilter';
import { loadStartPageState, saveStartPageState } from '../utils/startPageState';
import { formatSize } from '../utils/formatSize';
import type { DosApp } from '../types/dos-app';
import './StartPage.css';

interface StartPageProps {
  apps: readonly DosApp[];
  /** An alert above the grid, such as for a link to no production */
  notice: string | null;
  onOpen: (app: DosApp) => void;
  onOpenPrompt: () => void;
}

/** The page at `/`: kinds, search, and every production as a link */
export function StartPage({ apps, notice, onOpen, onOpenPrompt }: StartPageProps) {
  const [saved] = useState(loadStartPageState);
  const [kind, setKind] = useState<KindFilter>(() =>
    saved && countByKind(apps)[saved.kind] > 0 ? saved.kind : 'all'
  );
  const [query, setQuery] = useState(saved?.query ?? '');
  // Only the grid of the first view takes focus; once the visitor searches or picks a kind, a
  // remount, such as after a search that matched nothing, must leave it in the search
  const [restoreFocus, setRestoreFocus] = useState(saved?.focusId != null);
  const [activeId, setActiveId] = useState<string | null>(saved?.focusId ?? null);
  const rootRef = useRef<HTMLElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const scrollTop = useRef(saved?.scrollTop ?? 0);

  const counts = useMemo(() => countByKind(apps), [apps]);
  const shown = useMemo(() => filterProductions(apps, kind, query), [apps, kind, query]);
  const active = shown.find((app) => app.id === activeId) ?? shown[0];

  useLayoutEffect(() => {
    if (rootRef.current) rootRef.current.scrollTop = scrollTop.current;
  }, []);

  // Focus on the page itself, so its shortcut keys work before anything is tabbed to
  useEffect(() => {
    if (saved?.focusId == null) rootRef.current?.focus({ preventScroll: true });
  }, [saved]);

  const latest = useRef({ kind, query, focusId: activeId });
  useLayoutEffect(() => {
    latest.current = { kind, query, focusId: activeId };
  });

  // Every change saves; leaving by any route, such as Back, saves the scroll position too
  useEffect(() => {
    saveStartPageState({ ...latest.current, scrollTop: scrollTop.current });
  }, [kind, query, activeId]);
  useEffect(
    () => () => saveStartPageState({ ...latest.current, scrollTop: scrollTop.current }),
    []
  );

  const saveScroll = () => {
    if (rootRef.current) scrollTop.current = rootRef.current.scrollTop;
    saveStartPageState({ ...latest.current, scrollTop: scrollTop.current });
  };

  const open = (app: DosApp) => {
    saveScroll();
    onOpen(app);
  };

  const openPrompt = () => {
    saveScroll();
    onOpenPrompt();
  };

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLElement>) => {
      if (event.ctrlKey || event.altKey || event.metaKey || event.repeat) return;
      const target = event.target as HTMLElement;
      if (target.closest('input, textarea, [contenteditable]')) return;
      if (event.key === '/') {
        event.preventDefault();
        searchRef.current?.focus();
      } else if (event.key === 'r' || event.key === 'R') {
        const app = pickRandom(shown) ?? pickRandom(apps);
        if (app) open(app);
      }
    },
    // open reads only refs and props
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [shown, apps, onOpen]
  );

  const handleSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Escape') return;
    if (query) {
      setQuery('');
    } else {
      event.currentTarget.blur();
      // So that / and R work again
      rootRef.current?.focus({ preventScroll: true });
    }
  };

  const year = active ? shortYear(active.year) : null;

  return (
    <main
      className="start-page"
      tabIndex={-1}
      ref={rootRef}
      onKeyDown={handleKeyDown}
      onScroll={() => {
        if (rootRef.current) scrollTop.current = rootRef.current.scrollTop;
      }}
    >
      <div className="copper" />
      <header className="start-header">
        <h1 className="start-logo display-shadow">DosKit</h1>
        <p className="start-tagline">
          The PC demoscene, 1990–1997, running in your browser. {apps.length} productions.
        </p>
      </header>
      <div className="copper copper--blue" />

      <div className="dos-menu start-menu">
        <div role="group" aria-label="Kinds" className="start-kinds">
          {KIND_TABS.filter((tab) => counts[tab.kind] > 0).map((tab) => (
            <button
              key={tab.kind}
              type="button"
              className="dos-menu-item"
              aria-pressed={kind === tab.kind}
              onClick={() => {
                setRestoreFocus(false);
                setKind(tab.kind);
              }}
            >
              {tab.label} {counts[tab.kind]}
            </button>
          ))}
        </div>
        <button type="button" className="dos-menu-item" onClick={openPrompt}>
          C:\&gt; DOS prompt
        </button>
        <input
          ref={searchRef}
          className="start-search"
          type="search"
          aria-label="Search productions"
          placeholder="Search"
          value={query}
          onChange={(event) => {
            setRestoreFocus(false);
            setQuery(event.target.value);
          }}
          onKeyDown={handleSearchKeyDown}
        />
      </div>

      <div role="status" className="visually-hidden">
        {shown.length === 1 ? '1 production' : `${shown.length} productions`}
      </div>

      <div className="start-body">
        <div className="start-main">
          {notice && (
            <p role="alert" className="start-notice">
              {notice}
            </p>
          )}
          {shown.length > 0 ? (
            <ProductionGrid
              apps={shown}
              label="Productions"
              onOpen={open}
              activeId={activeId}
              onActiveChange={(app) => setActiveId(app.id)}
              autoFocusActive={restoreFocus}
            />
          ) : (
            <div className="start-empty">
              <p>Nothing matches “{query.trim()}”.</p>
              <button type="button" className="start-clear" onClick={() => setQuery('')}>
                Clear search
              </button>
            </div>
          )}
        </div>

        {active && (
          <aside className="start-info" aria-label="Highlighted production">
            <DosWindow
              title={year ? `${kindLabel(active.kind)} · ${active.year}` : kindLabel(active.kind)}
            >
              <div className="start-info-body">
                <h2 className="start-info-name">{active.name}</h2>
                {active.author && <p className="start-info-author">{active.author}</p>}
                <p>{active.description}</p>
                <p>{formatSize(active.archiveBytes)}</p>
                {active.flashing && (
                  <p className="start-info-warning">
                    <span aria-hidden="true">⚠ </span>
                    Contains flashing lights, which may affect people with photosensitive epilepsy.
                  </p>
                )}
                {active.contentNote && (
                  <p className="start-info-warning">
                    <span aria-hidden="true">⚠ </span>
                    {active.contentNote}
                  </p>
                )}
                <KeyHint keyName="Enter">Open</KeyHint>
              </div>
            </DosWindow>
          </aside>
        )}
      </div>

      <div className="start-shortcuts">
        <KeyHint keyName="↑↓←→">Choose</KeyHint>
        <KeyHint keyName="Enter">Open</KeyHint>
        <KeyHint keyName="/">Search</KeyHint>
        <KeyHint keyName="R">Random</KeyHint>
      </div>
      <SiteFooter />
    </main>
  );
}
