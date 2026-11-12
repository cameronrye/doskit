/**
 * Integration tests for DOS application loading flow
 * Tests the complete user flow: select app -> load files -> initialize emulator -> verify running
 */

import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import App from '../App';
import { DosPlayer } from '../components/DosPlayer';
import { starsDosboxConf } from '../dos-apps/stars.config';
import { endMarkerFor, withEndMarker } from '../utils/endMarker';
import type {
  CommandInterface,
  CommandInterfaceEvents,
  DosFn,
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
  let mockDos: Mock<DosFn>;
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
    mockDos = vi.fn<DosFn>((_container, options) => {
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
    delete window.Dos;
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
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    // Mock Dos to throw error
    const errorDos = vi.fn<DosFn>(() => {
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
    expect(consoleError).toHaveBeenCalledWith(
      '[useDosEmulator] Failed to initialize emulator:',
      expect.objectContaining({
        message: 'Failed to initialize js-dos: Emulator initialization failed',
      })
    );
  });

  it('should handle emulator exit event', async () => {
    const onReady = vi.fn();
    const onExit = vi.fn();

    render(<DosPlayer onReady={onReady} onExit={onExit} />);

    // The player listens for the exit once js-dos reports its command interface ready,
    // however long that takes on a busy machine
    await waitFor(() => expect(onReady).toHaveBeenCalled(), { timeout: 2000 });

    act(() => triggerExit());

    expect(onExit).toHaveBeenCalledOnce();
  });

  // js-dos sends only the events DosEvent lists; 'emu-error' is a step of its own store
  it('should keep loading through an event it does not know', async () => {
    const onReady = vi.fn();
    const { container } = render(<DosPlayer onReady={onReady} />);
    await waitFor(() => {
      expect(mockDos).toHaveBeenCalled();
    });

    act(() => onEventCallback?.('emu-error'));

    expect(screen.getByText(/Loading DOS emulator/i)).toBeInTheDocument();
    expect(container.querySelector('.dos-player-error')).not.toBeInTheDocument();
    expect(onReady).not.toHaveBeenCalled();
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
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    // Remove window.Dos
    delete window.Dos;

    const { container } = render(<DosPlayer />);

    // Verify error message is displayed
    await waitFor(() => {
      const errorElement = container.querySelector('.dos-player-error');
      expect(errorElement).not.toBeNull();
    });
    expect(consoleError).toHaveBeenCalledWith('[useDosEmulator] Emulator not available');
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

// The whole app, with only js-dos and the network faked
describe('Status badge as players come and go', () => {
  let mockDos: Mock<DosFn>;

  /** The Ready/Loading badge in the footer */
  const badge = () => document.querySelector('.status-indicators .status-badge');

  /** Report the newest player ready, as js-dos does once its command interface is up */
  const reportReady = () =>
    act(() => mockDos.mock.lastCall?.[1]?.onEvent?.('ci-ready', createMockCommandInterface().ci));

  beforeEach(() => {
    // jsdom keeps one URL and history for the whole file
    window.history.replaceState({}, '', '/');
    // Every app archive downloads as a few bytes
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(new Uint8Array([80, 75, 3, 4])))
    );
    // jsdom has no matchMedia, which OfflineIndicator asks whether the app is installed
    vi.stubGlobal(
      'matchMedia',
      vi.fn((query: string) => ({ matches: false, media: query }) as MediaQueryList)
    );
    // Like js-dos, a new player for each call, returned synchronously
    mockDos = vi.fn<DosFn>(() => createMockDosInstance());
    window.Dos = mockDos;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete window.Dos;
    document.getElementById('emulators-js')?.remove();
    delete window.emulators;
    window.history.replaceState({}, '', '/');
  });

  // js-dos's first Dos() call adds the script tag that loads emulators.js, and a later call
  // that finds the tag reads the emulators global at once: before the script has run, that
  // player never boots
  it('boots an app picked while emulators.js loads, once the script has run', async () => {
    const emulatorsFound: unknown[] = [];
    mockDos.mockImplementation(() => {
      if (document.getElementById('emulators-js')) {
        emulatorsFound.push(window.emulators);
      } else {
        const script = document.createElement('script');
        script.id = 'emulators-js';
        document.head.append(script);
      }
      return createMockDosInstance();
    });
    render(<App />);
    // Nothing runs under the start page's selector; cancelled, it leaves the DOS prompt,
    // whose start loads emulators.js
    expect(mockDos).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(mockDos).toHaveBeenCalledTimes(1);

    // An app picked from the selector while emulators.js still loads
    fireEvent.click(screen.getByRole('button', { name: 'Select Application' }));
    fireEvent.doubleClick(screen.getByRole('option', { name: /^Starfield Effect by/ }));

    // Once the selector has its files, the app's player replaces the start page's
    await waitFor(() =>
      expect(document.querySelector('.header-app-name')).toHaveTextContent('Starfield Effect')
    );
    await act(async () => {});
    expect(mockDos).toHaveBeenCalledTimes(1);
    expect(badge()).toHaveTextContent('Loading');

    await act(async () => {
      window.emulators = { version: '8.3.8' };
      document.getElementById('emulators-js')?.dispatchEvent(new Event('load'));
    });

    expect(mockDos).toHaveBeenCalledTimes(2);
    expect(emulatorsFound).toEqual([window.emulators]);
    reportReady();
    expect(badge()).toHaveTextContent('Ready');
  });

  it('says Loading from the moment a new player mounts until that player is ready', async () => {
    render(<App />);
    // Nothing runs under the start page's selector
    expect(badge()).toHaveTextContent('Idle');
    // Closed, it leaves the default DOS prompt
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(mockDos).toHaveBeenCalledTimes(1);
    expect(badge()).toHaveTextContent('Loading');
    reportReady();
    expect(badge()).toHaveTextContent('Ready');

    // Go to an app, as going forward to its URL does
    await act(async () => {
      window.history.pushState({}, '', '/?app=stars');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    await waitFor(() => expect(mockDos).toHaveBeenCalledTimes(2), { timeout: 3000 });
    // With the DOSBox config the app loads, which runs it, and the line that tells its end
    expect(mockDos.mock.lastCall?.[1]?.dosboxConf).toBe(
      withEndMarker(starsDosboxConf, endMarkerFor('Starfield Effect'))
    );
    expect(badge()).toHaveTextContent('Loading');
    reportReady();
    expect(badge()).toHaveTextContent('Ready');

    // Back to the start page: its selector opens, with nothing running under it
    await act(async () => {
      const popped = new Promise((resolve) =>
        window.addEventListener('popstate', resolve, { once: true })
      );
      window.history.back();
      await popped;
    });
    expect(mockDos).toHaveBeenCalledTimes(2);
    expect(badge()).toHaveTextContent('Idle');
  });
});
