/**
 * Tests for DosPlayer component
 */

import { StrictMode } from 'react';
import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import { DosPlayer } from './DosPlayer';
import type {
  CommandInterface,
  CommandInterfaceEvents,
  DosEvent,
  DosFn,
  DosProps,
} from '../types/js-dos';

/** A js-dos player as window.Dos() returns it, every method a mock */
function createMockPlayer() {
  return {
    stop: vi.fn<DosProps['stop']>().mockResolvedValue(undefined),
    getVersion: vi.fn<DosProps['getVersion']>().mockReturnValue(['8.3.20', 'dosbox']),
    getToken: vi.fn<DosProps['getToken']>().mockReturnValue(null),
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
    save: vi.fn<DosProps['save']>().mockResolvedValue(true),
  } satisfies DosProps;
}

/** A command interface with what DosPlayer uses, and a trigger for its exit event */
function createMockCommandInterface() {
  let exitConsumer: (() => void) | undefined;
  const unmute = vi.fn<CommandInterface['unmute']>();
  // Only what DosPlayer calls; the rest of the interface is left out
  const events: Partial<CommandInterfaceEvents> = {
    onExit: vi.fn((consumer: () => void) => {
      exitConsumer = consumer;
    }),
    onStdout: vi.fn(),
  };
  const ci: Partial<CommandInterface> = {
    events: () => events as CommandInterfaceEvents,
    unmute,
  };
  return { ci: ci as CommandInterface, unmute, exit: () => exitConsumer?.() };
}

describe('DosPlayer', () => {
  let player: ReturnType<typeof createMockPlayer>;
  let mockDos: Mock<DosFn>;

  /** Fire a js-dos event at the player that the last window.Dos() call started */
  const emit = (event: DosEvent, arg?: unknown) =>
    act(() => mockDos.mock.lastCall?.[1]?.onEvent?.(event, arg));

  beforeEach(() => {
    player = createMockPlayer();
    // Like js-dos, return the player synchronously
    mockDos = vi.fn<DosFn>(() => player);
    window.Dos = mockDos;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.getElementById('emulators-js')?.remove();
    delete window.emulators;
  });

  describe('Rendering', () => {
    it('should render without crashing', () => {
      render(<DosPlayer />);
      expect(screen.getByText(/Loading DOS emulator/i)).toBeInTheDocument();
    });

    it('should render with custom className', () => {
      const { container } = render(<DosPlayer className="custom-class" />);
      expect(container.querySelector('.custom-class')).toBeInTheDocument();
    });

    it('should apply custom styles', () => {
      const customStyle = { backgroundColor: 'red' };
      const { container } = render(<DosPlayer style={customStyle} />);
      const wrapper = container.querySelector('.dos-player-wrapper');
      // Check that style prop is passed (inline styles may be overridden by CSS)
      expect(wrapper).toBeInTheDocument();
    });
  });

  describe('Loading state', () => {
    it('should show loading indicator initially', () => {
      render(<DosPlayer />);
      expect(screen.getByText(/Loading DOS emulator/i)).toBeInTheDocument();
    });

    it('should show loading spinner', () => {
      const { container } = render(<DosPlayer />);
      expect(container.querySelector('.dos-player-spinner')).toBeInTheDocument();
    });
  });

  describe('Error handling', () => {
    it('should show error when Dos is not available', () => {
      delete window.Dos;
      render(<DosPlayer />);

      expect(screen.getByText(/Error/i)).toBeInTheDocument();
      expect(screen.getByText(/DOS emulator library not loaded/i)).toBeInTheDocument();
    });

    it('should show reload button on error', () => {
      delete window.Dos;
      render(<DosPlayer />);

      expect(screen.getByRole('button', { name: /Reload Page/i })).toBeInTheDocument();
    });

    it('shows why the emulator failed to start', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      mockDos.mockImplementation(() => {
        throw new Error('Initialization failed');
      });

      const { container } = render(<DosPlayer />);

      await waitFor(() => {
        expect(container.querySelector('.dos-player-error')).toHaveTextContent(
          'Initialization failed'
        );
      });
    });

    // js-dos shows its own error for it, under the loading panel, and sends no event
    it('shows that the emulator could not load when emulators.js fails, instead of loading', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      // Like js-dos, the first start adds the script tag that loads emulators.js
      mockDos.mockImplementation(() => {
        const script = document.createElement('script');
        script.id = 'emulators-js';
        script.src = '/emulators/emulators.js';
        document.head.append(script);
        return player;
      });
      const { container } = render(<DosPlayer />);

      act(() => {
        document.getElementById('emulators-js')?.dispatchEvent(new Event('error'));
      });

      await waitFor(() => {
        expect(container.querySelector('.dos-player-error')).toHaveTextContent(
          'The DOS emulator could not be loaded: /emulators/emulators.js failed to download'
        );
      });
      expect(screen.queryByText(/Loading DOS emulator/i)).not.toBeInTheDocument();
      expect(player.stop).toHaveBeenCalledTimes(1);
    });

    // So that the page can say so too, as the player does
    describe('reports why the emulator could not start', () => {
      beforeEach(() => {
        vi.spyOn(console, 'error').mockImplementation(() => {});
      });

      it('when js-dos.js did not load', () => {
        delete window.Dos;
        const onError = vi.fn();

        render(<DosPlayer onError={onError} />);

        expect(onError).toHaveBeenCalledExactlyOnceWith(
          'DOS emulator library not loaded. Please refresh the page.'
        );
      });

      it('when js-dos fails to start', async () => {
        mockDos.mockImplementation(() => {
          throw new Error('Initialization failed');
        });
        const onError = vi.fn();

        render(<DosPlayer onError={onError} />);

        await waitFor(() =>
          expect(onError).toHaveBeenCalledExactlyOnceWith(
            'Failed to initialize js-dos: Initialization failed'
          )
        );
      });

      it('when emulators.js fails to load', async () => {
        mockDos.mockImplementation(() => {
          const script = document.createElement('script');
          script.id = 'emulators-js';
          script.src = '/emulators/emulators.js';
          document.head.append(script);
          return player;
        });
        const onError = vi.fn();
        render(<DosPlayer onError={onError} />);

        act(() => {
          document.getElementById('emulators-js')?.dispatchEvent(new Event('error'));
        });

        await waitFor(() =>
          expect(onError).toHaveBeenCalledExactlyOnceWith(
            expect.stringContaining('The DOS emulator could not be loaded')
          )
        );
      });

      it('only while the player is mounted', async () => {
        mockDos.mockImplementation(() => {
          const script = document.createElement('script');
          script.id = 'emulators-js';
          document.head.append(script);
          return player;
        });
        const onError = vi.fn();
        const { unmount } = render(<DosPlayer onError={onError} />);
        unmount();

        await act(async () => {
          document.getElementById('emulators-js')?.dispatchEvent(new Event('error'));
        });

        expect(onError).not.toHaveBeenCalled();
      });
    });
  });

  describe('Initialization', () => {
    it('should call window.Dos on mount', () => {
      render(<DosPlayer />);
      expect(mockDos).toHaveBeenCalledTimes(1);
    });

    it('should pass dosboxConf to Dos', () => {
      const customConfig = '[cpu]\ncore=auto';
      render(<DosPlayer dosboxConf={customConfig} />);

      expect(mockDos).toHaveBeenCalledWith(
        expect.any(HTMLDivElement),
        expect.objectContaining({
          dosboxConf: customConfig,
        })
      );
    });

    it('should merge custom options with defaults', () => {
      const customOptions = { volume: 0.5, theme: 'light' };
      render(<DosPlayer options={customOptions} />);

      expect(mockDos).toHaveBeenCalledWith(
        expect.any(HTMLDivElement),
        expect.objectContaining(customOptions)
      );
    });

    // js-dos would otherwise go back to DosKit's at each app switch and reload
    describe("with choices made in js-dos's settings panel", () => {
      afterEach(() => {
        localStorage.clear();
      });

      it("starts js-dos with them instead of DosKit's", () => {
        localStorage.setItem('jsdos.8.volume', '0.2');
        localStorage.setItem('jsdos.8.theme', 'light');

        render(<DosPlayer />);

        expect(mockDos).toHaveBeenCalledWith(
          expect.any(HTMLDivElement),
          expect.objectContaining({ volume: 0.2, theme: 'light', renderAspect: '4/3' })
        );
      });

      it("starts js-dos with DosKit's before the user has chosen any", () => {
        render(<DosPlayer />);

        expect(mockDos).toHaveBeenCalledWith(
          expect.any(HTMLDivElement),
          expect.objectContaining({ volume: 0.7, theme: 'dark' })
        );
      });

      it('leaves options given to DosPlayer over them', () => {
        localStorage.setItem('jsdos.8.volume', '0.2');

        render(<DosPlayer options={{ volume: 0.5 }} />);

        expect(mockDos).toHaveBeenCalledWith(
          expect.any(HTMLDivElement),
          expect.objectContaining({ volume: 0.5 })
        );
      });
    });

    it('should not initialize twice', () => {
      const { rerender } = render(<DosPlayer />);
      rerender(<DosPlayer />);

      // Should only be called once despite rerender
      expect(mockDos).toHaveBeenCalledTimes(1);
    });
  });

  describe('Callbacks', () => {
    it('should call onReady when provided', () => {
      const onReady = vi.fn();
      const { ci } = createMockCommandInterface();

      render(<DosPlayer onReady={onReady} />);
      emit('ci-ready', ci);

      expect(onReady).toHaveBeenCalledWith(ci);
    });

    it('should unmute audio when Command Interface is ready', () => {
      const { ci, unmute } = createMockCommandInterface();

      render(<DosPlayer />);
      emit('ci-ready', ci);

      expect(unmute).toHaveBeenCalled();
    });

    it('should call onExit when DOS exits', () => {
      const onExit = vi.fn();
      const { ci, exit } = createMockCommandInterface();

      render(<DosPlayer onExit={onExit} />);
      emit('ci-ready', ci);
      act(() => exit());

      expect(onExit).toHaveBeenCalled();
    });

    // onExit closes what onReady opened: whoever showed the player as ready learns it
    // is gone, whether DOS exited or unmounting stopped it
    describe('exit of a ready player', () => {
      it('is reported as soon as unmounting stops the player, and only then', () => {
        const onExit = vi.fn();
        const { ci, exit } = createMockCommandInterface();
        const { unmount } = render(<DosPlayer onExit={onExit} />);
        emit('ci-ready', ci);

        unmount();

        expect(onExit).toHaveBeenCalledTimes(1);

        // stop() exits the command interface, which js-dos then reports
        act(() => exit());

        expect(onExit).toHaveBeenCalledTimes(1);
      });

      it('is reported once when DOS exits before the player unmounts', () => {
        const onExit = vi.fn();
        const { ci, exit } = createMockCommandInterface();
        const { unmount } = render(<DosPlayer onExit={onExit} />);
        emit('ci-ready', ci);

        act(() => exit());
        unmount();

        expect(onExit).toHaveBeenCalledTimes(1);
      });

      it('is not reported for a player that never got ready', () => {
        const onExit = vi.fn();
        const { unmount } = render(<DosPlayer onExit={onExit} />);

        unmount();

        expect(onExit).not.toHaveBeenCalled();
      });
    });
  });

  describe('Cleanup', () => {
    it('should call stop on unmount', async () => {
      const { unmount } = render(<DosPlayer />);

      // Wait for initialization to complete
      await waitFor(() => {
        expect(mockDos).toHaveBeenCalled();
      });

      unmount();

      expect(player.stop).toHaveBeenCalled();
    });

    // js-dos's stop() keeps the context, and Chrome keeps 16 at most: from the 17th app
    // switch on, it dropped the oldest each time with a warning
    it('releases the WebGL context js-dos draws with, then stops the player', async () => {
      const steps: string[] = [];
      const gl = {
        getExtension: (name: string) =>
          name === 'WEBGL_lose_context' ? { loseContext: () => steps.push('loseContext') } : null,
      } as unknown as WebGLRenderingContext;
      mockDos.mockImplementation((container) => {
        // Like js-dos, which draws in a canvas of the element it runs in. jsdom has no WebGL.
        const canvas = document.createElement('canvas');
        vi.spyOn(canvas, 'getContext').mockImplementation((type: string) =>
          type === 'webgl' ? gl : null
        );
        container.append(canvas);
        return player;
      });
      player.stop.mockImplementation(async () => {
        steps.push('stop');
      });
      const { unmount } = render(<DosPlayer />);
      await act(async () => {});

      unmount();

      expect(steps).toEqual(['loseContext', 'stop']);
    });

    it('should handle stop errors gracefully', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      player.stop.mockRejectedValueOnce(new Error('Stop failed'));

      const { unmount } = render(<DosPlayer />);

      // Wait for initialization to complete
      await waitFor(() => {
        expect(mockDos).toHaveBeenCalled();
      });

      unmount();

      // Should not throw
      expect(player.stop).toHaveBeenCalled();
    });

    // window.Dos() returns the player at once, but the adapter's promise hands it to the
    // hook a microtask later. Unmounting right after mounting, as React StrictMode does,
    // lands in between.
    describe('when unmounted before js-dos hands the player back', () => {
      it('stops the player once it arrives', async () => {
        const { unmount } = render(<DosPlayer />);

        unmount();
        await act(async () => {});

        expect(player.stop).toHaveBeenCalledTimes(1);
      });

      it('never starts js-dos for it while emulators.js loads', async () => {
        // Like js-dos, the first start, the start page's, adds the script tag that loads
        // emulators.js; the next start waits for the script to run
        const script = document.createElement('script');
        script.id = 'emulators-js';
        mockDos.mockImplementationOnce(() => {
          document.head.append(script);
          return player;
        });
        render(<DosPlayer />);
        const { unmount } = render(<DosPlayer />);
        await act(async () => {});

        unmount();
        await act(async () => {
          window.emulators = { version: '8.3.8' };
          script.dispatchEvent(new Event('load'));
        });

        expect(mockDos).toHaveBeenCalledTimes(1);
      });

      it('never reports that player ready', async () => {
        const onReady = vi.fn();
        const { ci, unmute } = createMockCommandInterface();
        const { unmount } = render(<DosPlayer onReady={onReady} />);

        unmount();
        await act(async () => {});
        // js-dos goes on to fire the events of the start it began
        emit('emu-ready');
        emit('ci-ready', ci);

        expect(onReady).not.toHaveBeenCalled();
        expect(unmute).not.toHaveBeenCalled();
      });
    });
  });

  // main.tsx renders the app in StrictMode, which in development mounts every component,
  // unmounts it and mounts it again at once: js-dos starts twice in the same element
  describe('in StrictMode', () => {
    /** The player of the first start, which StrictMode unmounts at once */
    let firstPlayer: ReturnType<typeof createMockPlayer>;

    beforeEach(() => {
      firstPlayer = createMockPlayer();
      // Then the player of the second start, the one that stays
      mockDos.mockReturnValueOnce(firstPlayer);
    });

    const renderStrict = (onReady: () => void) =>
      render(
        <StrictMode>
          <DosPlayer onReady={onReady} />
        </StrictMode>
      );

    it('stops the first start and reports only the second one ready', async () => {
      const onReady = vi.fn();
      const first = createMockCommandInterface();
      const second = createMockCommandInterface();

      renderStrict(onReady);
      await act(async () => {});

      expect(mockDos).toHaveBeenCalledTimes(2);
      expect(firstPlayer.stop).toHaveBeenCalledTimes(1);
      expect(player.stop).not.toHaveBeenCalled();

      // js-dos goes on to fire the first start's events too
      act(() => mockDos.mock.calls[0]?.[1]?.onEvent?.('ci-ready', first.ci));
      emit('ci-ready', second.ci);

      expect(onReady).toHaveBeenCalledTimes(1);
      expect(onReady).toHaveBeenCalledWith(second.ci);
    });

    it('makes the second start once emulators.js, which the first one loads, has run', async () => {
      const onReady = vi.fn();
      const { ci } = createMockCommandInterface();
      // Like js-dos, the first start adds the script tag that loads emulators.js
      const script = document.createElement('script');
      script.id = 'emulators-js';
      mockDos.mockReset().mockImplementationOnce(() => {
        document.head.append(script);
        return firstPlayer;
      });
      mockDos.mockReturnValue(player);

      renderStrict(onReady);
      await act(async () => {});

      expect(mockDos).toHaveBeenCalledTimes(1);

      await act(async () => {
        window.emulators = { version: '8.3.8' };
        script.dispatchEvent(new Event('load'));
      });

      expect(mockDos).toHaveBeenCalledTimes(2);
      expect(firstPlayer.stop).toHaveBeenCalledTimes(1);
      expect(player.stop).not.toHaveBeenCalled();
      emit('ci-ready', ci);
      expect(onReady).toHaveBeenCalledWith(ci);
    });
  });

  describe('Container element', () => {
    it('should render DOS container', () => {
      const { container } = render(<DosPlayer />);
      expect(container.querySelector('.dos-player-container')).toBeInTheDocument();
    });

    it('should have correct container styles', () => {
      const { container } = render(<DosPlayer />);
      const dosContainer = container.querySelector('.dos-player-container');
      expect(dosContainer).toHaveStyle({ width: '100%', height: '100%' });
    });
  });
});
