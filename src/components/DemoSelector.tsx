/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * Demo Selector Component
 * Allows users to select and load different DOS applications and demos
 * Styled with retro-floppy for authentic retro aesthetic
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { FloppyDisk, LIGHT_FLOPPY_THEME } from 'retro-floppy';
import 'retro-floppy/dist/retro-floppy.css';
import type { DosApp } from '../types/dos-app';
import type { InitFileEntry } from '../types/js-dos';
import type { LoadProgress } from '../utils/diskLoader';
import { getUserFriendlyError, type FriendlyError } from '../utils/errorMessages';
import { availableApps, findAppById } from '../config/apps.config';
import './DemoSelector.css';

// Re-export for backward compatibility
export type { DosApp };
// eslint-disable-next-line react-refresh/only-export-components
export { availableApps, findAppById };

export interface LoadedApp {
  app: DosApp;
  files: InitFileEntry[] | Uint8Array;
  dosboxConf: string;
}

interface DemoSelectorProps {
  onSelect: (loadedApp: LoadedApp) => void;
  onCancel?: () => void;
}

/** Default loading timeout in milliseconds (30 seconds) */
const LOADING_TIMEOUT_MS = 30000;

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

export function DemoSelector({ onSelect, onCancel }: DemoSelectorProps) {
  const [selectedApp, setSelectedApp] = useState<DosApp | null>(null);
  const [focusedIndex, setFocusedIndex] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [loadProgress, setLoadProgress] = useState<LoadProgress | null>(null);
  const [error, setError] = useState<FriendlyError | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /**
   * DOSBox configs preloaded on hover, by app id. Only shares a preload with
   * the load that follows it: the module loader keeps the config chunks for
   * later selectors anyway.
   */
  const preloadedConfigsRef = useRef(new Map<string, Promise<string>>());

  const handleSelectApp = useCallback((app: DosApp) => {
    setSelectedApp(app);
    setError(null);
  }, []);

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
   * Load an application with a timeout and cancellation support. Takes the app
   * rather than reading the selection, which a double-click sets in the same
   * event and is not visible here until the next render.
   */
  const handleLoadApp = useCallback(
    async (app: DosApp) => {
      // Supersede any ongoing load. Each load checks its own controller, so a
      // cancelled or superseded load can never deliver its result.
      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;

      setIsLoading(true);
      setError(null);
      setLoadProgress(null);

      // Set up timeout
      const timeoutId = setTimeout(() => {
        if (abortControllerRef.current !== controller) return; // already cancelled/superseded
        controller.abort();
        const timedOut = new Error(`Loading timed out after ${LOADING_TIMEOUT_MS / 1000} seconds`);
        setError(getUserFriendlyError(timedOut, { online: navigator.onLine }));
        setIsLoading(false);
        setLoadProgress(null);
      }, LOADING_TIMEOUT_MS);

      try {
        // Use preloaded config if available, otherwise load it
        const configPromise =
          preloadedConfigsRef.current.get(app.id) ||
          (app.loadDosboxConf ? app.loadDosboxConf() : Promise.resolve(app.dosboxConf));

        // Load the application files and dosbox config in parallel with progress tracking
        const [files, conf] = await Promise.all([
          app.loader(setLoadProgress, controller.signal),
          configPromise,
        ]);

        // Cancelled, timed out, or superseded while loading
        if (controller.signal.aborted) {
          return;
        }

        // Notify parent component with loaded data
        onSelect({
          app,
          files,
          dosboxConf: conf,
        });
      } catch (err) {
        // Don't show an error for a cancelled or superseded load (a timeout
        // has already set its own message)
        if (controller.signal.aborted) {
          return;
        }

        console.error('[DemoSelector] Error loading application:', err);
        setError(getUserFriendlyError(err, { online: navigator.onLine }));
        setIsLoading(false);
        setLoadProgress(null);
      } finally {
        clearTimeout(timeoutId);
      }
    },
    [onSelect]
  );

  /** Cancel current loading operation */
  const handleCancelLoading = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
    setLoadProgress(null);
    setError(null);
  }, []);

  const handleCancel = useCallback(() => {
    handleCancelLoading();
    setSelectedApp(null);
    onCancel?.();
  }, [handleCancelLoading, onCancel]);

  /** Keyboard navigation handler */
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      const totalApps = availableApps.length;

      switch (event.key) {
        case 'ArrowRight':
          event.preventDefault();
          setFocusedIndex((prev) => (prev + 1) % totalApps);
          break;
        case 'ArrowLeft':
          event.preventDefault();
          setFocusedIndex((prev) => (prev - 1 + totalApps) % totalApps);
          break;
        case 'ArrowDown': {
          event.preventDefault();
          const columns = countGridColumns(gridRef.current);
          setFocusedIndex((prev) => Math.min(prev + columns, totalApps - 1));
          break;
        }
        case 'ArrowUp': {
          event.preventDefault();
          const columns = countGridColumns(gridRef.current);
          setFocusedIndex((prev) => Math.max(prev - columns, 0));
          break;
        }
        case 'Enter':
          event.preventDefault();
          if (selectedApp) {
            handleLoadApp(selectedApp);
          } else {
            const app = availableApps[focusedIndex];
            if (app) {
              handleSelectApp(app);
            }
          }
          break;
        case ' ': {
          event.preventDefault();
          const app = availableApps[focusedIndex];
          if (app) {
            handleSelectApp(app);
          }
          break;
        }
        case 'Escape':
          event.preventDefault();
          if (isLoading) {
            handleCancelLoading();
          } else {
            handleCancel();
          }
          break;
      }
    },
    [
      focusedIndex,
      selectedApp,
      isLoading,
      handleLoadApp,
      handleSelectApp,
      handleCancelLoading,
      handleCancel,
    ]
  );

  // On unmount, cancel the load in progress and any pending hover preload
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

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
    <div
      className="demo-selector"
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-label="Select DOS Application"
    >
      <div className="demo-selector-header">
        <h2>Select DOS Application</h2>
        {onCancel && (
          <button className="close-button" onClick={handleCancel} aria-label="Close">
            ✕
          </button>
        )}
      </div>

      <div className="demo-selector-content">
        {/* Application List - Floppy Disk Grid */}
        <div
          className="app-list floppy-grid"
          ref={gridRef}
          role="grid"
          aria-label="Available DOS applications"
        >
          {availableApps.map((app, index) => (
            <div
              key={app.id}
              data-app-id={app.id}
              tabIndex={index === focusedIndex ? 0 : -1}
              className="floppy-wrapper"
              onFocus={() => setFocusedIndex(index)}
              onMouseEnter={() => handleHoverStart(app)}
              onMouseLeave={handleHoverEnd}
            >
              <FloppyDisk
                size="medium"
                theme={{
                  ...LIGHT_FLOPPY_THEME,
                  enableGradient: true,
                  gradientType: 'auto',
                }}
                selected={selectedApp?.id === app.id}
                enableSlideHover={false}
                label={{
                  name: app.name,
                  author: app.author,
                  year: app.year?.toString(),
                  description: app.description,
                  type: app.loadMethod.toUpperCase(),
                }}
                onClick={() => {
                  setFocusedIndex(index);
                  handleSelectApp(app);
                }}
                onDoubleClick={() => {
                  setFocusedIndex(index);
                  handleSelectApp(app);
                  handleLoadApp(app); // Pass app directly to avoid race condition
                }}
                ariaLabel={`${describeApp(app)}. Press Enter to load, Space to select.`}
              />
            </div>
          ))}
        </div>

        {/* Selected App Details */}
        {selectedApp && (
          <div className="app-details" role="region">
            {/* Announced when the app changes; the progress below is not, as it changes often */}
            <div aria-live="polite">
              <h3>Selected: {selectedApp.name}</h3>
              <p>{selectedApp.description}</p>
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
                    style={
                      progress.percent === null ? undefined : { width: `${progress.percent}%` }
                    }
                  />
                </div>
                <p className="progress-text">{progress.text}</p>
              </div>
            )}

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
                  <button
                    className="load-button"
                    onClick={() => handleLoadApp(selectedApp)}
                    disabled={isLoading}
                  >
                    Load Application
                  </button>
                  <button className="cancel-button" onClick={handleCancel}>
                    Cancel
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
