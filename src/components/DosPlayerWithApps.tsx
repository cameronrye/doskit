/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * DosPlayer with Application Support
 * Enhanced DosPlayer that supports loading different DOS applications
 */

import { useState, useCallback, useEffect } from 'react';
import { DosPlayer } from './DosPlayer';
import { DemoSelector, type DosApp } from './DemoSelector';
import type { DosOptions, CommandInterface } from '../types/js-dos';
import type { InitFileEntry } from '../types/js-dos';
import './DosPlayerWithApps.css';

// Re-export DosApp type for use in parent components
export type { DosApp };

interface DosPlayerWithAppsProps {
  onReady?: (ci: CommandInterface) => void;
  onExit?: () => void;
  className?: string;
  showSelector?: boolean;
  onAppChange?: (app: DosApp | null) => void;
  onSelectorVisibilityChange?: (visible: boolean) => void;
}

export function DosPlayerWithApps({
  onReady,
  onExit,
  className,
  showSelector = false,
  onAppChange,
  onSelectorVisibilityChange,
}: DosPlayerWithAppsProps) {
  const [selectedApp, setSelectedApp] = useState<DosApp | null>(null);
  const [appFiles, setAppFiles] = useState<InitFileEntry[] | Uint8Array | null>(null);
  const [isLoadingApp, setIsLoadingApp] = useState(false);
  const [showAppSelector, setShowAppSelector] = useState(showSelector);
  const [error, setError] = useState<string | null>(null);

  // Sync showSelector prop with local state
  useEffect(() => {
    setShowAppSelector(showSelector);
  }, [showSelector]);

  const handleSelectApp = useCallback(async (app: DosApp) => {
    setIsLoadingApp(true);
    setError(null);

    try {
      // Load the application files
      const files = await app.loader();
      setAppFiles(files);
      setSelectedApp(app);
      setShowAppSelector(false);
      onAppChange?.(app);
      onSelectorVisibilityChange?.(false);
    } catch (err) {
      console.error('[DosPlayerWithApps] Error loading application:', err);
      setError(err instanceof Error ? err.message : 'Failed to load application');
    } finally {
      setIsLoadingApp(false);
    }
  }, [onAppChange, onSelectorVisibilityChange]);

  const handleCancelSelector = useCallback(() => {
    setShowAppSelector(false);
    onSelectorVisibilityChange?.(false);
  }, [onSelectorVisibilityChange]);

  const handleReset = useCallback(() => {
    setSelectedApp(null);
    setAppFiles(null);
    setError(null);
    setShowAppSelector(true);
    onAppChange?.(null);
    onSelectorVisibilityChange?.(true);
  }, [onAppChange, onSelectorVisibilityChange]);

  // Build DosPlayer options
  const dosOptions: Partial<DosOptions> = selectedApp
    ? {
        initFs: appFiles || undefined,
      }
    : {};

  const dosboxConf = selectedApp?.dosboxConf;

  return (
    <div className={`dos-player-with-apps ${className || ''}`}>
      {/* Application Selector Modal */}
      {showAppSelector && (
        <>
          <div className="selector-overlay" onClick={handleCancelSelector} />
          <DemoSelector onSelect={handleSelectApp} onCancel={handleCancelSelector} />
        </>
      )}

      {/* Loading State */}
      {isLoadingApp && (
        <div className="loading-overlay">
          <div className="loading-spinner" />
          <p>Loading application...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="error-overlay">
          <div className="error-box">
            <h3>Error Loading Application</h3>
            <p>{error}</p>
            <button onClick={handleReset}>Try Again</button>
          </div>
        </div>
      )}

      {/* DOS Player */}
      <DosPlayer
        key={selectedApp?.id || 'default'}  // Force remount when app changes
        dosboxConf={dosboxConf}
        options={dosOptions}
        onReady={onReady}
        onExit={onExit}
        className="dos-player-instance"
      />
    </div>
  );
}

