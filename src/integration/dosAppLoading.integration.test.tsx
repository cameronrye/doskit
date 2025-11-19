/**
 * Integration tests for DOS application loading flow
 * Tests the complete user flow: select app -> load files -> initialize emulator -> verify running
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { DosPlayer } from "../components/DosPlayer";
import type { CommandInterface, DosOptions } from "../types/js-dos";

// Create mock command interface
function createMockCommandInterface(): CommandInterface {
  let exitCallback: (() => void) | null = null;

  return {
    exec: vi.fn().mockResolvedValue(undefined),
    fs: vi.fn().mockResolvedValue(undefined),
    screenshot: vi.fn().mockResolvedValue(new Uint8Array()),
    pause: vi.fn(),
    resume: vi.fn(),
    mute: vi.fn(),
    unmute: vi.fn(),
    exit: vi.fn(),
    simulateKeyPress: vi.fn(),
    sendKeyEvent: vi.fn(),
    persist: vi.fn().mockResolvedValue(undefined),
    config: vi.fn().mockResolvedValue(undefined),
    height: vi.fn().mockReturnValue(480),
    width: vi.fn().mockReturnValue(640),
    soundFrequency: vi.fn().mockReturnValue(22050),
    screenshot2: vi.fn().mockResolvedValue(new Uint8Array()),
    events: vi.fn().mockReturnValue({
      onExit: vi.fn((callback: () => void) => {
        exitCallback = callback;
      }),
      onStdout: vi.fn(),
      onFrameUpdate: vi.fn(),
      onMessage: vi.fn(),
    }),
    // Helper to trigger exit event
    _triggerExit: () => {
      if (exitCallback) {
        exitCallback();
      }
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;
}

// Create mock Dos instance
function createMockDosInstance() {
  return {
    stop: vi.fn().mockResolvedValue(undefined),
    getVersion: vi.fn().mockReturnValue("8.3.20"),
    getToken: vi.fn().mockReturnValue("test-token"),
    setTheme: vi.fn(),
    setLang: vi.fn(),
    setBackend: vi.fn(),
    setBackendLocked: vi.fn(),
    setWorkerThread: vi.fn(),
    setOffscreenCanvas: vi.fn(),
    setBackground: vi.fn(),
    setFullScreen: vi.fn(),
    setImageRendering: vi.fn(),
    setRenderBackend: vi.fn(),
    setRenderAspect: vi.fn(),
    setSoftFullscreen: vi.fn(),
    setThinSidebar: vi.fn(),
    setMouseCapture: vi.fn(),
    setMouseSensitivity: vi.fn(),
    setNoCursor: vi.fn(),
    setSoftKeyboardLayout: vi.fn(),
    setSoftKeyboardSymbols: vi.fn(),
    setVolume: vi.fn(),
    setAutoStart: vi.fn(),
    setCountDownStart: vi.fn(),
    setAutoSave: vi.fn(),
    setKiosk: vi.fn(),
    setPaused: vi.fn(),
    setScaleControls: vi.fn(),
    setNoCloud: vi.fn(),
    setKey: vi.fn(),
    save: vi.fn(),
  };
}

describe("DOS Application Loading Integration Tests", () => {
  let mockDos: ReturnType<typeof vi.fn>;
  let mockCommandInterface: CommandInterface;
  let mockDosInstance: ReturnType<typeof createMockDosInstance>;
  let onEventCallback: ((event: string, ci?: unknown) => void) | null = null;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    onEventCallback = null;
    mockCommandInterface = createMockCommandInterface();
    mockDosInstance = createMockDosInstance();

    // Mock window.Dos
    mockDos = vi
      .fn()
      .mockImplementation((_container: HTMLElement, options: DosOptions) => {
        // Store the onEvent callback
        if (options.onEvent) {
          onEventCallback = options.onEvent as (
            event: string,
            ci?: unknown,
          ) => void;
        }

        // Simulate async initialization - trigger events after a delay
        // This gives the component time to set up its event handlers
        setTimeout(() => {
          if (onEventCallback) {
            // First trigger emu-ready
            onEventCallback("emu-ready");
            // Then trigger ci-ready with command interface
            setTimeout(() => {
              if (onEventCallback) {
                onEventCallback("ci-ready", mockCommandInterface);
              }
            }, 10);
          }
        }, 50);

        return Promise.resolve(mockDosInstance);
      });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).Dos = mockDos;
  });

  afterEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (window as any).Dos;
    vi.restoreAllMocks();
  });

  it("should initialize emulator with default configuration", async () => {
    const onReady = vi.fn();

    render(<DosPlayer onReady={onReady} />);

    // Verify Dos is called with container element
    await waitFor(() => {
      expect(mockDos).toHaveBeenCalled();
    });

    const dosCallArgs = mockDos.mock.calls[0];
    expect(dosCallArgs[0]).toBeInstanceOf(HTMLElement);
    expect(dosCallArgs[1]).toHaveProperty("dosboxConf");
    expect(dosCallArgs[1]).toHaveProperty("onEvent");

    // Wait for emulator ready event
    await waitFor(
      () => {
        expect(onReady).toHaveBeenCalledWith(mockCommandInterface);
      },
      { timeout: 1000 },
    );
  });

  it("should initialize emulator with custom dosbox configuration", async () => {
    const customConf =
      "[cpu]\ncore=dynamic\ncycles=10000\n[autoexec]\nmount c .\nc:\ntest.exe";
    const onReady = vi.fn();

    render(<DosPlayer dosboxConf={customConf} onReady={onReady} />);

    // Wait for Dos initialization
    await waitFor(() => {
      expect(mockDos).toHaveBeenCalled();
    });

    // Verify custom dosbox config is passed
    const dosCallArgs = mockDos.mock.calls[0];
    expect(dosCallArgs[1].dosboxConf).toBe(customConf);

    // Wait for ready callback
    await waitFor(
      () => {
        expect(onReady).toHaveBeenCalledWith(mockCommandInterface);
      },
      { timeout: 1000 },
    );
  });

  it("should pass custom options to emulator", async () => {
    const customOptions: Partial<DosOptions> = {
      theme: "dark" as const,
      lang: "en" as const,
      volume: 0.5,
    };

    render(<DosPlayer options={customOptions} />);

    await waitFor(() => {
      expect(mockDos).toHaveBeenCalled();
    });

    const dosCallArgs = mockDos.mock.calls[0];
    expect(dosCallArgs[1]).toMatchObject(customOptions);
  });

  it("should handle emulator initialization errors", async () => {
    // Mock Dos to throw error
    const errorDos = vi
      .fn()
      .mockRejectedValue(new Error("Emulator initialization failed"));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).Dos = errorDos;

    const onReady = vi.fn();

    const { container } = render(<DosPlayer onReady={onReady} />);

    // Verify Dos initialization was attempted
    await waitFor(() => {
      expect(errorDos).toHaveBeenCalled();
    });

    // Verify error message is displayed
    await waitFor(() => {
      const errorElement = container.querySelector(".dos-player-error");
      expect(errorElement).not.toBeNull();
    });

    // Verify onReady is not called
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(onReady).not.toHaveBeenCalled();
  });

  it("should handle emulator exit event", async () => {
    const onExit = vi.fn();

    render(<DosPlayer onExit={onExit} />);

    // Wait for emulator to be ready and ci-ready event
    await waitFor(() => {
      expect(mockDos).toHaveBeenCalled();
    });

    // Wait for ci-ready event to be processed
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Trigger exit through command interface
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (mockCommandInterface && (mockCommandInterface as any)._triggerExit) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mockCommandInterface as any)._triggerExit();
    }

    // Verify onExit callback
    await waitFor(() => {
      expect(onExit).toHaveBeenCalled();
    });
  });

  it("should handle emulator error event", async () => {
    render(<DosPlayer />);

    // Wait for emulator to be ready
    await waitFor(() => {
      expect(mockDos).toHaveBeenCalled();
    });

    // Simulate error event
    if (onEventCallback) {
      onEventCallback("emu-error");
    }

    // Verify error is handled (component should still be mounted)
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(mockDos).toHaveBeenCalledTimes(1);
  });

  it("should cleanup emulator on unmount", async () => {
    const { unmount } = render(<DosPlayer />);

    // Wait for emulator to be ready
    await waitFor(() => {
      expect(mockDos).toHaveBeenCalled();
    });

    // Unmount component
    unmount();

    // Verify stop is called
    await waitFor(() => {
      expect(mockDosInstance.stop).toHaveBeenCalled();
    });
  });

  it("should not reinitialize emulator on re-render", async () => {
    const { rerender } = render(<DosPlayer />);

    // Wait for initial initialization
    await waitFor(() => {
      expect(mockDos).toHaveBeenCalledTimes(1);
    });

    // Re-render with same props
    rerender(<DosPlayer />);

    // Wait a bit
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Verify Dos is still only called once
    expect(mockDos).toHaveBeenCalledTimes(1);
  });

  it("should handle missing window.Dos gracefully", async () => {
    // Remove window.Dos
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (window as any).Dos;

    const { container } = render(<DosPlayer />);

    // Verify error message is displayed
    await waitFor(() => {
      const errorElement = container.querySelector(".dos-player-error");
      expect(errorElement).not.toBeNull();
    });
  });

  it("should trigger all emulator lifecycle events in correct order", async () => {
    const events: string[] = [];
    const onReady = vi.fn(() => events.push("ready"));
    const onExit = vi.fn(() => events.push("exit"));

    render(<DosPlayer onReady={onReady} onExit={onExit} />);

    // Wait for initialization
    await waitFor(() => {
      expect(mockDos).toHaveBeenCalled();
    });

    // Wait for ci-ready event (which triggers onReady)
    await waitFor(
      () => {
        expect(onReady).toHaveBeenCalled();
      },
      { timeout: 2000 },
    );

    // Trigger exit through command interface
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (mockCommandInterface && (mockCommandInterface as any)._triggerExit) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mockCommandInterface as any)._triggerExit();
    }

    await waitFor(() => {
      expect(onExit).toHaveBeenCalled();
    });

    // Verify event order
    expect(events).toEqual(["ready", "exit"]);
  });
});
