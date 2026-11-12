/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * useDosEmulator Hook
 * Custom React hook for managing js-dos emulator lifecycle and state
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import type { DosOptions, DosProps, CommandInterface, DosEvent, InitFs } from '../types/js-dos';
import { getDefaultConfig, getStoredSettings } from '../config/jsdos.config';
import { getEmulatorAdapter } from '../adapters/EmulatorAdapter';
import { createLineFeed, type LineFeed, type WritableLineFeed } from '../utils/lineFeed';

/**
 * A ready emulator: js-dos's command interface and the player Dos() returned, and what DOS
 * prints and DOSBox logs, from the start on
 */
export interface PlayerHandle {
  ci: CommandInterface;
  player: DosProps;
  /** DOS console output: each echo of the autoexec, and what programs print through DOS */
  stdout: LineFeed;
  /** DOSBox's log lines, as "<type> <text>", from the emulator's ready on */
  messages: LineFeed;
  /** The frames js-dos draws: the last one, kept from the emulator's ready on, and new ones */
  frames: FrameFeed;
}

/**
 * js-dos's frames, from one subscription made as the emulator gets ready. js-dos sends a frame
 * only when the picture changes, so a listener that came later would never see a still screen
 * drawn before it: the last frame is kept for it.
 */
export interface FrameFeed {
  latest(): Uint8Array | null;
  /** Listen for new frames; returns a function that stops listening */
  subscribe(listener: (frame: Uint8Array) => void): () => void;
}

function createFrameFeed() {
  let latest: Uint8Array | null = null;
  const listeners = new Set<(frame: Uint8Array) => void>();
  return {
    push(frame: Uint8Array) {
      latest = frame;
      for (const listener of [...listeners]) listener(frame);
    },
    feed: {
      latest: () => latest,
      subscribe(listener: (frame: Uint8Array) => void) {
        listeners.add(listener);
        return () => {
          listeners.delete(listener);
        };
      },
    } satisfies FrameFeed,
  };
}

/**
 * A copy of the files a start gets. js-dos hands each array of up to 4 MiB to its worker,
 * which empties it, and a second start with an emptied array never gets ready and reports
 * nothing: each start gets its own copy, so that a session can start again.
 */
export function copyInitFs(initFs: InitFs): InitFs {
  const copyEntry = (entry: Exclude<InitFs, unknown[]>) =>
    entry instanceof Uint8Array
      ? entry.slice()
      : { path: entry.path, contents: entry.contents.slice() };
  return Array.isArray(initFs) ? initFs.map(copyEntry) : copyEntry(initFs);
}

export interface UseDosEmulatorOptions {
  /** Custom DOSBox configuration */
  dosboxConf: string;
  /** Custom js-dos options (merged with defaults) */
  options?: Partial<DosOptions>;
  /** Callback when the emulator is ready */
  onReady?: (ci: CommandInterface) => void;
  /** Callback with the ready emulator's handle, once js-dos has handed back the player too */
  onHandle?: (handle: PlayerHandle) => void;
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
  onHandle,
  onExit,
  onError,
}: UseDosEmulatorOptions): UseDosEmulatorReturn => {
  const dosContainerRef = useRef<HTMLDivElement>(null);
  const ciRef = useRef<CommandInterface | null>(null);
  // The two halves of the handle, which arrive by two paths: the command interface in
  // js-dos's ci-ready event, the player as the awaited return of the adapter's start
  const playerRef = useRef<DosProps | null>(null);
  const feedsRef = useRef<{
    stdout: WritableLineFeed;
    messages: WritableLineFeed;
    frames: FrameFeed;
  } | null>(null);
  const handedOutRef = useRef(false);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Store callbacks in refs to avoid recreating the event handler
  const onReadyRef = useRef(onReady);
  const onHandleRef = useRef(onHandle);
  const onExitRef = useRef(onExit);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onReadyRef.current = onReady;
    onHandleRef.current = onHandle;
    onExitRef.current = onExit;
    onErrorRef.current = onError;
  }, [onReady, onHandle, onExit, onError]);

  // Hand out the handle once both halves are there, once per start
  const handOut = useCallback(() => {
    const ci = ciRef.current;
    const player = playerRef.current;
    const feeds = feedsRef.current;
    if (handedOutRef.current || !ci || !player || !feeds) return;
    handedOutRef.current = true;
    onHandleRef.current?.({
      ci,
      player,
      stdout: feeds.stdout,
      messages: feeds.messages,
      frames: feeds.frames,
    });
  }, []);

  // Event handler for js-dos events (stable reference)
  const handleDosEvent = useCallback(
    (event: DosEvent, arg?: unknown) => {
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
            // The only subscriptions to js-dos's streams: the first consumer of each gets its
            // backlog, and none can stop listening
            const frames = createFrameFeed();
            const feeds = {
              stdout: createLineFeed(),
              messages: createLineFeed(),
              frames: frames.feed,
            };
            feedsRef.current = feeds;
            const events = ci.events();
            events.onStdout((message: string) => feeds.stdout.push(String(message)));
            if (typeof events.onMessage === 'function') {
              events.onMessage((type, ...args) => feeds.messages.push([type, ...args].join(' ')));
            }
            if (typeof events.onFrame === 'function') {
              events.onFrame((rgb, rgba) => {
                const frame = rgb ?? rgba;
                if (frame) frames.push(frame);
              });
            }
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
              feeds.stdout.subscribe((message) => {
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
          handOut();
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
    },
    [handOut]
  );

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
          // The user's choices in js-dos's settings panel, over DosKit's defaults
          ...getStoredSettings(),
          ...options,
          ...(options.initFs ? { initFs: copyInitFs(options.initFs) } : {}),
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
        playerRef.current = dosPlayer;
        handOut();

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
