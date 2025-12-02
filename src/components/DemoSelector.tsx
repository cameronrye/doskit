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
import { type LoadProgress } from '../utils/diskLoader';
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

/** Cache for preloaded app configurations */
const preloadedConfigs = new Map<string, Promise<string>>();

export function DemoSelector({ onSelect, onCancel }: DemoSelectorProps) {
  const [selectedApp, setSelectedApp] = useState<DosApp | null>(null);
  const [focusedIndex, setFocusedIndex] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [loadProgress, setLoadProgress] = useState<LoadProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
      if (!preloadedConfigs.has(app.id) && app.loadDosboxConf) {
        // Start preloading the config (don't await, just start the promise)
        preloadedConfigs.set(app.id, app.loadDosboxConf());
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
   * Load an application with optional timeout and cancellation support
   * Fixed: Now accepts app parameter directly to avoid race condition with state
   */
  const handleLoadApp = useCallback(
    async (appToLoad?: DosApp) => {
      const app = appToLoad || selectedApp;
      if (!app) return;

      // Cancel any ongoing load
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      setIsLoading(true);
      setError(null);
      setLoadProgress({ loaded: 0, total: 1, currentFile: 'Starting...' });

      // Set up timeout
      const timeoutId = setTimeout(() => {
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
          setError('Loading timed out. Please check your internet connection and try again.');
          setIsLoading(false);
          setLoadProgress(null);
        }
      }, LOADING_TIMEOUT_MS);

      try {
        // Use preloaded config if available, otherwise load it
        const configPromise =
          preloadedConfigs.get(app.id) ||
          (app.loadDosboxConf ? app.loadDosboxConf() : Promise.resolve(app.dosboxConf));

        // Load the application files and dosbox config in parallel with progress tracking
        const [files, conf] = await Promise.all([app.loader(setLoadProgress), configPromise]);

        clearTimeout(timeoutId);

        // Check if aborted
        if (abortControllerRef.current?.signal.aborted) {
          return;
        }

        // Notify parent component with loaded data
        onSelect({
          app,
          files,
          dosboxConf: conf,
        });
      } catch (err) {
        clearTimeout(timeoutId);

        // Don't show error if intentionally cancelled
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }

        console.error('[DemoSelector] Error loading application:', err);
        // User-friendly error messages
        let errorMessage = 'Failed to load application. Please try again.';
        if (err instanceof Error) {
          if (err.message.includes('network') || err.message.includes('fetch')) {
            errorMessage = 'Network error. Please check your internet connection and try again.';
          } else if (err.message.includes('timeout')) {
            errorMessage = 'Loading timed out. The server may be slow. Please try again.';
          } else {
            errorMessage = err.message;
          }
        }
        setError(errorMessage);
        setIsLoading(false);
        setLoadProgress(null);
      }
    },
    [selectedApp, onSelect]
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
      const gridColumns = 3; // Assuming 3 columns in the grid
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
        case 'ArrowDown':
          event.preventDefault();
          setFocusedIndex((prev) => Math.min(prev + gridColumns, totalApps - 1));
          break;
        case 'ArrowUp':
          event.preventDefault();
          setFocusedIndex((prev) => Math.max(prev - gridColumns, 0));
          break;
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

  // Clean up abort controller on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
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
                ariaLabel={`${app.name} by ${app.author || 'Unknown'} (${app.year || 'Unknown year'}). Press Enter to load, Space to select.`}
              />
            </div>
          ))}
        </div>

        {/* Selected App Details */}
        {selectedApp && (
          <div className="app-details" role="region" aria-live="polite">
            <h3>Selected: {selectedApp.name}</h3>
            <p>{selectedApp.description}</p>

            {error && (
              <div className="error-message" role="alert">
                {error}
              </div>
            )}

            {loadProgress && (
              <div className="load-progress">
                <div
                  className="progress-bar"
                  role="progressbar"
                  aria-valuenow={(loadProgress.loaded / loadProgress.total) * 100}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div
                    className="progress-fill"
                    style={{
                      width: `${(loadProgress.loaded / loadProgress.total) * 100}%`,
                    }}
                  />
                </div>
                <p className="progress-text">
                  Loading {loadProgress.currentFile}... ({loadProgress.loaded}/{loadProgress.total})
                </p>
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
                    onClick={() => handleLoadApp()}
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
