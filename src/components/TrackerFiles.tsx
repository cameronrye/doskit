/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * A tracker's files: what DosKit has kept of what it saved, and ways to download them, to
 * bring in modules of one's own, and to start over
 */

import { useEffect, useId, useRef, useState } from 'react';
import './AppInfo.css';

interface TrackerFilesProps {
  appName: string;
  /** When DosKit last kept the tracker's files, or null before it has */
  savedAt: number | null;
  /** Whether this browser can keep files at all */
  kept: boolean;
  /** Something to tell about the last action, such as a download with nothing to download */
  notice?: string | null;
  onDownload: () => void;
  onImport: (files: File[]) => void;
  onReset: () => void;
  onClose: () => void;
}

/** "21:05", in the visitor's own clock */
const timeOf = (at: number) =>
  new Date(at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

/** The module formats Impulse Tracker and Scream Tracker 3 load */
const MODULES = '.it,.s3m,.xm,.mod,.stm,.669,.mtm,.ult,.wav,.smp';

export function TrackerFiles({
  appName,
  savedAt,
  kept,
  notice = null,
  onDownload,
  onImport,
  onReset,
  onClose,
}: TrackerFilesProps) {
  const headingId = useId();
  const inputId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const [confirmingReset, setConfirmingReset] = useState(false);

  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  return (
    <>
      <div className="doskit-info-backdrop" onClick={onClose} />
      <div
        className="doskit-info"
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.preventDefault();
            onClose();
          }
        }}
      >
        <div className="doskit-info-header">
          <h2 id={headingId}>Your files</h2>
          <button ref={closeRef} className="doskit-info-close" aria-label="Close" onClick={onClose}>
            ✕
          </button>
        </div>

        <p role="status">
          {!kept
            ? `This browser can't keep files, as in some private windows: download what you save in ${appName} before you leave.`
            : savedAt === null
              ? `Save in ${appName} with its own save, and DosKit keeps what it writes in this browser, for your next visit.`
              : `What ${appName} saved was kept in this browser at ${timeOf(savedAt)}. Unsaved work in the tracker is not.`}
        </p>

        <div className="doskit-files-actions">
          <button className="doskit-files-button" onClick={onDownload}>
            Download your files (.zip)
          </button>
          <input
            id={inputId}
            className="doskit-files-input"
            type="file"
            multiple
            accept={MODULES}
            aria-label="Bring in modules"
            onChange={(event) => {
              const files = Array.from(event.target.files ?? []);
              event.target.value = '';
              if (files.length > 0) onImport(files);
            }}
          />
          <label className="doskit-files-button" htmlFor={inputId}>
            Bring in modules…
          </label>
        </div>
        {notice && <p className="doskit-files-notice">{notice}</p>}
        <p className="doskit-files-note">
          Modules you bring in appear in {appName}'s file list. {appName} restarts to read them:
          save your song first.
        </p>

        <section>
          <h3>Start over</h3>
          {confirmingReset ? (
            <div className="doskit-files-actions">
              <p>Delete the files kept for {appName} and restart it as it came?</p>
              <button className="doskit-files-button doskit-files-danger" onClick={onReset}>
                Delete them and restart
              </button>
              <button className="doskit-files-button" onClick={() => setConfirmingReset(false)}>
                Keep them
              </button>
            </div>
          ) : (
            <button className="doskit-files-button" onClick={() => setConfirmingReset(true)}>
              Start over
            </button>
          )}
        </section>
      </div>
    </>
  );
}
