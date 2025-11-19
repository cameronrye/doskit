/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * useDosEmulator Hook
 * Custom React hook for managing js-dos emulator lifecycle and state
 */

import { useEffect, useRef, useState, useCallback } from "react";
import type {
  DosOptions,
  DosProps,
  CommandInterface,
  DosEvent,
} from "../types/js-dos";
import { getDefaultConfig } from "../config/jsdos.config";
import { getEmulatorAdapter } from "../adapters/EmulatorAdapter";

export interface UseDosEmulatorOptions {
  /** Custom DOSBox configuration */
  dosboxConf: string;
  /** Custom js-dos options (merged with defaults) */
  options?: Partial<DosOptions>;
  /** Callback when the emulator is ready */
  onReady?: (ci: CommandInterface) => void;
  /** Callback when the emulator exits */
  onExit?: () => void;
}

export interface UseDosEmulatorReturn {
  /** Ref to attach to the DOS container element */
  dosContainerRef: React.RefObject<HTMLDivElement | null>;
  /** Whether the emulator is loading */
  isLoading: boolean;
  /** Error message if initialization failed */
  error: string | null;
  /** Command interface reference (available after ready) */
  ciRef: React.RefObject<CommandInterface | null>;
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
}: UseDosEmulatorOptions): UseDosEmulatorReturn => {
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
      console.log("[useDosEmulator] Event:", event);
    }

    switch (event) {
      case "emu-ready":
        if (import.meta.env.DEV) {
          console.log("[useDosEmulator] Emulator ready");
        }
        setIsLoading(false);

        // Close the sidebar menu on startup for a cleaner initial view
        setTimeout(() => {
          if (dosContainerRef.current) {
            const toggleButton = dosContainerRef.current.querySelector(
              "[data-dos-sidebar-toggle]",
            );
            if (toggleButton instanceof HTMLElement) {
              toggleButton.click();
              if (import.meta.env.DEV) {
                console.log("[useDosEmulator] Sidebar closed on startup");
              }
            } else {
              const buttons =
                dosContainerRef.current.querySelectorAll("button");
              const menuButton = Array.from(buttons).find(
                (btn) =>
                  btn.textContent?.includes("☰") ||
                  btn.className?.includes("sidebar") ||
                  btn.className?.includes("menu"),
              );
              if (menuButton instanceof HTMLElement) {
                menuButton.click();
                if (import.meta.env.DEV) {
                  console.log(
                    "[useDosEmulator] Sidebar closed on startup (fallback)",
                  );
                }
              }
            }
          }
        }, 500);
        break;

      case "ci-ready":
        if (import.meta.env.DEV) {
          console.log("[useDosEmulator] Command Interface ready");
        }
        ciRef.current = arg as CommandInterface;

        if (ciRef.current) {
          ciRef.current.events().onExit(() => {
            if (import.meta.env.DEV) {
              console.log("[useDosEmulator] DOS exited");
            }
            onExitRef.current?.();
          });

          if (import.meta.env.DEV) {
            ciRef.current.events().onStdout((message: string) => {
              console.log("[DOS]", message);
            });
          }

          try {
            ciRef.current.unmute();
            if (import.meta.env.DEV) {
              console.log("[useDosEmulator] Audio unmuted");
            }
          } catch (err) {
            console.warn("[useDosEmulator] Failed to unmute audio:", err);
          }
        }

        if (onReadyRef.current && ciRef.current) {
          onReadyRef.current(ciRef.current);
        }
        break;

      case "bnd-play":
      case "fullscreen-change":
        if (import.meta.env.DEV) {
          console.log("[useDosEmulator] Event:", event, arg);
        }
        break;

      default:
        if (import.meta.env.DEV) {
          console.log("[useDosEmulator] Unknown event:", event, arg);
        }
    }
  }, []);

  // Handle unhandled promise rejections from js-dos
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error = event.reason;
      const isFullscreenError =
        error instanceof TypeError &&
        error.message &&
        (error.message.includes("exitFullscreen") ||
          error.message.includes("requestFullscreen"));

      if (isFullscreenError) {
        event.preventDefault();
        if (import.meta.env.DEV) {
          console.warn(
            "[useDosEmulator] Suppressed fullscreen error:",
            error.message,
          );
        }
      }
    };

    window.addEventListener("unhandledrejection", handleUnhandledRejection);
    return () => {
      window.removeEventListener(
        "unhandledrejection",
        handleUnhandledRejection,
      );
    };
  }, []);

  // Initialize emulator (only once)
  useEffect(() => {
    if (isInitializedRef.current) {
      if (import.meta.env.DEV) {
        console.log("[useDosEmulator] Already initialized, skipping");
      }
      return;
    }

    if (!dosContainerRef.current) {
      console.error("[useDosEmulator] Container ref is null");
      return;
    }

    const adapter = getEmulatorAdapter();

    if (!adapter.isAvailable()) {
      console.error("[useDosEmulator] Emulator not available");
      setError("DOS emulator library not loaded. Please refresh the page.");
      setIsLoading(false);
      return;
    }

    if (import.meta.env.DEV) {
      console.log(`[useDosEmulator] Initializing ${adapter.getName()}...`);
    }
    isInitializedRef.current = true;
    setIsLoading(true);
    setError(null);

    // Initialize emulator asynchronously
    const initializeEmulator = async () => {
      try {
        const config = getDefaultConfig();
        const mergedOptions: Partial<DosOptions> = {
          ...config,
          ...options,
          dosboxConf,
          onEvent: handleDosEvent,
        };

        if (import.meta.env.DEV) {
          console.log("[useDosEmulator] Configuration:", mergedOptions);
        }

        dosPlayerRef.current = await adapter.initialize(
          dosContainerRef.current!,
          mergedOptions,
        );

        if (import.meta.env.DEV) {
          console.log("[useDosEmulator] Emulator initialized successfully");
        }
      } catch (err) {
        console.error("[useDosEmulator] Failed to initialize emulator:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Failed to initialize DOS emulator",
        );
        setIsLoading(false);
        isInitializedRef.current = false;
      }
    };

    initializeEmulator();

    return () => {
      if (import.meta.env.DEV) {
        console.log("[useDosEmulator] Cleaning up...");
      }
      if (dosPlayerRef.current) {
        dosPlayerRef.current.stop().catch((err: unknown) => {
          console.error("[useDosEmulator] Error stopping player:", err);
        });
        dosPlayerRef.current = null;
      }
      ciRef.current = null;
      isInitializedRef.current = false;
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
