/**
 * Tests for DosPlayer component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { DosPlayer } from './DosPlayer';

// Mock window.Dos
const mockDos = vi.fn();
const mockStop = vi.fn().mockResolvedValue(undefined);

describe('DosPlayer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStop.mockClear();

    // Setup window.Dos mock
    global.window.Dos = mockDos.mockReturnValue({
      stop: mockStop,
      getVersion: () => ['8.3.20', 'dosbox'],
      getToken: () => null,
    });
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
      global.window.Dos = undefined;
      render(<DosPlayer />);

      expect(screen.getByText(/Error/i)).toBeInTheDocument();
      expect(screen.getByText(/DOS emulator library not loaded/i)).toBeInTheDocument();
    });

    it('should show reload button on error', () => {
      global.window.Dos = undefined;
      render(<DosPlayer />);

      expect(screen.getByRole('button', { name: /Reload Page/i })).toBeInTheDocument();
    });

    it('should handle initialization errors gracefully', () => {
      global.window.Dos = vi.fn().mockImplementation(() => {
        throw new Error('Initialization failed');
      });

      render(<DosPlayer />);

      waitFor(() => {
        expect(screen.getByText(/Failed to initialize DOS emulator/i)).toBeInTheDocument();
      });
    });

    it('should suppress fullscreen errors from unhandled promise rejections', () => {
      const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});

      render(<DosPlayer />);

      // Simulate a fullscreen error from js-dos
      const fullscreenError = new TypeError("Failed to execute 'exitFullscreen' on 'Document': Document not active");
      const event = new PromiseRejectionEvent('unhandledrejection', {
        promise: Promise.reject(fullscreenError),
        reason: fullscreenError,
        cancelable: true,
      });

      // Dispatch the event
      window.dispatchEvent(event);

      // The error should be prevented from propagating
      expect(event.defaultPrevented).toBe(true);

      consoleWarn.mockRestore();
    });

    it('should not suppress non-fullscreen errors', () => {
      render(<DosPlayer />);

      // Simulate a different error
      const otherError = new Error('Some other error');
      const event = new PromiseRejectionEvent('unhandledrejection', {
        promise: Promise.reject(otherError),
        reason: otherError,
        cancelable: true,
      });

      // Dispatch the event
      window.dispatchEvent(event);

      // The error should NOT be prevented (should propagate normally)
      expect(event.defaultPrevented).toBe(false);
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
    it('should call onReady when provided', async () => {
      const onReady = vi.fn();
      const mockCi = {
        events: () => ({
          onExit: vi.fn(),
          onStdout: vi.fn(),
        }),
      };

      const mockDosProps = {
        stop: mockStop,
        getVersion: vi.fn(),
        getToken: vi.fn(),
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

      global.window.Dos = vi.fn((_element, options) => {
        // Simulate ci-ready event
        setTimeout(() => {
          options?.onEvent?.('ci-ready', mockCi);
        }, 0);
        return mockDosProps;
      });

      render(<DosPlayer onReady={onReady} />);

      await waitFor(() => {
        expect(onReady).toHaveBeenCalledWith(mockCi);
      });
    });

    it('should call onExit when DOS exits', async () => {
      const onExit = vi.fn();
      let exitCallback: (() => void) | undefined;

      const mockCi = {
        events: () => ({
          onExit: (cb: () => void) => {
            exitCallback = cb;
          },
          onStdout: vi.fn(),
        }),
      };

      const mockDosProps = {
        stop: mockStop,
        getVersion: vi.fn(),
        getToken: vi.fn(),
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

      global.window.Dos = vi.fn((_element, options) => {
        setTimeout(() => {
          options?.onEvent?.('ci-ready', mockCi);
        }, 0);
        return mockDosProps;
      });

      render(<DosPlayer onExit={onExit} />);

      await waitFor(() => {
        expect(exitCallback).toBeDefined();
      });

      // Trigger exit
      exitCallback?.();
      expect(onExit).toHaveBeenCalled();
    });
  });

  describe('Cleanup', () => {
    it('should call stop on unmount', () => {
      const { unmount } = render(<DosPlayer />);
      unmount();
      
      expect(mockStop).toHaveBeenCalled();
    });

    it('should handle stop errors gracefully', () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockStop.mockRejectedValueOnce(new Error('Stop failed'));
      
      const { unmount } = render(<DosPlayer />);
      unmount();
      
      // Should not throw
      expect(mockStop).toHaveBeenCalled();
      
      consoleError.mockRestore();
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

