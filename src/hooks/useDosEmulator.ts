/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * useDosEmulator Hook
 * Custom React hook for managing js-dos emulator lifecycle and state
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import type { DosOptions, DosProps, CommandInterface, DosEvent } from '../types/js-dos';
import { getDefaultConfig } from '../config/jsdos.config';
import { getEmulatorAdapter } from '../adapters/EmulatorAdapter';

export interface UseDosEmulatorOptions {
  /** Custom DOSBox configuration */
  dosboxConf: string;
  /** Custom js-dos options (merged with defaults) */
  options?: Partial<DosOptions>;
  /** Callback when the emulator is ready */
  onReady?: (ci: CommandInterface) => void;
  /**
   * Callback when a ready emulator is gone: DOS exited, or unmounting stopped it. Called
   * once per onReady.
   */
  onExit?: () => void;
  /** Callback when the emulator cannot start, with the error that `error` then holds */
  onError?: (error: string) => void;
}

export interface UseDosEmulatorReturn {
  /** Ref to attach to the DOS container element */
  dosContainerRef: React.RefObject<HTMLDivElement | null>;
  /** Whether the emulator is loading */
  isLoading: boolean;
  /** Error message if initialization failed */
  error: string | null;
  /** Command interface of the running emulator: set once it is ready, cleared once it is gone */
  ciRef: React.RefObject<CommandInterface | null>;
}

/**
 * Stop a js-dos player. Its emulator worker logs an "ExitStatus" error (exit code 0) as it
 * shuts down: that is its normal exit, logged to the worker's own console.
 */
function stopPlayer(player: DosProps): void {
  player.stop().catch((err: unknown) => {
    console.error('[useDosEmulator] Error stopping player:', err);
  });
}

/**
 * Custom hook for managing js-dos emulator lifecycle
 * Handles initialization, event handling, and cleanup
 */
export const useDosEmulator = ({
  dosboxConf,
  options = {},
  onReady,
  onExit,
  onError,
}: UseDosEmulatorOptions): UseDosEmulatorReturn => {
  const dosContainerRef = useRef<HTMLDivElement>(null);
  const ciRef = useRef<CommandInterface | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Store callbacks in refs to avoid recreating the event handler
  const onReadyRef = useRef(onReady);
  const onExitRef = useRef(onExit);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onReadyRef.current = onReady;
    onExitRef.current = onExit;
    onErrorRef.current = onError;
  }, [onReady, onExit, onError]);

  // Event handler for js-dos events (stable reference)
  const handleDosEvent = useCallback((event: DosEvent, arg?: unknown) => {
    if (import.meta.env.DEV) {
      console.log('[useDosEmulator] Event:', event);
    }

    switch (event) {
      case 'emu-ready':
        if (import.meta.env.DEV) {
          console.log('[useDosEmulator] Emulator ready');
        }
        setIsLoading(false);
        break;

      case 'ci-ready':
        if (import.meta.env.DEV) {
          console.log('[useDosEmulator] Command Interface ready');
        }
        ciRef.current = arg as CommandInterface;

        if (ciRef.current) {
          const ci = ciRef.current;
          ci.events().onExit(() => {
            // Once unmounting has stopped the player, cleanup has reported its exit
            if (ciRef.current !== ci) return;
            ciRef.current = null;
            if (import.meta.env.DEV) {
              console.log('[useDosEmulator] DOS exited');
            }
            onExitRef.current?.();
          });

          if (import.meta.env.DEV) {
            ciRef.current.events().onStdout((message: string) => {
              console.log('[DOS]', message);
            });
          }

          try {
            ciRef.current.unmute();
            if (import.meta.env.DEV) {
              console.log('[useDosEmulator] Audio unmuted');
            }
          } catch (err) {
            console.warn('[useDosEmulator] Failed to unmute audio:', err);
          }
        }

        if (onReadyRef.current && ciRef.current) {
          onReadyRef.current(ciRef.current);
        }
        break;

      case 'bnd-play':
      case 'fullscreen-change':
        if (import.meta.env.DEV) {
          console.log('[useDosEmulator] Event:', event, arg);
        }
        break;

      default:
        if (import.meta.env.DEV) {
          console.log('[useDosEmulator] Unknown event:', event, arg);
        }
    }
  }, []);

  // Start js-dos once per mount, and stop it on unmount
  useEffect(() => {
    const container = dosContainerRef.current;
    if (!container) {
      console.error('[useDosEmulator] Container ref is null');
      return;
    }

    const adapter = getEmulatorAdapter();

    // Show why the emulator cannot start, and tell the parent
    const fail = (message: string) => {
      setError(message);
      setIsLoading(false);
      onErrorRef.current?.(message);
    };

    if (!adapter.isAvailable()) {
      console.error('[useDosEmulator] Emulator not available');
      fail('DOS emulator library not loaded. Please refresh the page.');
      return;
    }

    if (import.meta.env.DEV) {
      console.log(`[useDosEmulator] Initializing ${adapter.getName()}...`);
    }

    // Aborted on cleanup. The adapter can hand the player back after this mount is gone:
    // React StrictMode unmounts every first mount at once, and on a fresh page the player
    // comes once emulators.js has run, which can take seconds. js-dos also goes on firing
    // the events of a start it began. So a start still waiting for emulators.js is never
    // made, a late player is stopped, and nothing it fires reaches the callbacks.
    const unmounted = new AbortController();
    let player: DosProps | null = null;

    // Initialize emulator asynchronously
    const initializeEmulator = async () => {
      try {
        const config = getDefaultConfig();
        const mergedOptions: Partial<DosOptions> = {
          ...config,
          ...options,
          dosboxConf,
          onEvent: (event, arg) => {
            if (!unmounted.signal.aborted) handleDosEvent(event, arg);
          },
        };

        if (import.meta.env.DEV) {
          console.log('[useDosEmulator] Configuration:', mergedOptions);
        }

        const dosPlayer = await adapter.initialize(container, mergedOptions, unmounted.signal);
        if (unmounted.signal.aborted) {
          stopPlayer(dosPlayer);
          return;
        }
        player = dosPlayer;

        if (import.meta.env.DEV) {
          console.log('[useDosEmulator] Emulator initialized successfully');
        }
      } catch (err) {
        if (unmounted.signal.aborted) return;
        console.error('[useDosEmulator] Failed to initialize emulator:', err);
        fail(err instanceof Error ? err.message : 'Failed to initialize DOS emulator');
      }
    };

    initializeEmulator();

    return () => {
      if (import.meta.env.DEV) {
        console.log('[useDosEmulator] Cleaning up...');
      }
      unmounted.abort();
      if (player) {
        // js-dos's stop() leaves the WebGL context it draws with alive, and browsers keep
        // only so many: Chrome drops the oldest once there are 16, warning each time
        for (const canvas of container.querySelectorAll('canvas')) {
          canvas.getContext('webgl')?.getExtension('WEBGL_lose_context')?.loseContext();
        }
        stopPlayer(player);
      }
      // A ready player is gone now: report its exit at once, so a parent showing it as
      // ready does not wait for js-dos, which reports the stop late or not at all
      if (ciRef.current) {
        ciRef.current = null;
        onExitRef.current?.();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    dosContainerRef,
    isLoading,
    error,
    ciRef,
  };
};
