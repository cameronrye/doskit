/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 */

import { useEffect, useRef, useState } from 'react';
import type { KeyboardEvent, MouseEvent, Ref } from 'react';
import CrtScreen from './CrtScreen';
import DosWindow from './DosWindow';
import KeyHint from './KeyHint';
import SiteFooter from './SiteFooter';
import { ProductionGrid } from './ProductionGrid';
import { loadAppPage } from '../config/appPages';
import { thumbnailOf } from '../config/thumbnails';
import { describeProgress } from '../utils/describeProgress';
import type { FriendlyError } from '../utils/errorMessages';
import type { LoadProgress } from '../utils/diskLoader';
import { formatSize } from '../utils/formatSize';
import { kindLabel, moreByAuthor } from '../utils/productionFilter';
import type { KindFilter } from '../utils/productionFilter';
import { playLabelOf } from '../utils/playLabel';
import { shareLink, type ShareResult } from '../utils/share';
import { canonicalUrlOf } from '../utils/urlRouting';
import type { DosApp } from '../types/dos-app';
import './ProductionPage.css';

export type ProductionPageStatus =
  | { kind: 'loading'; progress: LoadProgress | null }
  | { kind: 'error'; error: FriendlyError }
  | { kind: 'ready' };

interface ProductionPageProps {
  app: DosApp;
  apps: readonly DosApp[];
  status: ProductionPageStatus;
  onPlay: () => void;
  onRetry: () => void;
  onCancel: () => void;
  onBrowse: (kind?: KindFilter) => void;
  onAbout: () => void;
  onOpenApp: (app: DosApp) => void;
  aboutButtonRef?: Ref<HTMLButtonElement>;
}

const SHARE_STATUS: Partial<Record<ShareResult, string>> = {
  copied: 'Link copied',
  failed: "Couldn't share this link",
};

/** A production's page: its screenshot and facts, Play, Share, and more by the same author */
export function ProductionPage({
  app,
  apps,
  status,
  onPlay,
  onRetry,
  onCancel,
  onBrowse,
  onAbout,
  onOpenApp,
  aboutButtonRef,
}: ProductionPageProps) {
  const rootRef = useRef<HTMLElement>(null);
  const playRef = useRef<HTMLButtonElement>(null);
  const tryAgainRef = useRef<HTMLButtonElement>(null);
  // The alt text and the share's outcome belong to the production they came for
  const [loadedAlt, setLoadedAlt] = useState<{ id: string; alt: string } | null>(null);
  const [outcome, setOutcome] = useState<{ id: string; result: ShareResult } | null>(null);
  // The "More by" strip's tab stop, which moves with the focus as the start page's grid's does
  const [moreActiveId, setMoreActiveId] = useState<string | null>(null);
  const imageAlt = loadedAlt?.id === app.id ? loadedAlt.alt : '';
  const shared = outcome?.id === app.id ? outcome.result : null;
  const more = moreByAuthor(app, apps);
  const kind = kindLabel(app.kind);

  // Put the focus where the page's keys work: on Play once it is ready, on Try Again after an
  // error, so that Enter tries again at once, else on the page. Only a lost focus (on body, or
  // on a control that unmounted, as Cancel does with the download and Try Again with the
  // error) or one on the page itself moves. A focus on a control, such as Share or a More-by
  // link, and one outside the page, such as the About dialog's, stay where they are.
  const statusKind = status.kind;
  useEffect(() => {
    const root = rootRef.current;
    const active = document.activeElement;
    const lost = !active || active === document.body || !active.isConnected;
    if (!root || !(lost || active === root)) return;
    if (statusKind === 'ready' && playRef.current) playRef.current.focus();
    else if (statusKind === 'error' && tryAgainRef.current) tryAgainRef.current.focus();
    else if (lost) root.focus();
  }, [statusKind]);

  useEffect(() => {
    let current = true;
    loadAppPage(app.id)
      .then((page) => {
        if (current) setLoadedAlt({ id: app.id, alt: page?.imageAlt ?? '' });
      })
      .catch(() => {});
    return () => {
      current = false;
    };
  }, [app.id]);

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    const target = event.target as HTMLElement;
    if (
      target.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"])') ||
      event.ctrlKey ||
      event.altKey ||
      event.metaKey ||
      event.repeat
    ) {
      return;
    }
    if (event.key === 'i' || event.key === 'I') {
      event.preventDefault();
      onAbout();
    } else if (event.key === 'Enter' && target === event.currentTarget && statusKind === 'ready') {
      // A button or link takes Enter itself; this is for the page's own focus
      event.preventDefault();
      onPlay();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      onBrowse();
    }
  };

  const handleHome = (event: MouseEvent) => {
    // Modified clicks, such as a new tab, belong to the browser
    if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) {
      return;
    }
    event.preventDefault();
    onBrowse();
  };

  const handleShare = async () => {
    const result = await shareLink({ title: app.name, url: canonicalUrlOf(app.id) });
    setOutcome({ id: app.id, result });
  };

  const download = status.kind === 'loading' ? describeProgress(status.progress) : null;

  return (
    <section
      ref={rootRef}
      className="production-page"
      aria-labelledby="production-title"
      tabIndex={-1}
      onKeyDown={handleKeyDown}
    >
      <div className="copper copper--thin" aria-hidden="true" />
      <header className="production-topbar">
        <a
          className="production-logo display-shadow display-shadow--small"
          href="/"
          onClick={handleHome}
        >
          DosKit
        </a>
        <nav className="production-breadcrumb" aria-label="Breadcrumb">
          <button type="button" onClick={() => onBrowse(app.kind)}>
            {kind}
          </button>
          <span aria-hidden="true"> › </span>
          <span aria-current="page">{app.name}</span>
        </nav>
        <span className="production-keys">
          <KeyHint keyName="I">About</KeyHint>
          <KeyHint keyName="Esc">Browse</KeyHint>
        </span>
      </header>

      {/* Not a main: the page sits in the one App runs the player in */}
      <div className="production-main">
        <CrtScreen src={thumbnailOf(app)} alt={imageAlt} size="large" loading="eager" />
        <div className="production-details">
          <h1 id="production-title" className="production-heading display-shadow">
            {app.name}
          </h1>
          <DosWindow title={app.year ? `${kind} · ${app.year}` : kind}>
            <div className="production-facts">
              {app.author && <p className="production-credit">{app.author}</p>}
              <p>{app.description}</p>
              <p className="production-size">{formatSize(app.archiveBytes)}</p>
              {app.flashing && (
                <p className="production-warning">
                  <span aria-hidden="true">⚠ </span>
                  Contains flashing lights, which may affect people with photosensitive epilepsy.
                </p>
              )}
              {app.contentNote && (
                <p className="production-warning">
                  <span aria-hidden="true">⚠ </span>
                  {app.contentNote}
                </p>
              )}
              {app.startNote && <p>{app.startNote}</p>}
            </div>
          </DosWindow>

          <div className="production-actions">
            {status.kind === 'loading' && download && (
              <div className="production-download">
                {/* Said once: the figure below changes with each chunk and stays out of
                    live regions */}
                <p role="status">Downloading {app.name}…</p>
                {/* Without a size to measure against, an indeterminate bar: no aria-valuenow */}
                <div
                  className={`production-bar-track${download.percent === null ? ' production-bar-unsized' : ''}`}
                  role="progressbar"
                  aria-label="Download progress"
                  aria-valuenow={download.percent ?? undefined}
                  aria-valuemin={download.percent === null ? undefined : 0}
                  aria-valuemax={download.percent === null ? undefined : 100}
                >
                  <div
                    className="production-bar-fill"
                    style={
                      download.percent === null ? undefined : { width: `${download.percent}%` }
                    }
                  />
                </div>
                <p
                  className="production-figure"
                  aria-hidden={download.percent !== null || undefined}
                >
                  {download.text}
                </p>
                <button type="button" className="production-button" onClick={onCancel}>
                  Cancel
                </button>
              </div>
            )}
            {status.kind === 'error' && (
              <div className="production-error" role="alert">
                <p>{status.error.message}</p>
                {status.error.suggestion && <p>{status.error.suggestion}</p>}
                {status.error.originalError && (
                  <details>
                    <summary>Details</summary>
                    <code>{status.error.originalError}</code>
                  </details>
                )}
                <button
                  type="button"
                  className="production-button"
                  ref={tryAgainRef}
                  onClick={onRetry}
                >
                  Try Again
                </button>
              </div>
            )}
            {status.kind === 'ready' && (
              <div className="production-play">
                <button type="button" className="doskit-play-button" ref={playRef} onClick={onPlay}>
                  {playLabelOf(app.kind)}
                </button>
                <KeyHint keyName="Enter">{playLabelOf(app.kind)}</KeyHint>
              </div>
            )}
            <div className="production-secondary">
              <button
                type="button"
                className="production-button"
                ref={aboutButtonRef}
                onClick={onAbout}
              >
                About
              </button>
              <button type="button" className="production-button" onClick={handleShare}>
                Share
              </button>
              <span role="status" className="production-share-status">
                {shared ? (SHARE_STATUS[shared] ?? '') : ''}
              </span>
            </div>
          </div>
        </div>
      </div>

      {more.length > 0 && app.author && (
        <div className="production-more">
          <h2 id="production-more-title" className="production-more-title">
            More by {app.author}
          </h2>
          <ProductionGrid
            apps={more}
            labelledBy="production-more-title"
            onOpen={onOpenApp}
            activeId={moreActiveId}
            onActiveChange={(next) => setMoreActiveId(next.id)}
            variant="strip"
          />
        </div>
      )}
      <SiteFooter />
    </section>
  );
}
