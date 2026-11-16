/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * DosPlayerUI Component
 * Handles the UI rendering for the DOS player (loading, error, container)
 */

import React from 'react';
import DosWindow from './DosWindow';
import './DosPlayer.css';

export interface DosPlayerUIProps {
  /** Ref to attach to the DOS container */
  dosContainerRef: React.RefObject<HTMLDivElement | null>;
  /** Whether the emulator is loading */
  isLoading: boolean;
  /** Error message if any */
  error: string | null;
  /** Custom CSS class name */
  className?: string;
  /** Custom inline styles */
  style?: React.CSSProperties;
}

/**
 * UI component for the DOS player
 * Displays loading state, error messages, and the DOS container
 */
export const DosPlayerUI: React.FC<DosPlayerUIProps> = ({
  dosContainerRef,
  isLoading,
  error,
  className = '',
  style = {},
}) => {
  return (
    <div className={`dos-player-wrapper ${className}`} style={style}>
      {/* While js-dos starts the emulator, as after Play: a status, which screen readers
          announce. Nothing on it moves. */}
      {isLoading && !error && (
        <div className="dos-player-loading" role="status">
          <p>Loading DOS emulator…</p>
        </div>
      )}

      {/* Why the emulator could not start, which screen readers announce at once */}
      {error && (
        <div className="dos-player-error" role="alert">
          <DosWindow title="Error">
            <p>{error}</p>
            <button type="button" onClick={() => window.location.reload()}>
              Reload Page
            </button>
          </DosWindow>
        </div>
      )}

      {/* DOS container */}
      <div
        ref={dosContainerRef}
        className="dos-player-container"
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
};
