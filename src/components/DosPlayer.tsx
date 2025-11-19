/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * DosPlayer Component
 * Main component that orchestrates the DOS emulator using the useDosEmulator hook
 */

import React from "react";
import type { DosOptions, CommandInterface } from "../types/js-dos";
import { defaultDosboxConfig } from "../config/dosbox.conf";
import { useDosEmulator } from "../hooks/useDosEmulator";
import { DosPlayerUI } from "./DosPlayerUI";

// js-dos is loaded via local script and available globally
// Type declaration is in src/types/js-dos.d.ts

export interface DosPlayerProps {
  /** Custom DOSBox configuration (overrides default) */
  dosboxConf?: string;
  /** Custom js-dos options (merged with defaults) */
  options?: Partial<DosOptions>;
  /** Callback when the emulator is ready */
  onReady?: (ci: CommandInterface) => void;
  /** Callback when the emulator exits */
  onExit?: () => void;
  /** Custom CSS class name */
  className?: string;
  /** Custom inline styles */
  style?: React.CSSProperties;
}

/**
 * Main DosPlayer component that orchestrates the emulator
 * Uses the useDosEmulator hook for logic and DosPlayerUI for rendering
 */
export const DosPlayer: React.FC<DosPlayerProps> = ({
  dosboxConf = defaultDosboxConfig,
  options = {},
  onReady,
  onExit,
  className = "",
  style = {},
}) => {
  const { dosContainerRef, isLoading, error } = useDosEmulator({
    dosboxConf,
    options,
    onReady,
    onExit,
  });

  return (
    <DosPlayerUI
      dosContainerRef={dosContainerRef}
      isLoading={isLoading}
      error={error}
      className={className}
      style={style}
    />
  );
};

export default DosPlayer;
