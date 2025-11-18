/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * DosPlayerUI Component
 * Handles the UI rendering for the DOS player (loading, error, container)
 */

import React from "react";
import "./DosPlayer.css";

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
  className = "",
  style = {},
}) => {
  return (
    <div className={`dos-player-wrapper ${className}`} style={style}>
      {/* Loading indicator */}
      {isLoading && !error && (
        <div className="dos-player-loading">
          <div className="dos-player-spinner"></div>
          <p>Loading DOS emulator...</p>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="dos-player-error">
          <h3>Error</h3>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Reload Page</button>
        </div>
      )}

      {/* DOS container */}
      <div
        ref={dosContainerRef}
        className="dos-player-container"
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
};

export default DosPlayerUI;
