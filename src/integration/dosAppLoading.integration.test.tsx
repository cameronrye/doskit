/**
 * Integration tests for DOS application loading flow
 * Tests the complete user flow: select app -> load files -> initialize emulator -> verify running
 */

import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import { render, waitFor, act } from '@testing-library/react';
import { DosPlayer } from '../components/DosPlayer';
import type {
  CommandInterface,
  CommandInterfaceEvents,
  DosOptions,
  DosProps,
} from '../types/js-dos';

// Create a mock command interface, with a trigger for its exit event
function createMockCommandInterface() {
  let exitCallback: (() => void) | null = null;

  // Only what DosPlayer calls; the rest of the interface is left out
  const events: Partial<CommandInterfaceEvents> = {
    onExit: vi.fn((callback: () => void) => {
      exitCallback = callback;
    }),
    onStdout: vi.fn(),
  };
  const ci: Partial<CommandInterface> = {
    events: vi.fn(() => events as CommandInterfaceEvents),
    unmute: vi.fn(),
  };

  return {
    ci: ci as CommandInterface,
    triggerExit: () => exitCallback?.(),
  };
}

// Create mock Dos instance
function createMockDosInstance() {
  return {
    stop: vi.fn().mockResolvedValue(undefined),
    getVersion: vi.fn().mockReturnValue(['8.3.20', 'dosbox']),
    getToken: vi.fn().mockReturnValue('test-token'),
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
  } satisfies DosProps;
}

describe('DOS Application Loading Integration Tests', () => {
  let mockDos: Mock<Window['Dos']>;
  let mockCommandInterface: CommandInterface;
  let triggerExit: () => void;
  let mockDosInstance: ReturnType<typeof createMockDosInstance>;
  let onEventCallback: ((event: string, ci?: unknown) => void) | null = null;
  // Event timers of players a test left behind; cleared after each test so
  // they cannot fire into the next test's player.
  let pendingTimers: ReturnType<typeof setTimeout>[] = [];

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    onEventCallback = null;
    const commandInterface = createMockCommandInterface();
    mockCommandInterface = commandInterface.ci;
    triggerExit = commandInterface.triggerExit;
    mockDosInstance = createMockDosInstance();

    // Mock window.Dos
    mockDos = vi.fn<Window['Dos']>((_container, options) => {
      // Each player gets the events of its own onEvent callback
      const onEvent = options?.onEvent as ((event: string, ci?: unknown) => void) | undefined;
      onEventCallback = onEvent ?? null;

      // Simulate async initialization - trigger events after a delay
      // This gives the component time to set up its event handlers
      pendingTimers.push(
        setTimeout(() => {
          // First trigger emu-ready
          onEvent?.('emu-ready');
          // Then trigger ci-ready with command interface
          pendingTimers.push(setTimeout(() => onEvent?.('ci-ready', mockCommandInterface), 10));
        }, 50)
      );

      // Like js-dos, return the player synchronously
      return mockDosInstance;
    });

    window.Dos = mockDos;
  });

  afterEach(() => {
    pendingTimers.forEach(clearTimeout);
    pendingTimers = [];
    delete (window as Partial<Window>).Dos;
    vi.restoreAllMocks();
  });

  it('should initialize emulator with default configuration', async () => {
    const onReady = vi.fn();

    render(<DosPlayer onReady={onReady} />);

    // Verify Dos is called with container element
    await waitFor(() => {
      expect(mockDos).toHaveBeenCalled();
    });

    expect(mockDos).toHaveBeenCalledWith(
      expect.any(HTMLElement),
      expect.objectContaining({ dosboxConf: expect.anything(), onEvent: expect.any(Function) })
    );

    // Wait for emulator ready event
    await waitFor(
      () => {
        expect(onReady).toHaveBeenCalledWith(mockCommandInterface);
      },
      { timeout: 1000 }
    );
  });

  it('should initialize emulator with custom dosbox configuration', async () => {
    const customConf = '[cpu]\ncore=dynamic\ncycles=10000\n[autoexec]\nmount c .\nc:\ntest.exe';
    const onReady = vi.fn();

    render(<DosPlayer dosboxConf={customConf} onReady={onReady} />);

    // Wait for Dos initialization
    await waitFor(() => {
      expect(mockDos).toHaveBeenCalled();
    });

    // Verify custom dosbox config is passed
    expect(mockDos).toHaveBeenCalledWith(
      expect.any(HTMLElement),
      expect.objectContaining({ dosboxConf: customConf })
    );

    // Wait for ready callback
    await waitFor(
      () => {
        expect(onReady).toHaveBeenCalledWith(mockCommandInterface);
      },
      { timeout: 1000 }
    );
  });

  it('should pass custom options to emulator', async () => {
    const customOptions: Partial<DosOptions> = {
      theme: 'dark' as const,
      lang: 'en' as const,
      volume: 0.5,
    };

    render(<DosPlayer options={customOptions} />);

    await waitFor(() => {
      expect(mockDos).toHaveBeenCalled();
    });

    expect(mockDos).toHaveBeenCalledWith(
      expect.any(HTMLElement),
      expect.objectContaining(customOptions)
    );
  });

  it('should handle emulator initialization errors', async () => {
    // Mock Dos to throw error
    const errorDos = vi.fn<Window['Dos']>(() => {
      throw new Error('Emulator initialization failed');
    });
    window.Dos = errorDos;

    const onReady = vi.fn();

    const { container } = render(<DosPlayer onReady={onReady} />);

    // Verify Dos initialization was attempted
    await waitFor(() => {
      expect(errorDos).toHaveBeenCalled();
    });

    // Verify error message is displayed
    await waitFor(() => {
      const errorElement = container.querySelector('.dos-player-error');
      expect(errorElement).not.toBeNull();
    });

    // Verify onReady is not called - wrap in act
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });
    expect(onReady).not.toHaveBeenCalled();
  });

  it('should handle emulator exit event', async () => {
    const onExit = vi.fn();

    render(<DosPlayer onExit={onExit} />);

    // Wait for emulator to be ready and ci-ready event
    await waitFor(() => {
      expect(mockDos).toHaveBeenCalled();
    });

    // Wait for ci-ready event to be processed wrapped in act
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    // Trigger exit through command interface wrapped in act
    await act(async () => {
      triggerExit();
    });

    // Verify onExit callback
    await waitFor(() => {
      expect(onExit).toHaveBeenCalled();
    });
  });

  it('should handle emulator error event', async () => {
    render(<DosPlayer />);

    // Wait for emulator to be ready
    await waitFor(() => {
      expect(mockDos).toHaveBeenCalled();
    });

    // Simulate error event wrapped in act
    await act(async () => {
      if (onEventCallback) {
        onEventCallback('emu-error');
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    // Verify error is handled (component should still be mounted)
    expect(mockDos).toHaveBeenCalledTimes(1);
  });

  it('should cleanup emulator on unmount', async () => {
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

  it('should not reinitialize emulator on re-render', async () => {
    const { rerender } = render(<DosPlayer />);

    // Wait for initial initialization
    await waitFor(() => {
      expect(mockDos).toHaveBeenCalledTimes(1);
    });

    // Wait for async events to complete
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    // Re-render with same props
    rerender(<DosPlayer />);

    // Wait for any pending state updates
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    // Verify Dos is still only called once
    expect(mockDos).toHaveBeenCalledTimes(1);
  });

  it('should handle missing window.Dos gracefully', async () => {
    // Remove window.Dos
    delete (window as Partial<Window>).Dos;

    const { container } = render(<DosPlayer />);

    // Verify error message is displayed
    await waitFor(() => {
      const errorElement = container.querySelector('.dos-player-error');
      expect(errorElement).not.toBeNull();
    });
  });

  it('should trigger all emulator lifecycle events in correct order', async () => {
    const events: string[] = [];
    const onReady = vi.fn(() => events.push('ready'));
    const onExit = vi.fn(() => events.push('exit'));

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
      { timeout: 2000 }
    );

    // Trigger exit through command interface wrapped in act
    await act(async () => {
      triggerExit();
    });

    await waitFor(() => {
      expect(onExit).toHaveBeenCalled();
    });

    // Verify event order
    expect(events).toEqual(['ready', 'exit']);
  });
});
