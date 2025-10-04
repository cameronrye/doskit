/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * DosPlayer Component
 * A React component that wraps js-dos functionality with proper lifecycle management
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import type { DosOptions, DosProps, CommandInterface, DosEvent, InitFs } from '../types/js-dos';
import { getDefaultConfig } from '../config/jsdos.config';
import { defaultDosboxConfig } from '../config/dosbox.conf';
import './DosPlayer.css';

// js-dos is loaded via local script and available globally
declare global {
  interface Window {
    Dos?: (element: HTMLDivElement, options?: Partial<DosOptions>) => DosProps;
  }
}

export interface DosPlayerProps {
  /** Custom DOSBox configuration (overrides default) */
  dosboxConf?: string;
  /** Initial filesystem (files to load before starting) */
  initFs?: InitFs;
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
  initFs,
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

  // Handle unhandled promise rejections from js-dos (e.g., fullscreen errors)
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      // Check if this is a fullscreen-related error from js-dos
      const error = event.reason;
      const isFullscreenError =
        error instanceof TypeError &&
        error.message &&
        (error.message.includes('exitFullscreen') ||
         error.message.includes('requestFullscreen'));

      if (isFullscreenError) {
        // Prevent the error from appearing in console
        event.preventDefault();

        // Log in development mode for debugging
        if (import.meta.env.DEV) {
          console.warn('[DosPlayer] Suppressed fullscreen error (non-critical):', error.message);
        }
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

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
      console.error('[DosPlayer] Dos function not available. Make sure js-dos is loaded.');
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

    const initializeDos = async () => {
      try {
        // Merge default config with custom options
        const config = getDefaultConfig();
        const mergedOptions: Partial<DosOptions> = {
          ...config,
          ...options,
          dosboxConf,
          initFs, // Add initFs from props
          onEvent: handleDosEvent,
        };

        // Initialize js-dos
        if (!window.Dos) {
          throw new Error('Dos function not available. Make sure js-dos is loaded.');
        }
        if (!dosContainerRef.current) {
          throw new Error('DOS container ref is null');
        }
        dosPlayerRef.current = window.Dos(dosContainerRef.current, mergedOptions);
      } catch (err) {
        console.error('[DosPlayer] Failed to initialize js-dos:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize DOS emulator');
        setIsLoading(false);
        isInitializedRef.current = false; // Allow retry on error
      }
    };

    initializeDos();

    // Cleanup function
    return () => {
      if (import.meta.env.DEV) {
        console.log('[DosPlayer] Component unmounting or reinitializing, cleaning up...');
      }
      if (dosPlayerRef.current) {
        dosPlayerRef.current.stop().catch((err: unknown) => {
          console.error('[DosPlayer] Error stopping player:', err);
        });
        dosPlayerRef.current = null;
      }
      ciRef.current = null;
      isInitializedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dosboxConf]); // Only reinitialize when dosboxConf changes (handleDosEvent is stable via useCallback)

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
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
};

export default DosPlayer;

