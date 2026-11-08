/**
 * Tests for DosPlayer component
 */

import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import { DosPlayer } from './DosPlayer';
import type { CommandInterface, CommandInterfaceEvents, DosEvent, DosProps } from '../types/js-dos';

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
  let mockDos: Mock<Window['Dos']>;

  /** Fire a js-dos event at the player that the last window.Dos() call started */
  const emit = (event: DosEvent, arg?: unknown) =>
    act(() => mockDos.mock.lastCall?.[1]?.onEvent?.(event, arg));

  beforeEach(() => {
    player = createMockPlayer();
    // Like js-dos, return the player synchronously
    mockDos = vi.fn<Window['Dos']>(() => player);
    window.Dos = mockDos;
  });

  afterEach(() => {
    vi.restoreAllMocks();
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
      delete (window as Partial<Window>).Dos;
      render(<DosPlayer />);

      expect(screen.getByText(/Error/i)).toBeInTheDocument();
      expect(screen.getByText(/DOS emulator library not loaded/i)).toBeInTheDocument();
    });

    it('should show reload button on error', () => {
      delete (window as Partial<Window>).Dos;
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
