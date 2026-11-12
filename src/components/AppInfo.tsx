/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * About this production: what it is, who made it, where it was shown, how faithful DosKit's
 * version is, and its authors' terms, from its page file (src/apps/<id>.page.json)
 */

import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import type { AppPage, DosApp } from '../types/dos-app';
import { loadAppPage } from '../config/appPages';
import './AppInfo.css';

interface AppInfoProps {
  app: DosApp;
  onClose: () => void;
  /** More to show, such as a tracker's files, before the terms */
  children?: ReactNode;
}

/** The controls Tab stops at in an element, in Tab order */
function tabStopsIn(root: HTMLElement | null): HTMLElement[] {
  const focusable = root?.querySelectorAll<HTMLElement>('button, [href], input, [tabindex]');
  return Array.from(focusable ?? []).filter(
    (element) =>
      element.tabIndex >= 0 &&
      !(
        (element instanceof HTMLButtonElement || element instanceof HTMLInputElement) &&
        element.disabled
      )
  );
}

export function AppInfo({ app, onClose, children }: AppInfoProps) {
  // undefined while the page file loads, null for an app without one
  const [page, setPage] = useState<{ id: string; text: AppPage | null } | null>(null);
  const headingId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let current = true;
    loadAppPage(app.id).then(
      (text) => current && setPage({ id: app.id, text }),
      () => current && setPage({ id: app.id, text: null })
    );
    return () => {
      current = false;
    };
  }, [app.id]);

  // Keyboard users start inside the panel
  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  const loaded = page?.id === app.id;
  const text = loaded ? page.text : null;
  const release = [app.author, app.year].filter(Boolean).join(' · ');

  // Escape closes the panel; Tab goes round its controls without leaving it, as it covers
  // the page
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key !== 'Tab') return;
    const stops = tabStopsIn(panelRef.current);
    const first = stops[0];
    const last = stops[stops.length - 1];
    if (!first || !last) return;
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return (
    <>
      <div className="doskit-info-backdrop" onClick={onClose} />
      <div
        ref={panelRef}
        className="doskit-info"
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        onKeyDown={handleKeyDown}
      >
        <div className="doskit-info-header">
          <h2 id={headingId}>{app.name}</h2>
          <button ref={closeRef} className="doskit-info-close" aria-label="Close" onClick={onClose}>
            ✕
          </button>
        </div>
        {release && <p className="doskit-info-release">{release}</p>}

        {!loaded && <p className="doskit-info-loading">Loading…</p>}
        {loaded &&
          (text?.about ?? [app.description]).map((paragraph) => <p key={paragraph}>{paragraph}</p>)}

        {app.flashing && (
          <p className="doskit-info-warning">
            <span aria-hidden="true">⚠ </span>
            Contains flashing lights, which may affect people with photosensitive epilepsy.
          </p>
        )}

        {text?.released && (
          <section>
            <h3>Shown and released</h3>
            <p>{text.released}</p>
          </section>
        )}
        {text?.credits && (
          <section>
            <h3>Credits</h3>
            <p>{text.credits}</p>
          </section>
        )}
        {text?.accuracy && text.accuracy.length > 0 && (
          <section>
            <h3>How it runs here</h3>
            <ul>
              {text.accuracy.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </section>
        )}

        {children}

        {text?.terms && (
          <section>
            <h3>Terms</h3>
            <p>{text.terms}</p>
          </section>
        )}
        {text?.links && text.links.length > 0 && (
          <section>
            <h3>Elsewhere</h3>
            <ul className="doskit-info-links">
              {text.links.map((link) => (
                <li key={link.url}>
                  <a href={link.url} target="_blank" rel="noopener noreferrer">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}
        <section>
          <h3>For rights holders</h3>
          <p>
            If you made this production or hold its rights, and want it credited differently or
            taken down, email cameron@rye.dev and it will be done.
          </p>
        </section>
      </div>
    </>
  );
}
