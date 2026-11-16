/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 */

import type { Ref } from 'react';
import type { PlayerStatus } from './playerSession';
import './RunBar.css';

/** What the bar's status says for each status of the player */
const STATUS_LABELS: Record<PlayerStatus, string> = {
  idle: 'Idle',
  loading: 'Loading',
  ready: 'Ready',
  error: 'Error',
};

interface RunBarProps {
  /** The production's name, or 'DOS prompt' */
  title: string;
  /** 'Future Crew · 1993' */
  meta: string | null;
  status: PlayerStatus;
  isOnline: boolean;
  onBrowse: () => void;
  /** Absent for the prompt */
  onAbout?: () => void;
  /** Given to a tracker that saves, once ready */
  onFiles?: () => void;
  aboutButtonRef?: Ref<HTMLButtonElement>;
  filesButtonRef?: Ref<HTMLButtonElement>;
}

/** Keys must keep reaching DOS, so a click on the bar takes no focus */
const keepFocus = (event: React.MouseEvent) => event.preventDefault();

/** The one thin bar shown while a production runs */
export function RunBar({
  title,
  meta,
  status,
  isOnline,
  onBrowse,
  onAbout,
  onFiles,
  aboutButtonRef,
  filesButtonRef,
}: RunBarProps) {
  // Said aloud always, and shown only when something is not fine
  const quiet = status === 'ready' && isOnline;

  return (
    <div className="dos-menu run-bar">
      <button type="button" className="dos-menu-item" onMouseDown={keepFocus} onClick={onBrowse}>
        <span aria-hidden="true">◄ </span>Browse
      </button>
      <span className="run-bar-title">{title}</span>
      {meta && <span className="run-bar-meta">{meta}</span>}
      {/* A polite live region: screen readers announce each change */}
      <span role="status" className={`run-bar-status${quiet ? ' visually-hidden' : ''}`}>
        {STATUS_LABELS[status]} · {isOnline ? 'Online' : 'Offline'}
      </span>
      {onAbout && (
        <button
          type="button"
          ref={aboutButtonRef}
          className="dos-menu-item"
          onMouseDown={keepFocus}
          onClick={onAbout}
        >
          About
        </button>
      )}
      {onFiles && (
        <button
          type="button"
          ref={filesButtonRef}
          className="dos-menu-item"
          onMouseDown={keepFocus}
          onClick={onFiles}
        >
          Files
        </button>
      )}
    </div>
  );
}
