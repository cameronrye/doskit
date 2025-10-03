/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * DosPlayer Component
 * A React component that wraps js-dos functionality with proper lifecycle management
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import type { DosOptions, DosProps, CommandInterface, DosEvent } from '../types/js-dos';
import { getDefaultConfig } from '../config/jsdos.config';
import { defaultDosboxConfig } from '../config/dosbox.conf';
import './DosPlayer.css';

// js-dos is loaded via CDN and available globally
declare global {
  interface Window {
    Dos?: (element: HTMLDivElement, options?: Partial<DosOptions>) => DosProps;
  }
}

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

export const DosPlayer: React.FC<DosPlayerProps> = ({
  dosboxConf = defaultDosboxConfig,
  options = {},
  onReady,
  onExit,
  className = '',
  style = {},
}) => {
  const dosContainerRef = useRef<HTMLDivElement>(null);
  const dosPlayerRef = useRef<DosProps | null>(null);
  const ciRef = useRef<CommandInterface | null>(null);
  const isInitializedRef = useRef(false);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Store callbacks in refs to avoid recreating the event handler
  const onReadyRef = useRef(onReady);
  const onExitRef = useRef(onExit);

  useEffect(() => {
    onReadyRef.current = onReady;
    onExitRef.current = onExit;
  }, [onReady, onExit]);

  // Event handler for js-dos events (stable reference)
  const handleDosEvent = useCallback((event: DosEvent, arg?: unknown) => {
    if (import.meta.env.DEV) {
      console.log('[DosPlayer] Event:', event);
    }

    switch (event) {
      case 'emu-ready':
        if (import.meta.env.DEV) {
          console.log('[DosPlayer] Emulator ready');
        }
        setIsLoading(false);
        break;

      case 'ci-ready':
        if (import.meta.env.DEV) {
          console.log('[DosPlayer] Command Interface ready');
        }
        ciRef.current = arg as CommandInterface;
        setIsReady(true);

        // Set up exit handler
        if (ciRef.current) {
          ciRef.current.events().onExit(() => {
            if (import.meta.env.DEV) {
              console.log('[DosPlayer] DOS exited');
            }
            onExitRef.current?.();
          });

          // Set up stdout logging for debugging (only in development)
          if (import.meta.env.DEV) {
            ciRef.current.events().onStdout((message: string) => {
              console.log('[DOS]', message);
            });
          }
        }

        // Call the onReady callback
        if (onReadyRef.current && ciRef.current) {
          onReadyRef.current(ciRef.current);
        }
        break;

      case 'bnd-play':
        if (import.meta.env.DEV) {
          console.log('[DosPlayer] Play button clicked');
        }
        break;

      case 'fullscreen-change':
        if (import.meta.env.DEV) {
          console.log('[DosPlayer] Fullscreen changed:', arg);
        }
        break;

      default:
        if (import.meta.env.DEV) {
          console.log('[DosPlayer] Unknown event:', event, arg);
        }
    }
  }, []); // Stable reference - uses only refs which don't change

  // Initialize js-dos (only once)
  useEffect(() => {
    // Prevent double initialization (React Strict Mode in dev)
    if (isInitializedRef.current) {
      if (import.meta.env.DEV) {
        console.log('[DosPlayer] Already initialized, skipping');
      }
      return;
    }

    if (!dosContainerRef.current) {
      console.error('[DosPlayer] Container ref is null');
      return;
    }

    // Check if Dos is available
    if (!window.Dos) {
      console.error('[DosPlayer] Dos function not available. Make sure js-dos is loaded from CDN.');
      setError('DOS emulator library not loaded. Please refresh the page.');
      setIsLoading(false);
      return;
    }

    if (import.meta.env.DEV) {
      console.log('[DosPlayer] Initializing js-dos...');
    }
    isInitializedRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      // Merge default config with custom options
      const config = getDefaultConfig();
      const mergedOptions: Partial<DosOptions> = {
        ...config,
        ...options,
        dosboxConf,
        onEvent: handleDosEvent,
      };

      if (import.meta.env.DEV) {
        console.log('[DosPlayer] Configuration:', mergedOptions);
      }

      // Initialize js-dos
      dosPlayerRef.current = window.Dos(dosContainerRef.current, mergedOptions);

      if (import.meta.env.DEV) {
        console.log('[DosPlayer] js-dos initialized successfully');
      }
    } catch (err) {
      console.error('[DosPlayer] Failed to initialize js-dos:', err);
      setError(err instanceof Error ? err.message : 'Failed to initialize DOS emulator');
      setIsLoading(false);
      isInitializedRef.current = false; // Allow retry on error
    }

    // Cleanup function
    return () => {
      if (import.meta.env.DEV) {
        console.log('[DosPlayer] Component unmounting, cleaning up...');
      }
      if (dosPlayerRef.current) {
        dosPlayerRef.current.stop().catch((err: unknown) => {
          console.error('[DosPlayer] Error stopping player:', err);
        });
        dosPlayerRef.current = null;
      }
      ciRef.current = null;
      isInitializedRef.current = false;
      setIsReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Intentionally empty - initialize only once on mount

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

      {/* Status indicator */}
      {isReady && (
        <div className="dos-player-status">
          <span className="status-indicator ready"></span>
          <span className="status-text">DOS Ready</span>
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

export default DosPlayer;

