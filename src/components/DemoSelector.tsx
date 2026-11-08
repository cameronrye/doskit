/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * Demo Selector Component
 * Allows users to select and load different DOS applications and demos
 * Styled with retro-floppy for authentic retro aesthetic
 */

import { useState, useCallback, useRef, useEffect, useId } from 'react';
import { FloppyDisk, LIGHT_FLOPPY_THEME, type FloppyLabel, type FloppyTheme } from 'retro-floppy';
import 'retro-floppy/dist/retro-floppy.css';
import type { DosApp } from '../types/dos-app';
import type { LoadProgress } from '../utils/diskLoader';
import { getUserFriendlyError, type FriendlyError } from '../utils/errorMessages';
import { availableApps } from '../config/apps.config';
import './DemoSelector.css';

export interface LoadedApp {
  app: DosApp;
  files: Uint8Array;
  dosboxConf: string;
}

interface DemoSelectorProps {
  onSelect: (loadedApp: LoadedApp) => void;
  onCancel?: () => void;
  /** A warning to show above the disks, such as that a link names an app that does not exist */
  notice?: string | null;
}

/**
 * Count the apps on the first row of the rendered grid. Its auto-fill columns
 * follow the viewport width, so measure on each use. A grid without layout
 * (hidden, or no layout engine) counts as a single column.
 */
function countGridColumns(grid: HTMLElement | null): number {
  const items = grid ? Array.from(grid.children) : [];
  const first = items[0];
  if (!(first instanceof HTMLElement) || first.offsetWidth === 0) {
    return 1;
  }
  const firstOnNextRow = items.findIndex(
    (item) => item instanceof HTMLElement && item.offsetTop !== first.offsetTop
  );
  return firstOnNextRow === -1 ? items.length : firstOnNextRow;
}

/** "Name by Author (year)", leaving out the author or year an app does not give */
function describeApp({ name, author, year }: DosApp): string {
  return `${name}${author ? ` by ${author}` : ''}${year ? ` (${year})` : ''}`;
}

/*
 * A disk's theme and label, made once. FloppyDisk draws again, and measures its label, for
 * any new object, and the selector renders again for each chunk of a download's progress.
 */
const FLOPPY_THEME: FloppyTheme = {
  ...LIGHT_FLOPPY_THEME,
  enableGradient: true,
  gradientType: 'auto',
};
const floppyLabels = new WeakMap<DosApp, FloppyLabel>();

function floppyLabel(app: DosApp): FloppyLabel {
  let label = floppyLabels.get(app);
  if (!label) {
    label = {
      name: app.name,
      author: app.author,
      year: app.year?.toString(),
      description: app.description,
      type: app.loadMethod.toUpperCase(),
    };
    floppyLabels.set(app, label);
  }
  return label;
}

/**
 * retro-floppy renders each disk as a focusable, named button of its own. In the list, the
 * option around it is the disk: one tab stop and one name, with no control inside it. React
 * sets these attributes again only if their values change, which they don't here.
 */
function quietFloppyDisk(option: HTMLElement | null) {
  const disk = option?.querySelector('figure');
  for (const attribute of ['tabindex', 'role', 'aria-label', 'aria-disabled']) {
    disk?.removeAttribute(attribute);
  }
}

/**
 * The controls in an element that Tab stops at, in Tab order: the dialog gives none a
 * tabindex above 0, so that is their order on the page
 */
function tabStopsIn(root: HTMLElement | null): HTMLElement[] {
  const focusable = root?.querySelectorAll<HTMLElement>('button, summary, [href], [tabindex]');
  return Array.from(focusable ?? []).filter(
    (element) =>
      element.tabIndex >= 0 && !(element instanceof HTMLButtonElement && element.disabled)
  );
}

/**
 * What the progress bar shows: the share of the archive downloaded when its size is known,
 * or else the megabytes received, with no percentage for the bar
 */
function describeProgress(progress: LoadProgress | null): { percent: number | null; text: string } {
  if (!progress) {
    return { percent: null, text: 'Starting download…' };
  }
  const { loadedBytes, totalBytes } = progress;
  if (totalBytes) {
    // Rounded down, so that 100% means every byte is in
    const percent = Math.min(100, Math.floor((loadedBytes / totalBytes) * 100));
    return { percent, text: `Downloading… ${percent}%` };
  }
  return { percent: null, text: `Downloading… ${(loadedBytes / 1_000_000).toFixed(1)} MB` };
}

export function DemoSelector({ onSelect, onCancel, notice }: DemoSelectorProps) {
  const [selectedApp, setSelectedApp] = useState<DosApp | null>(null);
  const [focusedIndex, setFocusedIndex] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [loadProgress, setLoadProgress] = useState<LoadProgress | null>(null);
  const [error, setError] = useState<FriendlyError | null>(null);
  // The load that is running, if any: the app it loads, and what aborts it
  const loadRef = useRef<{ app: DosApp; controller: AbortController } | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const headingId = useId();
  // What had the focus when the selector opened, such as the header's Change Application
  const [opener] = useState(() => document.activeElement);
  // Whether the selector is closing from the keyboard, which gives the opener its focus back
  const closedByKeyboardRef = useRef(false);
  /**
   * DOSBox configs preloaded on hover, by app id. Only shares a preload with
   * the load that follows it: the module loader keeps the config chunks for
   * later selectors anyway.
   */
  const preloadedConfigsRef = useRef(new Map<string, Promise<string>>());

  /** Cancel current loading operation */
  const handleCancelLoading = useCallback(() => {
    loadRef.current?.controller.abort();
    loadRef.current = null;
    setIsLoading(false);
    setLoadProgress(null);
    setError(null);
  }, []);

  /**
   * Select an app. Choosing another app than the one downloading gives up its download, so
   * that the details below the disks always name the app that is loading.
   */
  const handleSelectApp = useCallback(
    (app: DosApp) => {
      if (loadRef.current && loadRef.current.app.id !== app.id) {
        handleCancelLoading();
      }
      setSelectedApp(app);
      setError(null);
    },
    [handleCancelLoading]
  );

  /**
   * Preload app configuration on hover for faster perceived loading
   * Uses a small delay to avoid preloading on quick mouse movements
   */
  const handleHoverStart = useCallback((app: DosApp) => {
    // Clear any existing timeout
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }

    // Delay preload to avoid unnecessary requests on quick mouse movements
    hoverTimeoutRef.current = setTimeout(() => {
      const preloadedConfigs = preloadedConfigsRef.current;
      if (!preloadedConfigs.has(app.id) && app.loadDosboxConf) {
        // Start preloading the config (don't await, just start the promise).
        // Evict failures so a later load retries instead of reusing the rejection.
        const preload = app.loadDosboxConf();
        preloadedConfigs.set(app.id, preload);
        preload.catch(() => preloadedConfigs.delete(app.id));
      }
    }, 150);
  }, []);

  const handleHoverEnd = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
  }, []);

  /**
   * Load an application, with cancellation support. Takes the app rather than reading
   * the selection, which a double-click sets in the same event and is not visible here
   * until the next render. There is no time limit here: the download fails by itself
   * when no data arrives for a while, however long one that keeps going takes.
   */
  const handleLoadApp = useCallback(
    async (app: DosApp) => {
      // Already downloading it: another double-click or Enter would start over
      if (loadRef.current?.app.id === app.id) {
        return;
      }
      // Supersede any ongoing load. Each load checks its own controller, so a
      // cancelled or superseded load can never deliver its result.
      loadRef.current?.controller.abort();
      const controller = new AbortController();
      loadRef.current = { app, controller };

      setSelectedApp(app);
      setIsLoading(true);
      setError(null);
      setLoadProgress(null);

      try {
        // Use preloaded config if available, otherwise load it
        const configPromise =
          preloadedConfigsRef.current.get(app.id) ||
          (app.loadDosboxConf ? app.loadDosboxConf() : Promise.resolve(app.dosboxConf));

        // Load the application files and dosbox config in parallel with progress tracking.
        // A loader imports its config chunk first, unaware of the signal, so a load given up
        // meanwhile can report later: only the current load's progress shows.
        const [files, conf] = await Promise.all([
          app.loader((progress) => {
            if (!controller.signal.aborted) setLoadProgress(progress);
          }, controller.signal),
          configPromise,
        ]);

        // Cancelled or superseded while loading
        if (controller.signal.aborted) {
          return;
        }

        // Notify parent component with loaded data. The focus stays on the page as the
        // selector closes: js-dos gives DOS the keys pressed there.
        closedByKeyboardRef.current = false;
        onSelect({
          app,
          files,
          dosboxConf: conf,
        });
      } catch (err) {
        // Don't show an error for a cancelled or superseded load
        if (controller.signal.aborted) {
          return;
        }

        console.error('[DemoSelector] Error loading application:', err);
        loadRef.current = null;
        setError(getUserFriendlyError(err, { online: navigator.onLine }));
        setIsLoading(false);
        setLoadProgress(null);
      }
    },
    [onSelect]
  );

  /**
   * Close the selector. From the keyboard, the focus then goes back to what had it before:
   * Escape, or Close and Cancel activated by a key, whose click has no click count.
   */
  const handleCancel = useCallback(
    (fromKeyboard: boolean) => {
      handleCancelLoading();
      setSelectedApp(null);
      if (onCancel) {
        closedByKeyboardRef.current = fromKeyboard;
        onCancel();
      }
    },
    [handleCancelLoading, onCancel]
  );

  /**
   * Keys on a disk. The arrow keys, Home and End move to another disk and select it (only
   * move, while a download runs), Space selects the disk, and Enter loads it. The list's handler sees only keys from
   * inside it, so the buttons and the error's Details keep what Enter and Space do.
   */
  const handleDiskKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      const option =
        event.target instanceof Element
          ? event.target.closest<HTMLElement>('[role="option"]')
          : null;
      const index = availableApps.findIndex((app) => app.id === option?.dataset.appId);
      const app = availableApps[index];
      // Combinations belong to the browser and the system, such as Alt+Left for Back
      if (!app || event.altKey || event.ctrlKey || event.metaKey) {
        return;
      }

      const last = availableApps.length - 1;
      let next: number;
      switch (event.key) {
        case 'ArrowRight':
          next = index === last ? 0 : index + 1;
          break;
        case 'ArrowLeft':
          next = index === 0 ? last : index - 1;
          break;
        case 'ArrowDown':
          next = Math.min(index + countGridColumns(gridRef.current), last);
          break;
        case 'ArrowUp':
          next = Math.max(index - countGridColumns(gridRef.current), 0);
          break;
        case 'Home':
          next = 0;
          break;
        case 'End':
          next = last;
          break;
        case ' ':
          event.preventDefault();
          handleSelectApp(app);
          return;
        case 'Enter':
          event.preventDefault();
          handleLoadApp(app);
          return;
        default:
          return;
      }
      event.preventDefault();
      const nextApp = availableApps[next];
      if (nextApp) {
        setFocusedIndex(next);
        // The selection follows the focus, but not during a download: choosing another disk
        // gives the download up, which moving through the list should not do. Space or
        // Enter there still chooses.
        if (!isLoading) {
          handleSelectApp(nextApp);
        }
      }
    },
    [handleLoadApp, handleSelectApp, isLoading]
  );

  /**
   * Keys anywhere in the dialog. Escape cancels the download, or else closes the selector.
   * Tab and Shift+Tab go round the dialog's controls without leaving it, as it covers the
   * page.
   */
  const handleDialogKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Tab') {
        const stops = tabStopsIn(dialogRef.current);
        const first = stops[0];
        const last = stops[stops.length - 1];
        const focused = document.activeElement;
        if (!first || !last) {
          return;
        }
        if (event.shiftKey && (focused === first || focused === dialogRef.current)) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && focused === last) {
          event.preventDefault();
          first.focus();
        }
        return;
      }
      if (event.key !== 'Escape') {
        return;
      }
      event.preventDefault();
      if (isLoading) {
        handleCancelLoading();
      } else {
        handleCancel(true);
      }
    },
    [isLoading, handleCancelLoading, handleCancel]
  );

  // On unmount, cancel the load in progress and any pending hover preload. Closed from
  // the keyboard, give the focus back to what had it (focus() does nothing for an element
  // no longer on the page); otherwise it stays on the page, where js-dos gives DOS the keys.
  useEffect(() => {
    return () => {
      loadRef.current?.controller.abort();
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
      if (
        closedByKeyboardRef.current &&
        opener instanceof HTMLElement &&
        opener !== document.body
      ) {
        opener.focus();
      }
    };
  }, [opener]);

  // Focus management for keyboard navigation
  useEffect(() => {
    const focusedApp = availableApps[focusedIndex];
    if (focusedApp && gridRef.current) {
      const focusedElement = gridRef.current.querySelector(`[data-app-id="${focusedApp.id}"]`);
      if (focusedElement instanceof HTMLElement) {
        focusedElement.focus();
      }
    }
  }, [focusedIndex]);

  const progress = describeProgress(loadProgress);

  return (
    // tabIndex -1: a click on the dialog's background keeps the focus in it
    <div
      ref={dialogRef}
      className="demo-selector"
      onKeyDown={handleDialogKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby={headingId}
      tabIndex={-1}
    >
      <div className="demo-selector-header">
        <h2 id={headingId}>Select DOS Application</h2>
        {onCancel && (
          <button
            className="close-button"
            onClick={(event) => handleCancel(event.detail === 0)}
            aria-label="Close"
          >
            ✕
          </button>
        )}
      </div>

      {/* Outside the disks' scrolling area, which opening the selector scrolls to its focus */}
      {notice && (
        <p className="selector-notice" role="alert">
          <span aria-hidden="true">⚠ </span>
          {notice}
        </p>
      )}

      <div className="demo-selector-content">
        {/* Application List - Floppy Disk Grid, one tab stop with a roving focus */}
        <div
          className="app-list floppy-grid"
          ref={gridRef}
          role="listbox"
          aria-label="DOS applications"
          onKeyDown={handleDiskKeyDown}
        >
          {availableApps.map((app, index) => (
            <div
              key={app.id}
              ref={quietFloppyDisk}
              data-app-id={app.id}
              role="option"
              aria-selected={selectedApp?.id === app.id}
              aria-label={`${describeApp(app)}. Press Enter to load.`}
              tabIndex={index === focusedIndex ? 0 : -1}
              className="floppy-wrapper"
              onFocus={() => setFocusedIndex(index)}
              onClick={() => {
                setFocusedIndex(index);
                handleSelectApp(app);
              }}
              onDoubleClick={() => {
                setFocusedIndex(index);
                handleLoadApp(app); // Pass app directly to avoid race condition
              }}
              onMouseEnter={() => handleHoverStart(app)}
              onMouseLeave={handleHoverEnd}
            >
              <FloppyDisk
                size="medium"
                theme={FLOPPY_THEME}
                selected={selectedApp?.id === app.id}
                enableSlideHover={false}
                label={floppyLabel(app)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Selected App Details: a footer that stays in view while the disks scroll */}
      {selectedApp && (
        <div className="app-details" role="region">
          {/* Announced when the app changes; the progress below is not, as it changes often */}
          <div className="app-summary" aria-live="polite">
            <h3>Selected: {selectedApp.name}</h3>
            <p>{selectedApp.description}</p>
          </div>

          <div className="app-actions">
            {isLoading ? (
              <button
                className="cancel-loading-button"
                onClick={handleCancelLoading}
                aria-label="Cancel loading"
              >
                Cancel Loading
              </button>
            ) : (
              <>
                <button className="load-button" onClick={() => handleLoadApp(selectedApp)}>
                  Load Application
                </button>
                <button
                  className="cancel-button"
                  onClick={(event) => handleCancel(event.detail === 0)}
                >
                  Cancel
                </button>
              </>
            )}
          </div>

          {error && (
            <div className="error-message" role="alert">
              <p className="error-message-text">{error.message}</p>
              {error.suggestion && <p className="error-suggestion">{error.suggestion}</p>}
              {error.originalError && (
                <details className="error-details">
                  <summary>Details</summary>
                  <code>{error.originalError}</code>
                </details>
              )}
            </div>
          )}

          {isLoading && (
            <div className="load-progress">
              {/* Without a size to measure against, an indeterminate bar: no aria-valuenow */}
              <div
                className={`progress-bar${progress.percent === null ? ' indeterminate' : ''}`}
                role="progressbar"
                aria-label="Download progress"
                aria-valuenow={progress.percent ?? undefined}
                aria-valuemin={progress.percent === null ? undefined : 0}
                aria-valuemax={progress.percent === null ? undefined : 100}
              >
                <div
                  className="progress-fill"
                  style={progress.percent === null ? undefined : { width: `${progress.percent}%` }}
                />
              </div>
              <p className="progress-text">{progress.text}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
