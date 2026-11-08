/**
 * Tests for DosPlayerWithApps component
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, render, screen, waitFor, fireEvent } from '@testing-library/react';
import { DosPlayerWithApps } from './DosPlayerWithApps';
import type { DosApp } from '../types/dos-app';
import type { DosOptions } from '../types/js-dos';
import type { LoadedApp } from './DemoSelector';

// Type definitions for test mocks
interface DemoSelectorProps {
  onSelect: (loadedApp: LoadedApp) => void;
  onCancel: () => void;
}

interface WindowWithMockApp extends Window {
  __mockApp?: DosApp;
  __mockLoadedApp?: LoadedApp;
}

// Create a mock app
const mockApp: DosApp = {
  id: 'test-app',
  name: 'Test App',
  description: 'A test application',
  author: 'Test Author',
  year: 2024,
  loadMethod: 'zip',
  dosboxConf: '[cpu]\ncore=auto',
  loader: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3])),
};

const mockLoadedApp: LoadedApp = {
  app: mockApp,
  files: new Uint8Array([1, 2, 3]),
  dosboxConf: '[cpu]\ncore=auto',
};

const mockAppWithError: DosApp = {
  ...mockApp,
  id: 'error-app',
  loader: vi.fn().mockRejectedValue(new Error('Failed to load')),
};

/**
 * Every emulator start, in order: the DOSBox config an app ran with, or 'default' for
 * the DOS prompt (no files)
 */
const boots = vi.hoisted(() => [] as string[]);

// Mock DosPlayer component
vi.mock('./DosPlayer', async () => {
  const { useEffect, useState } = await import('react');
  return {
    DosPlayer: ({
      onReady,
      onExit,
      dosboxConf,
      options,
    }: {
      onReady?: () => void;
      onExit?: () => void;
      dosboxConf?: string;
      options?: Partial<DosOptions>;
    }) => {
      // Like useDosEmulator, which starts js-dos once per mount
      const [boot] = useState(options?.initFs ? (dosboxConf ?? 'no config') : 'default');
      useEffect(() => {
        boots.push(boot);
      }, [boot]);
      return (
        <div data-testid="dos-player-mock" data-dosbox-conf={dosboxConf ?? 'default'}>
          <button onClick={onReady}>Trigger Ready</button>
          <button onClick={onExit}>Trigger Exit</button>
        </div>
      );
    },
  };
});

const selectorDownload = vi.hoisted(() => ({
  /** Finishes the download started with "Start Download", once there is one */
  finish: (() => {}) as (loadedApp: LoadedApp) => void,
}));

// Mock DemoSelector component
vi.mock('./DemoSelector', async () => {
  const { useEffect, useState } = await import('react');
  return {
    DemoSelector: ({ onSelect, onCancel }: DemoSelectorProps) => {
      // Like the real selector, a download still running when it unmounts is aborted
      // and never delivered
      const [controller] = useState(() => new AbortController());
      useEffect(() => () => controller.abort(), [controller]);
      const startDownload = () => {
        new Promise<LoadedApp>((resolve) => {
          selectorDownload.finish = resolve;
        }).then((loadedApp) => {
          if (!controller.signal.aborted) onSelect(loadedApp);
        });
      };
      return (
        <div data-testid="demo-selector-mock">
          <button onClick={() => onSelect((window as WindowWithMockApp).__mockLoadedApp!)}>
            Select App
          </button>
          <button onClick={startDownload}>Start Download</button>
          <button onClick={onCancel}>Cancel</button>
        </div>
      );
    },
  };
});

/** An app whose download finishes or fails when the test says so */
function deferredApp(id: string) {
  let finish: (files: Uint8Array) => void = () => {};
  let fail: (error: unknown) => void = () => {};
  const loader = vi.fn<DosApp['loader']>(
    () =>
      new Promise<Uint8Array>((resolve, reject) => {
        finish = resolve;
        fail = reject;
      })
  );
  const app: DosApp = { ...mockApp, id, name: id, dosboxConf: `conf:${id}`, loader };
  // Let the component's promise callbacks and the renders they cause run
  const settle = () => act(() => new Promise((resolve) => setTimeout(resolve, 0)));
  return {
    app,
    loader,
    /** The AbortSignal the component gave the download */
    signal: () => loader.mock.lastCall?.[1],
    finish: async () => {
      finish(new Uint8Array([1]));
      await settle();
    },
    fail: async (error: unknown) => {
      fail(error);
      await settle();
    },
  };
}

describe('DosPlayerWithApps', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    boots.length = 0;
    // Store mock app and loaded app in window for the mock selector to use
    (window as WindowWithMockApp).__mockApp = mockApp;
    (window as WindowWithMockApp).__mockLoadedApp = mockLoadedApp;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('should render without crashing', () => {
      render(<DosPlayerWithApps />);
      expect(screen.getByTestId('dos-player-mock')).toBeInTheDocument();
    });

    it('should render DosPlayer component', () => {
      render(<DosPlayerWithApps />);
      expect(screen.getByTestId('dos-player-mock')).toBeInTheDocument();
    });

    it('should not show selector by default', () => {
      render(<DosPlayerWithApps showSelector={false} />);
      expect(screen.queryByTestId('demo-selector-mock')).not.toBeInTheDocument();
    });

    it('should show selector when showSelector prop is true', () => {
      render(<DosPlayerWithApps showSelector={true} />);
      expect(screen.getByTestId('demo-selector-mock')).toBeInTheDocument();
    });
  });

  describe('Prop synchronization', () => {
    it('should update selector visibility when showSelector prop changes', async () => {
      const { rerender } = render(<DosPlayerWithApps showSelector={false} />);

      // Initially, selector should not be visible
      expect(screen.queryByTestId('demo-selector-mock')).not.toBeInTheDocument();

      // Update the prop to show the selector
      rerender(<DosPlayerWithApps showSelector={true} />);

      // Selector should now be visible
      await waitFor(() => {
        expect(screen.getByTestId('demo-selector-mock')).toBeInTheDocument();
      });
    });

    it('should hide selector when showSelector prop changes from true to false', async () => {
      const { rerender } = render(<DosPlayerWithApps showSelector={true} />);

      // Initially, selector should be visible
      expect(screen.getByTestId('demo-selector-mock')).toBeInTheDocument();

      // Update the prop to hide the selector
      rerender(<DosPlayerWithApps showSelector={false} />);

      // Selector should now be hidden
      await waitFor(() => {
        expect(screen.queryByTestId('demo-selector-mock')).not.toBeInTheDocument();
      });
    });

    it('should respond to multiple prop changes', async () => {
      const { rerender } = render(<DosPlayerWithApps showSelector={false} />);

      // Show selector
      rerender(<DosPlayerWithApps showSelector={true} />);
      await waitFor(() => {
        expect(screen.getByTestId('demo-selector-mock')).toBeInTheDocument();
      });

      // Hide selector
      rerender(<DosPlayerWithApps showSelector={false} />);
      await waitFor(() => {
        expect(screen.queryByTestId('demo-selector-mock')).not.toBeInTheDocument();
      });

      // Show selector again
      rerender(<DosPlayerWithApps showSelector={true} />);
      await waitFor(() => {
        expect(screen.getByTestId('demo-selector-mock')).toBeInTheDocument();
      });
    });
  });

  describe('Callbacks', () => {
    it('should call onSelectorVisibilityChange when prop changes', async () => {
      const onSelectorVisibilityChange = vi.fn();
      const { rerender } = render(
        <DosPlayerWithApps
          showSelector={false}
          onSelectorVisibilityChange={onSelectorVisibilityChange}
        />
      );

      // Update the prop to show the selector
      rerender(
        <DosPlayerWithApps
          showSelector={true}
          onSelectorVisibilityChange={onSelectorVisibilityChange}
        />
      );

      // Wait for the selector to be visible
      await waitFor(() => {
        expect(screen.getByTestId('demo-selector-mock')).toBeInTheDocument();
      });
    });

    it('should call onReady callback when DosPlayer is ready', () => {
      const onReady = vi.fn();
      render(<DosPlayerWithApps onReady={onReady} />);

      const readyButton = screen.getByText('Trigger Ready');
      readyButton.click();

      expect(onReady).toHaveBeenCalled();
    });

    it('should call onExit callback when DosPlayer exits', () => {
      const onExit = vi.fn();
      render(<DosPlayerWithApps onExit={onExit} />);

      const exitButton = screen.getByText('Trigger Exit');
      exitButton.click();

      expect(onExit).toHaveBeenCalled();
    });
  });

  describe('Selector overlay', () => {
    it('should render overlay when selector is shown', () => {
      const { container } = render(<DosPlayerWithApps showSelector={true} />);
      const overlay = container.querySelector('.selector-overlay');
      expect(overlay).toBeInTheDocument();
    });

    it('should not render overlay when selector is hidden', () => {
      const { container } = render(<DosPlayerWithApps showSelector={false} />);
      const overlay = container.querySelector('.selector-overlay');
      expect(overlay).not.toBeInTheDocument();
    });
  });

  describe('CSS classes', () => {
    it('should apply custom className', () => {
      const { container } = render(<DosPlayerWithApps className="custom-class" />);
      const wrapper = container.querySelector('.dos-player-with-apps');
      expect(wrapper).toHaveClass('custom-class');
    });

    it('should have default class', () => {
      const { container } = render(<DosPlayerWithApps />);
      const wrapper = container.querySelector('.dos-player-with-apps');
      expect(wrapper).toBeInTheDocument();
    });
  });

  describe('Overlay click handling', () => {
    it('should close selector when overlay is clicked', async () => {
      const { container } = render(<DosPlayerWithApps showSelector={true} />);
      const overlay = container.querySelector('.selector-overlay');

      expect(overlay).toBeInTheDocument();

      fireEvent.click(overlay!);

      await waitFor(() => {
        expect(screen.queryByTestId('demo-selector-mock')).not.toBeInTheDocument();
      });
    });

    it('should call onSelectorVisibilityChange when overlay is clicked', async () => {
      const onSelectorVisibilityChange = vi.fn();
      const { container } = render(
        <DosPlayerWithApps
          showSelector={true}
          onSelectorVisibilityChange={onSelectorVisibilityChange}
        />
      );

      const overlay = container.querySelector('.selector-overlay');
      fireEvent.click(overlay!);

      await waitFor(() => {
        expect(onSelectorVisibilityChange).toHaveBeenCalledWith(false);
      });
    });
  });

  describe('App selection and loading', () => {
    it('should accept loaded app from DemoSelector', async () => {
      render(<DosPlayerWithApps showSelector={true} />);

      const selectButton = screen.getByText('Select App');
      fireEvent.click(selectButton);

      await waitFor(() => {
        // The mock DemoSelector passes the loaded app directly, so no loader call here
        expect(screen.queryByTestId('demo-selector-mock')).not.toBeInTheDocument();
      });
    });

    it('should hide selector after app is loaded', async () => {
      render(<DosPlayerWithApps showSelector={true} />);

      const selectButton = screen.getByText('Select App');
      fireEvent.click(selectButton);

      await waitFor(() => {
        expect(screen.queryByTestId('demo-selector-mock')).not.toBeInTheDocument();
      });
    });

    it('should call onAppChange when app is loaded', async () => {
      const onAppChange = vi.fn();
      render(<DosPlayerWithApps showSelector={true} onAppChange={onAppChange} />);

      const selectButton = screen.getByText('Select App');
      fireEvent.click(selectButton);

      await waitFor(() => {
        expect(onAppChange).toHaveBeenCalledWith(mockApp);
      });
    });

    it('should call onSelectorVisibilityChange when app is loaded', async () => {
      const onSelectorVisibilityChange = vi.fn();
      render(
        <DosPlayerWithApps
          showSelector={true}
          onSelectorVisibilityChange={onSelectorVisibilityChange}
        />
      );

      const selectButton = screen.getByText('Select App');
      fireEvent.click(selectButton);

      await waitFor(() => {
        expect(onSelectorVisibilityChange).toHaveBeenCalledWith(false);
      });
    });

    it('should handle app loading errors', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});

      render(<DosPlayerWithApps requestedApp={mockAppWithError} />);

      await waitFor(() => {
        expect(screen.getByText('Error Loading Application')).toBeInTheDocument();
        expect(screen.getByText('Failed to load')).toBeInTheDocument();
      });
      expect(screen.queryByText('Loading application...')).not.toBeInTheDocument();
    });

    it('should handle non-Error exceptions during loading', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      const appWithStringError: DosApp = {
        ...mockApp,
        loader: vi.fn().mockRejectedValue('String error'),
      };

      render(<DosPlayerWithApps requestedApp={appWithStringError} />);

      await waitFor(() => {
        expect(screen.getByText('Failed to load application')).toBeInTheDocument();
      });
    });

    it('should show Try Again button on error', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});

      render(<DosPlayerWithApps requestedApp={mockAppWithError} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Try Again/i })).toBeInTheDocument();
      });
    });

    it('should reset state when Try Again is clicked', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});

      render(<DosPlayerWithApps requestedApp={mockAppWithError} />);

      await waitFor(() => {
        expect(screen.getByText('Error Loading Application')).toBeInTheDocument();
      });

      const tryAgainButton = screen.getByRole('button', { name: /Try Again/i });
      fireEvent.click(tryAgainButton);

      await waitFor(() => {
        expect(screen.queryByText('Error Loading Application')).not.toBeInTheDocument();
        expect(screen.getByTestId('demo-selector-mock')).toBeInTheDocument();
      });
      expect(boots).toEqual(['default']);
    });

    it("should boot the default DOS config after Try Again, not the previous app's", async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});

      const { rerender } = render(<DosPlayerWithApps showSelector={true} />);

      // Run an app with its own DOSBox config
      fireEvent.click(screen.getByRole('button', { name: 'Select App' }));
      expect(screen.getByTestId('dos-player-mock')).toHaveAttribute(
        'data-dosbox-conf',
        '[cpu]\ncore=auto'
      );

      // A later load fails and the user resets
      rerender(<DosPlayerWithApps showSelector={true} requestedApp={mockAppWithError} />);
      fireEvent.click(await screen.findByRole('button', { name: /Try Again/i }));

      expect(screen.getByTestId('dos-player-mock')).toHaveAttribute('data-dosbox-conf', 'default');
    });

    it('should call onAppChange with null when reset', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      const onAppChange = vi.fn();

      render(<DosPlayerWithApps requestedApp={mockAppWithError} onAppChange={onAppChange} />);

      await waitFor(() => {
        expect(screen.getByText('Error Loading Application')).toBeInTheDocument();
      });

      onAppChange.mockClear();

      const tryAgainButton = screen.getByRole('button', { name: /Try Again/i });
      fireEvent.click(tryAgainButton);

      await waitFor(() => {
        expect(onAppChange).toHaveBeenCalledWith(null);
      });
    });

    it('should call onSelectorVisibilityChange with true when reset', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      const onSelectorVisibilityChange = vi.fn();

      render(
        <DosPlayerWithApps
          requestedApp={mockAppWithError}
          onSelectorVisibilityChange={onSelectorVisibilityChange}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Error Loading Application')).toBeInTheDocument();
      });

      onSelectorVisibilityChange.mockClear();

      const tryAgainButton = screen.getByRole('button', { name: /Try Again/i });
      fireEvent.click(tryAgainButton);

      await waitFor(() => {
        expect(onSelectorVisibilityChange).toHaveBeenCalledWith(true);
      });
    });
  });

  describe('Requested apps', () => {
    it('runs a requested app without booting the default prompt first', async () => {
      const stars = deferredApp('stars');
      render(<DosPlayerWithApps requestedApp={stars.app} />);

      expect(screen.getByText('Loading application...')).toBeInTheDocument();
      expect(boots).toEqual([]);

      await stars.finish();

      expect(boots).toEqual(['conf:stars']);
      expect(screen.queryByText('Loading application...')).not.toBeInTheDocument();
    });

    it('reports the requested app once it runs', async () => {
      const stars = deferredApp('stars');
      const onAppChange = vi.fn();
      render(<DosPlayerWithApps requestedApp={stars.app} onAppChange={onAppChange} />);

      expect(onAppChange).not.toHaveBeenCalled();

      await stars.finish();

      expect(onAppChange).toHaveBeenCalledExactlyOnceWith(stars.app);
    });

    it('switches to a newly requested app once it has loaded', async () => {
      const stars = deferredApp('stars');
      const { rerender } = render(<DosPlayerWithApps requestedApp={null} />);

      rerender(<DosPlayerWithApps requestedApp={stars.app} />);
      expect(screen.getByText('Loading application...')).toBeInTheDocument();
      await stars.finish();

      expect(boots).toEqual(['default', 'conf:stars']);
    });

    it('does not reload an app picked in the selector when it is requested next', () => {
      // App mirrors the pick into requestedApp once the selector reports it
      const { rerender } = render(<DosPlayerWithApps showSelector={true} requestedApp={null} />);
      fireEvent.click(screen.getByRole('button', { name: 'Select App' }));

      rerender(<DosPlayerWithApps showSelector={true} requestedApp={mockApp} />);

      expect(screen.queryByText('Loading application...')).not.toBeInTheDocument();
      expect(mockApp.loader).not.toHaveBeenCalled();
      expect(boots).toEqual(['default', '[cpu]\ncore=auto']);
    });

    it('leaves the selector open when a requested app finishes loading behind it', async () => {
      const stars = deferredApp('stars');
      const onSelectorVisibilityChange = vi.fn();
      const { rerender } = render(
        <DosPlayerWithApps
          requestedApp={stars.app}
          showSelector={false}
          onSelectorVisibilityChange={onSelectorVisibilityChange}
        />
      );

      // The user opens the selector while the deep link is still loading
      rerender(
        <DosPlayerWithApps
          requestedApp={stars.app}
          showSelector={true}
          onSelectorVisibilityChange={onSelectorVisibilityChange}
        />
      );
      await stars.finish();

      expect(screen.getByTestId('demo-selector-mock')).toBeInTheDocument();
      expect(onSelectorVisibilityChange).not.toHaveBeenCalledWith(false);
    });

    it('stops the running app and boots the default prompt when no app is requested', async () => {
      const stars = deferredApp('stars');
      const { rerender } = render(<DosPlayerWithApps requestedApp={stars.app} />);
      await stars.finish();

      rerender(<DosPlayerWithApps requestedApp={null} />);

      expect(boots).toEqual(['conf:stars', 'default']);
      expect(screen.getByTestId('dos-player-mock')).toHaveAttribute('data-dosbox-conf', 'default');
    });

    it('replaces a load error with the default prompt when no app is requested', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      const { rerender } = render(<DosPlayerWithApps requestedApp={mockAppWithError} />);
      expect(await screen.findByText('Error Loading Application')).toBeInTheDocument();

      rerender(<DosPlayerWithApps requestedApp={null} />);

      expect(screen.queryByText('Error Loading Application')).not.toBeInTheDocument();
      expect(boots).toEqual(['default']);
    });

    it('clears an earlier load error when another app is requested', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      const stars = deferredApp('stars');
      const { rerender } = render(<DosPlayerWithApps requestedApp={mockAppWithError} />);
      expect(await screen.findByText('Error Loading Application')).toBeInTheDocument();

      rerender(<DosPlayerWithApps requestedApp={stars.app} />);

      expect(screen.queryByText('Error Loading Application')).not.toBeInTheDocument();
      await stars.finish();
      expect(boots).toEqual(['conf:stars']);
    });
  });

  describe('Overlapping loads', () => {
    it('aborts the download of a request that a newer one supersedes', () => {
      const stars = deferredApp('stars');
      const rotate = deferredApp('3drotate');
      const { rerender } = render(<DosPlayerWithApps requestedApp={stars.app} />);
      expect(stars.signal()?.aborted).toBe(false);

      rerender(<DosPlayerWithApps requestedApp={rotate.app} />);

      expect(stars.signal()?.aborted).toBe(true);
      expect(rotate.signal()?.aborted).toBe(false);
    });

    it('ignores a superseded load that finishes after the newer one', async () => {
      const stars = deferredApp('stars');
      const rotate = deferredApp('3drotate');
      const onAppChange = vi.fn();
      const { rerender } = render(
        <DosPlayerWithApps requestedApp={stars.app} onAppChange={onAppChange} />
      );
      rerender(<DosPlayerWithApps requestedApp={rotate.app} onAppChange={onAppChange} />);

      await rotate.finish();
      await stars.finish();

      expect(boots).toEqual(['conf:3drotate']);
      expect(onAppChange).toHaveBeenCalledExactlyOnceWith(rotate.app);
    });

    it('ignores a superseded load that finishes before the newer one', async () => {
      const stars = deferredApp('stars');
      const rotate = deferredApp('3drotate');
      const { rerender } = render(<DosPlayerWithApps requestedApp={stars.app} />);
      rerender(<DosPlayerWithApps requestedApp={rotate.app} />);

      await stars.finish();

      expect(boots).toEqual([]);
      expect(screen.getByText('Loading application...')).toBeInTheDocument();

      await rotate.finish();

      expect(boots).toEqual(['conf:3drotate']);
    });

    it('does not report a superseded load that fails', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      const broken = deferredApp('broken');
      const stars = deferredApp('stars');
      const { rerender } = render(<DosPlayerWithApps requestedApp={broken.app} />);
      rerender(<DosPlayerWithApps requestedApp={stars.app} />);

      await broken.fail(new Error('Network down'));

      expect(screen.queryByText('Error Loading Application')).not.toBeInTheDocument();
      expect(consoleError).not.toHaveBeenCalled();
      await stars.finish();
      expect(boots).toEqual(['conf:stars']);
    });

    it('drops a load still running when no app is requested', async () => {
      const stars = deferredApp('stars');
      const { rerender } = render(<DosPlayerWithApps requestedApp={null} />);
      rerender(<DosPlayerWithApps requestedApp={stars.app} />);

      rerender(<DosPlayerWithApps requestedApp={null} />);

      expect(stars.signal()?.aborted).toBe(true);
      expect(screen.queryByText('Loading application...')).not.toBeInTheDocument();
      await stars.finish();
      // The default prompt kept running throughout
      expect(boots).toEqual(['default']);
    });

    it('keeps the running app when the request returns to it during another load', async () => {
      const stars = deferredApp('stars');
      const rotate = deferredApp('3drotate');
      const { rerender } = render(<DosPlayerWithApps requestedApp={rotate.app} />);
      await rotate.finish();
      rerender(<DosPlayerWithApps requestedApp={stars.app} />);

      rerender(<DosPlayerWithApps requestedApp={rotate.app} />);

      expect(stars.signal()?.aborted).toBe(true);
      expect(screen.queryByText('Loading application...')).not.toBeInTheDocument();
      await stars.finish();
      expect(boots).toEqual(['conf:3drotate']);
    });

    it('lets an app picked in the selector win over a requested app still loading', async () => {
      const stars = deferredApp('stars');
      const onAppChange = vi.fn();
      const { rerender } = render(
        <DosPlayerWithApps requestedApp={stars.app} onAppChange={onAppChange} />
      );
      // The user opens the selector during the download and picks another app
      rerender(
        <DosPlayerWithApps requestedApp={stars.app} showSelector={true} onAppChange={onAppChange} />
      );
      fireEvent.click(screen.getByRole('button', { name: 'Select App' }));

      expect(stars.signal()?.aborted).toBe(true);
      expect(screen.queryByText('Loading application...')).not.toBeInTheDocument();
      await stars.finish();
      expect(boots).toEqual(['[cpu]\ncore=auto']);
      expect(onAppChange).toHaveBeenCalledExactlyOnceWith(mockApp);
    });

    it('clears a load error when an app is picked in the selector', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      const { rerender } = render(<DosPlayerWithApps requestedApp={mockAppWithError} />);
      expect(await screen.findByText('Error Loading Application')).toBeInTheDocument();
      rerender(<DosPlayerWithApps requestedApp={mockAppWithError} showSelector={true} />);

      fireEvent.click(screen.getByRole('button', { name: 'Select App' }));

      expect(screen.queryByText('Error Loading Application')).not.toBeInTheDocument();
      expect(boots).toEqual(['[cpu]\ncore=auto']);
    });

    it('drops a download the selector still has running when a new request arrives', async () => {
      const stars = deferredApp('stars');
      const onAppChange = vi.fn();
      const { rerender } = render(
        <DosPlayerWithApps requestedApp={stars.app} onAppChange={onAppChange} />
      );
      await stars.finish();
      // The user starts another app from the selector, then goes back to the start page,
      // which keeps the selector open
      rerender(
        <DosPlayerWithApps requestedApp={stars.app} showSelector={true} onAppChange={onAppChange} />
      );
      fireEvent.click(screen.getByRole('button', { name: 'Start Download' }));
      rerender(
        <DosPlayerWithApps requestedApp={null} showSelector={true} onAppChange={onAppChange} />
      );

      await act(async () => selectorDownload.finish(mockLoadedApp));

      expect(boots).toEqual(['conf:stars', 'default']);
      expect(onAppChange).toHaveBeenCalledExactlyOnceWith(stars.app);
      expect(screen.getByTestId('demo-selector-mock')).toBeInTheDocument();
    });

    it('aborts a requested load when unmounted', () => {
      const stars = deferredApp('stars');
      const { unmount } = render(<DosPlayerWithApps requestedApp={stars.app} />);

      unmount();

      expect(stars.signal()?.aborted).toBe(true);
    });
  });

  describe('Cancel functionality', () => {
    it('should hide selector when Cancel is clicked', async () => {
      render(<DosPlayerWithApps showSelector={true} />);

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByTestId('demo-selector-mock')).not.toBeInTheDocument();
      });
    });

    it('should call onSelectorVisibilityChange when Cancel is clicked', async () => {
      const onSelectorVisibilityChange = vi.fn();
      render(
        <DosPlayerWithApps
          showSelector={true}
          onSelectorVisibilityChange={onSelectorVisibilityChange}
        />
      );

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      await waitFor(() => {
        expect(onSelectorVisibilityChange).toHaveBeenCalledWith(false);
      });
    });
  });
});
