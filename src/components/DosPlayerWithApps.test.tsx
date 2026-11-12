/**
 * Tests for DosPlayerWithApps component
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DosPlayerWithApps } from './DosPlayerWithApps';
import type { DosApp } from '../types/dos-app';
import type { DosOptions } from '../types/js-dos';
import type { LoadedApp } from './DemoSelector';

// Type definitions for test mocks
interface DemoSelectorProps {
  onSelect: (loadedApp: LoadedApp) => void;
  onCancel: () => void;
  notice?: string | null;
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
  kind: 'demo',
  archiveBytes: 3,
  loadMethod: 'zip',
  dosboxConf: '[cpu]\ncore=auto',
  loader: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3])),
};

const mockLoadedApp: LoadedApp = {
  app: mockApp,
  files: new Uint8Array([1, 2, 3]),
  dosboxConf: '[cpu]\ncore=auto',
};

// Chrome's words for a download that cannot reach the server
const mockAppWithError: DosApp = {
  ...mockApp,
  id: 'error-app',
  loader: vi.fn().mockRejectedValue(new TypeError('Failed to fetch')),
};

/**
 * Every emulator start, in order: the DOSBox config an app ran with, or 'default' for
 * the DOS prompt (no files)
 */
const boots = vi.hoisted(() => [] as string[]);

/** Every emulator stop, in order, named as in boots */
const stops = vi.hoisted(() => [] as string[]);

/**
 * The handle of each emulator that got ready, in order: its player's pause calls, and a way
 * to print a line on its DOS console
 */
const handles = vi.hoisted(
  () =>
    [] as {
      boot: string;
      paused: boolean[];
      fullScreen: boolean[];
      keys: string[];
      print: (line: string) => void;
    }[]
);

// Mock DosPlayer component
vi.mock('./DosPlayer', async () => {
  const { useEffect, useState } = await import('react');
  return {
    DosPlayer: ({
      onReady,
      onHandle,
      onExit,
      onError,
      dosboxConf,
      options,
    }: {
      onReady?: () => void;
      onHandle?: (handle: unknown) => void;
      onExit?: () => void;
      onError?: (error: string) => void;
      dosboxConf?: string;
      options?: Partial<DosOptions>;
    }) => {
      // Like useDosEmulator, which starts js-dos once per mount and stops it on unmount
      const [boot] = useState(options?.initFs ? (dosboxConf ?? 'no config') : 'default');
      useEffect(() => {
        boots.push(boot);
        return () => {
          stops.push(boot);
        };
      }, [boot]);
      // Like useDosEmulator, which hands out the player with what DOS prints once ready
      const ready = () => {
        onReady?.();
        const listeners = new Set<(line: string) => void>();
        const entry = {
          boot,
          paused: [] as boolean[],
          fullScreen: [] as boolean[],
          keys: [] as string[],
          print: (line: string) => listeners.forEach((listener) => listener(line)),
        };
        handles.push(entry);
        onHandle?.({
          ci: {
            events: () => ({ onFrame: () => {} }),
            width: () => 640,
            height: () => 400,
            sendKeyEvent: (code: number, pressed: boolean) =>
              entry.keys.push(`${code} ${pressed ? 'down' : 'up'}`),
          },
          player: {
            setPaused: (paused: boolean) => entry.paused.push(paused),
            setFullScreen: (fullScreen: boolean) => entry.fullScreen.push(fullScreen),
          },
          stdout: {
            subscribe: (listener: (line: string) => void) => {
              listeners.add(listener);
              return () => listeners.delete(listener);
            },
          },
          messages: { subscribe: () => () => {} },
        });
      };
      return (
        <div data-testid="dos-player-mock" data-dosbox-conf={dosboxConf ?? 'default'}>
          <button onClick={ready}>Trigger Ready</button>
          <button onClick={onExit}>Trigger Exit</button>
          <button onClick={() => onError?.('Failed to initialize js-dos')}>Trigger Error</button>
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
    DemoSelector: ({ onSelect, onCancel, notice }: DemoSelectorProps) => {
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
          {notice && <p data-testid="selector-notice">{notice}</p>}
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

/**
 * A stylesheet beside this file, read from disk: Vitest keeps imported CSS out of tests.
 * node:fs comes through importActual, as the tests have the browser's types only.
 */
async function readStylesheet(file: string): Promise<string> {
  const fs = await vi.importActual<{ readFileSync(file: URL, encoding: 'utf8'): string }>(
    'node:fs'
  );
  return fs.readFileSync(new URL(file, import.meta.url), 'utf8');
}

/** WCAG's contrast ratio between two opaque colours as getComputedStyle gives them */
function contrastRatio(foreground: string, background: string): number {
  const luminance = (color: string) => {
    const [r = 0, g = 0, b = 0, alpha = 1] = (color.match(/[\d.]+/g) ?? []).map(Number);
    if (alpha < 1) throw new Error(`${color} is not an opaque colour`);
    const linear = (channel: number) => {
      const c = channel / 255;
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
  };
  const [lighter = 0, darker = 0] = [luminance(foreground), luminance(background)].sort(
    (a, b) => b - a
  );
  return (lighter + 0.05) / (darker + 0.05);
}

describe('DosPlayerWithApps', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    boots.length = 0;
    stops.length = 0;
    handles.length = 0;
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

    it('gives the selector the notice its parent passes, such as a link that named no app', () => {
      render(<DosPlayerWithApps showSelector={true} selectorNotice='Application "x" not found.' />);

      expect(screen.getByTestId('selector-notice')).toHaveTextContent('Application "x" not found.');
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
    // The parent knows: it is the one that opened it
    it('does not report a selector that the showSelector prop opens', async () => {
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
      expect(onSelectorVisibilityChange).not.toHaveBeenCalled();
    });

    it('should call onReady callback when DosPlayer is ready', () => {
      const onReady = vi.fn();
      render(<DosPlayerWithApps onReady={onReady} />);

      // fireEvent clicks inside act(), as the status a ready player sets is React state
      fireEvent.click(screen.getByText('Trigger Ready'));

      expect(onReady).toHaveBeenCalled();
    });

    it('should call onExit callback when DosPlayer exits', () => {
      const onExit = vi.fn();
      render(<DosPlayerWithApps onExit={onExit} />);

      fireEvent.click(screen.getByText('Trigger Exit'));

      expect(onExit).toHaveBeenCalled();
    });
  });

  // What the page's footer shows
  describe('Status', () => {
    it('reports loading until js-dos reports the emulator ready', () => {
      const onStatusChange = vi.fn();
      render(<DosPlayerWithApps onStatusChange={onStatusChange} />);

      expect(onStatusChange.mock.calls).toEqual([['loading']]);

      fireEvent.click(screen.getByRole('button', { name: 'Trigger Ready' }));

      expect(onStatusChange.mock.calls).toEqual([['loading'], ['ready']]);
    });

    // A DOS prompt whose emulator failed, such as when emulators.js failed to download, which
    // the next start loads again: the prompt the start page brings back starts afresh
    it('reports loading for a new DOS prompt after an earlier one failed to start', () => {
      const onStatusChange = vi.fn();
      const { rerender } = render(<DosPlayerWithApps onStatusChange={onStatusChange} />);
      fireEvent.click(screen.getByRole('button', { name: 'Trigger Error' }));
      expect(onStatusChange).toHaveBeenLastCalledWith('error');

      // An app is requested, then the start page again before it has loaded
      rerender(
        <DosPlayerWithApps
          requestedApp={deferredApp('stars').app}
          onStatusChange={onStatusChange}
        />
      );
      rerender(<DosPlayerWithApps requestedApp={null} onStatusChange={onStatusChange} />);

      expect(onStatusChange).toHaveBeenLastCalledWith('loading');
    });

    it('reports loading while a requested app downloads and its emulator starts', async () => {
      const stars = deferredApp('stars');
      const onStatusChange = vi.fn();
      render(<DosPlayerWithApps requestedApp={stars.app} onStatusChange={onStatusChange} />);

      await stars.finish();

      expect(onStatusChange.mock.calls).toEqual([['loading']]);
      fireEvent.click(screen.getByRole('button', { name: 'Trigger Ready' }));
      expect(onStatusChange).toHaveBeenLastCalledWith('ready');
    });

    it('reports an error while the load error shows, and loading again on Try Again', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      const stars = deferredApp('stars');
      const onStatusChange = vi.fn();
      render(<DosPlayerWithApps requestedApp={stars.app} onStatusChange={onStatusChange} />);

      await stars.fail(new TypeError('Failed to fetch'));

      expect(onStatusChange.mock.calls).toEqual([['loading'], ['error']]);

      fireEvent.click(screen.getByRole('button', { name: 'Try Again' }));

      expect(onStatusChange.mock.calls).toEqual([['loading'], ['error'], ['loading']]);
    });

    it('reports an error when the emulator cannot start', () => {
      const onStatusChange = vi.fn();
      render(<DosPlayerWithApps onStatusChange={onStatusChange} />);

      fireEvent.click(screen.getByRole('button', { name: 'Trigger Error' }));

      expect(onStatusChange.mock.calls).toEqual([['loading'], ['error']]);
    });

    it('reports loading for the next app until its emulator is ready', () => {
      const onStatusChange = vi.fn();
      const { rerender } = render(<DosPlayerWithApps onStatusChange={onStatusChange} />);
      fireEvent.click(screen.getByRole('button', { name: 'Trigger Ready' }));
      rerender(<DosPlayerWithApps showSelector={true} onStatusChange={onStatusChange} />);

      fireEvent.click(screen.getByRole('button', { name: 'Select App' }));

      expect(onStatusChange.mock.calls).toEqual([['loading'], ['ready'], ['loading']]);
      fireEvent.click(screen.getByRole('button', { name: 'Trigger Ready' }));
      expect(onStatusChange).toHaveBeenLastCalledWith('ready');
    });

    // Nothing runs then until the next start, as the footer said before
    it('reports loading once DOS has exited', () => {
      const onStatusChange = vi.fn();
      render(<DosPlayerWithApps onStatusChange={onStatusChange} />);
      fireEvent.click(screen.getByRole('button', { name: 'Trigger Ready' }));

      fireEvent.click(screen.getByRole('button', { name: 'Trigger Exit' }));

      expect(onStatusChange.mock.calls).toEqual([['loading'], ['ready'], ['loading']]);
    });

    it('still passes the ready emulator and its exit on', () => {
      const onReady = vi.fn();
      const onExit = vi.fn();
      render(<DosPlayerWithApps onReady={onReady} onExit={onExit} onStatusChange={() => {}} />);

      fireEvent.click(screen.getByRole('button', { name: 'Trigger Ready' }));
      fireEvent.click(screen.getByRole('button', { name: 'Trigger Exit' }));

      expect(onReady).toHaveBeenCalledOnce();
      expect(onExit).toHaveBeenCalledOnce();
    });
  });

  describe('Behind the selector', () => {
    it('runs nothing behind a selector open from the start, and reports idle', () => {
      const onStatusChange = vi.fn();
      render(<DosPlayerWithApps showSelector={true} onStatusChange={onStatusChange} />);

      expect(screen.queryByTestId('dos-player-mock')).not.toBeInTheDocument();
      expect(boots).toEqual([]);
      expect(onStatusChange).toHaveBeenLastCalledWith('idle');
    });

    it('boots the DOS prompt once that selector is cancelled', () => {
      render(<DosPlayerWithApps showSelector={true} />);

      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(boots).toEqual(['default']);
    });

    it('pauses the running app while the selector is open, and resumes it on Cancel', () => {
      const { rerender } = render(<DosPlayerWithApps showSelector={true} />);
      fireEvent.click(screen.getByRole('button', { name: 'Select App' }));
      fireEvent.click(screen.getByRole('button', { name: 'Trigger Ready' }));

      rerender(<DosPlayerWithApps showSelector={false} />);
      rerender(<DosPlayerWithApps showSelector={true} />);
      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(handles[0]?.paused).toEqual([true, false]);
    });
  });

  describe('Play screen', () => {
    /** Whether the page has a click or key press of the last few seconds to start sound with */
    const setActivation = (isActive: boolean) =>
      Object.defineProperty(navigator, 'userActivation', {
        configurable: true,
        value: { isActive, hasBeenActive: isActive },
      });
    afterEach(() => setActivation(true));

    it('asks for Play before it starts a production opened with no fresh click', async () => {
      setActivation(false);
      const stars = deferredApp('stars');
      const onStatusChange = vi.fn();
      render(<DosPlayerWithApps requestedApp={stars.app} onStatusChange={onStatusChange} />);
      await stars.finish();

      // Nothing runs behind it: sound started by the click that starts the emulator plays
      expect(boots).toEqual([]);
      expect(onStatusChange).toHaveBeenLastCalledWith('idle');
      fireEvent.click(screen.getByRole('button', { name: 'Play' }));

      expect(boots).toEqual(['conf:stars']);
      expect(screen.queryByRole('button', { name: 'Play' })).not.toBeInTheDocument();
    });

    it('starts a production picked with a fresh click at once', () => {
      render(<DosPlayerWithApps showSelector={true} />);

      fireEvent.click(screen.getByRole('button', { name: 'Select App' }));

      expect(screen.queryByRole('button', { name: 'Play' })).not.toBeInTheDocument();
      expect(boots).toEqual(['[cpu]\ncore=auto']);
    });

    it('warns of flashing lights, and says what its start will do', async () => {
      setActivation(false);
      const panic = deferredApp('panic');
      Object.assign(panic.app, {
        flashing: true,
        startNote: 'DosKit picks Execute the demo in its menu.',
      });
      render(<DosPlayerWithApps requestedApp={panic.app} />);
      await panic.finish();

      expect(screen.getByText(/contains flashing lights/i)).toBeInTheDocument();
      expect(screen.getByText('DosKit picks Execute the demo in its menu.')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Play' })).toHaveFocus();
    });

    it("names a tracker's button Start", async () => {
      setActivation(false);
      const tracker = deferredApp('tracker');
      Object.assign(tracker.app, { kind: 'tracker' });
      render(<DosPlayerWithApps requestedApp={tracker.app} />);
      await tracker.finish();

      expect(screen.getByRole('button', { name: 'Start' })).toBeInTheDocument();
    });
  });

  describe('Start keys', () => {
    const appWithStart: DosApp = {
      ...mockApp,
      id: 'with-start',
      name: 'Start App',
      start: { steps: [{ keys: [257] }], gapMs: 250, ready: { stdout: 'READY' } },
      startNote: 'DosKit presses Enter at its setup.',
      hint: 'Press Enter to start it.',
    };
    const pickAppWithStart = () => {
      (window as WindowWithMockApp).__mockLoadedApp = { ...mockLoadedApp, app: appWithStart };
      render(<DosPlayerWithApps showSelector={true} />);
      fireEvent.click(screen.getByRole('button', { name: 'Select App' }));
      fireEvent.click(screen.getByRole('button', { name: 'Trigger Ready' }));
    };

    it('sends its keys once its setup screen is up', async () => {
      pickAppWithStart();
      expect(handles[0]?.keys).toEqual([]);

      act(() => handles[0]?.print('READY'));

      await waitFor(() => expect(handles[0]?.keys).toContain('257 down'));
    });

    it('shows the keys to press when its setup screen never comes', async () => {
      vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'performance'] });
      try {
        pickAppWithStart();

        await act(() => vi.advanceTimersByTimeAsync(46_000));

        expect(screen.getByText('Press Enter to start it.')).toBeInTheDocument();
        expect(handles[0]?.keys).toEqual([]);
      } finally {
        vi.useRealTimers();
      }
    });
  });

  describe("A program's end", () => {
    const loadedWithAutoexec: LoadedApp = {
      ...mockLoadedApp,
      dosboxConf: '[cpu]\ncore=auto\n\n[autoexec]\nTEST.EXE\n',
    };

    const runToTheEnd = () => {
      (window as WindowWithMockApp).__mockLoadedApp = loadedWithAutoexec;
      const result = render(<DosPlayerWithApps showSelector={true} />);
      fireEvent.click(screen.getByRole('button', { name: 'Select App' }));
      fireEvent.click(screen.getByRole('button', { name: 'Trigger Ready' }));
      act(() => handles[0]?.print('Test App has ended.'));
      return result;
    };

    it('offers to play it again, or to choose another, once it returns to DOS', () => {
      runToTheEnd();

      const card = screen.getByRole('dialog', { name: 'Test App has ended.' });
      expect(within(card).getByRole('button', { name: 'Play again' })).toHaveFocus();
      expect(within(card).getByRole('button', { name: 'Choose another' })).toBeInTheDocument();
      expect(within(card).getByRole('button', { name: 'Back to DOS' })).toBeInTheDocument();
    });

    it("leaves js-dos's fullscreen, where the card would be hidden", () => {
      runToTheEnd();

      expect(handles[0]?.fullScreen).toEqual([false]);
    });

    it('plays it again from the files it has, on Play again', () => {
      runToTheEnd();

      fireEvent.click(screen.getByRole('button', { name: 'Play again' }));

      const conf = `${loadedWithAutoexec.dosboxConf}echo.\necho Test App has ended.\n`;
      expect(boots).toEqual([conf, conf]);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('leaves the DOS prompt on Back to DOS', () => {
      runToTheEnd();

      fireEvent.click(screen.getByRole('button', { name: 'Back to DOS' }));

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(boots).toHaveLength(1);
    });

    it('opens the selector on Choose another', () => {
      const onSelectorVisibilityChange = vi.fn();
      (window as WindowWithMockApp).__mockLoadedApp = loadedWithAutoexec;
      render(
        <DosPlayerWithApps
          showSelector={true}
          onSelectorVisibilityChange={onSelectorVisibilityChange}
        />
      );
      fireEvent.click(screen.getByRole('button', { name: 'Select App' }));
      fireEvent.click(screen.getByRole('button', { name: 'Trigger Ready' }));
      act(() => handles[0]?.print('Test App has ended.'));

      fireEvent.click(screen.getByRole('button', { name: 'Choose another' }));

      expect(screen.getByTestId('demo-selector-mock')).toBeInTheDocument();
      expect(onSelectorVisibilityChange).toHaveBeenLastCalledWith(true);
    });

    it('has the autoexec print a line once the program returns to DOS', () => {
      (window as WindowWithMockApp).__mockLoadedApp = loadedWithAutoexec;
      render(<DosPlayerWithApps showSelector={true} />);

      fireEvent.click(screen.getByRole('button', { name: 'Select App' }));

      expect(screen.getByTestId('dos-player-mock')).toHaveAttribute(
        'data-dosbox-conf',
        '[cpu]\ncore=auto\n\n[autoexec]\nTEST.EXE\necho.\necho Test App has ended.\n'
      );
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

      const alert = await screen.findByRole('alert');
      expect(alert).toHaveTextContent('Error Loading Application');
      // Explained, not the browser's own words
      expect(alert).toHaveTextContent('Unable to connect to the server');
      expect(alert).toHaveTextContent('Please check your internet connection and try again.');
      expect(screen.queryByText('Loading application...')).not.toBeInTheDocument();
    });

    it('keeps the technical message in a collapsed details line', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});

      render(<DosPlayerWithApps requestedApp={mockAppWithError} />);

      const alert = await screen.findByRole('alert');
      const technical = within(alert).getByText('Failed to fetch');
      expect(technical.closest('details')).not.toHaveAttribute('open');
      expect(technical).not.toBeVisible();
      expect(within(alert).getByText('Details')).toBeVisible();
    });

    it('says that the app needs a connection until it has been opened online', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);

      render(<DosPlayerWithApps requestedApp={mockAppWithError} />);

      const alert = await screen.findByRole('alert');
      expect(alert).toHaveTextContent("This application isn't available offline yet");
      expect(alert).toHaveTextContent(
        'Each application works offline once it has been opened while online.'
      );
    });

    it('explains an archive the server does not have', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      const missing: DosApp = {
        ...mockApp,
        id: 'missing-app',
        loader: vi.fn().mockRejectedValue(new Error('Failed to load ZIP: HTTP 404')),
      };

      render(<DosPlayerWithApps requestedApp={missing} />);

      expect(await screen.findByRole('alert')).toHaveTextContent(
        'The requested file was not found'
      );
    });

    it('should handle non-Error exceptions during loading', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      const appWithStringError: DosApp = {
        ...mockApp,
        loader: vi.fn().mockRejectedValue('String error'),
      };

      render(<DosPlayerWithApps requestedApp={appWithStringError} />);

      expect(await screen.findByRole('alert')).toHaveTextContent('An unexpected error occurred');
    });
  });

  describe('Error overlay', () => {
    beforeEach(() => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    it('offers Try Again and Choose Another Application', async () => {
      render(<DosPlayerWithApps requestedApp={mockAppWithError} />);

      const alert = await screen.findByRole('alert');
      expect(within(alert).getByRole('button', { name: 'Try Again' })).toBeInTheDocument();
      expect(
        within(alert).getByRole('button', { name: 'Choose Another Application' })
      ).toBeInTheDocument();
    });

    it('loads the app that failed again on Try Again', async () => {
      const stars = deferredApp('stars');
      const onAppChange = vi.fn();
      const onSelectorVisibilityChange = vi.fn();
      render(
        <DosPlayerWithApps
          requestedApp={stars.app}
          onAppChange={onAppChange}
          onSelectorVisibilityChange={onSelectorVisibilityChange}
        />
      );
      await stars.fail(new Error('Failed to load ZIP: HTTP 503'));

      fireEvent.click(screen.getByRole('button', { name: 'Try Again' }));

      expect(stars.loader).toHaveBeenCalledTimes(2);
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      expect(screen.getByText('Loading application...')).toBeInTheDocument();
      expect(screen.queryByTestId('demo-selector-mock')).not.toBeInTheDocument();

      await stars.finish();

      expect(boots).toEqual(['conf:stars']);
      expect(onAppChange).toHaveBeenCalledExactlyOnceWith(stars.app);
      expect(onSelectorVisibilityChange).not.toHaveBeenCalled();
    });

    it('shows the error again when Try Again fails too', async () => {
      const stars = deferredApp('stars');
      render(<DosPlayerWithApps requestedApp={stars.app} />);
      await stars.fail(new TypeError('Failed to fetch'));

      fireEvent.click(screen.getByRole('button', { name: 'Try Again' }));
      await stars.fail(new Error('Failed to load ZIP: HTTP 404'));

      expect(screen.getByRole('alert')).toHaveTextContent('The requested file was not found');
      expect(screen.getByRole('button', { name: 'Try Again' })).toHaveFocus();
      expect(boots).toEqual([]);
    });

    // Normal-size text needs 4.5:1. On the page's accent colour, Try Again's white text had
    // 2.75:1, and 3.12:1 in the light colour scheme.
    it('draws Try Again in colours of its own, with 4.5:1 contrast between them', async () => {
      const sheet = document.createElement('style');
      sheet.textContent = await readStylesheet('DosPlayerWithApps.css');
      document.head.append(sheet);
      try {
        render(<DosPlayerWithApps requestedApp={mockAppWithError} />);

        const style = getComputedStyle(await screen.findByRole('button', { name: 'Try Again' }));

        expect(contrastRatio(style.color, style.backgroundColor)).toBeGreaterThanOrEqual(4.5);
      } finally {
        sheet.remove();
      }
    });

    it('focuses Try Again when the error appears', async () => {
      render(<DosPlayerWithApps requestedApp={mockAppWithError} />);

      // The button can be in the page a moment before the effect that focuses it has run
      await waitFor(() => expect(screen.getByRole('button', { name: 'Try Again' })).toHaveFocus());
    });

    it('reaches both buttons from the keyboard', async () => {
      const user = userEvent.setup();
      const stars = deferredApp('stars');
      render(<DosPlayerWithApps requestedApp={stars.app} />);
      await stars.fail(new TypeError('Failed to fetch'));

      await user.tab();
      expect(screen.getByRole('button', { name: 'Choose Another Application' })).toHaveFocus();
      await user.tab({ shift: true });
      expect(screen.getByRole('button', { name: 'Try Again' })).toHaveFocus();
      await user.keyboard('{Enter}');

      expect(stars.loader).toHaveBeenCalledTimes(2);
    });

    it('leaves the focus in a selector opened during the load', async () => {
      const stars = deferredApp('stars');
      const { rerender } = render(<DosPlayerWithApps requestedApp={stars.app} />);
      rerender(<DosPlayerWithApps requestedApp={stars.app} showSelector={true} />);
      const pick = screen.getByRole('button', { name: 'Select App' });
      act(() => pick.focus());

      await stars.fail(new TypeError('Failed to fetch'));

      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(pick).toHaveFocus();

      // Closing the selector hands the focus to Try Again
      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
      expect(screen.getByRole('button', { name: 'Try Again' })).toHaveFocus();
    });

    it('opens the selector over nothing on Choose Another Application', async () => {
      const onAppChange = vi.fn();
      const onSelectorVisibilityChange = vi.fn();
      render(
        <DosPlayerWithApps
          requestedApp={mockAppWithError}
          onAppChange={onAppChange}
          onSelectorVisibilityChange={onSelectorVisibilityChange}
        />
      );
      await screen.findByRole('alert');

      fireEvent.click(screen.getByRole('button', { name: 'Choose Another Application' }));

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      expect(screen.getByTestId('demo-selector-mock')).toBeInTheDocument();
      expect(boots).toEqual([]);
      expect(mockAppWithError.loader).toHaveBeenCalledOnce();
      expect(onAppChange).toHaveBeenCalledExactlyOnceWith(null);
      expect(onSelectorVisibilityChange).toHaveBeenCalledExactlyOnceWith(true);
    });

    it("boots the default DOS config on Choose Another Application, not the last app's", async () => {
      const { rerender } = render(<DosPlayerWithApps showSelector={true} />);

      // Run an app with its own DOSBox config
      fireEvent.click(screen.getByRole('button', { name: 'Select App' }));
      expect(screen.getByTestId('dos-player-mock')).toHaveAttribute(
        'data-dosbox-conf',
        '[cpu]\ncore=auto'
      );

      // A later load fails and the user picks another application
      rerender(<DosPlayerWithApps showSelector={true} requestedApp={mockAppWithError} />);
      fireEvent.click(await screen.findByRole('button', { name: 'Choose Another Application' }));
      // Nothing runs under the selector until it closes
      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(screen.getByTestId('dos-player-mock')).toHaveAttribute('data-dosbox-conf', 'default');
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

    // Every app in apps.config.ts has an empty dosboxConf and loads its config, autoexec and
    // all, on demand
    it('boots a requested app with the DOSBox config it loads', async () => {
      const stars = deferredApp('stars');
      const app: DosApp = {
        ...stars.app,
        dosboxConf: '',
        loadDosboxConf: vi.fn(async () => '[autoexec]\nSTARS.EXE'),
      };
      render(<DosPlayerWithApps requestedApp={app} />);

      await stars.finish();

      // With the line it prints once its program returns to DOS
      expect(boots).toEqual(['[autoexec]\nSTARS.EXE\necho.\necho stars has ended.\n']);
      expect(screen.getByTestId('dos-player-mock')).toHaveAttribute(
        'data-dosbox-conf',
        '[autoexec]\nSTARS.EXE\necho.\necho stars has ended.\n'
      );
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

    it('stops the running app as soon as another app is requested', async () => {
      const stars = deferredApp('stars');
      const rotate = deferredApp('3drotate');
      const { rerender } = render(<DosPlayerWithApps requestedApp={stars.app} />);
      await stars.finish();

      // Going back or forward to another app's URL
      rerender(<DosPlayerWithApps requestedApp={rotate.app} />);

      // Nothing runs, or plays sound, while the next app downloads
      expect(stops).toEqual(['conf:stars']);
      expect(screen.queryByTestId('dos-player-mock')).not.toBeInTheDocument();
      expect(screen.getByText('Loading application...')).toBeInTheDocument();

      await rotate.finish();

      expect(boots).toEqual(['conf:stars', 'conf:3drotate']);
      expect(screen.queryByText('Loading application...')).not.toBeInTheDocument();
    });

    it('stops the default prompt as soon as an app is requested', () => {
      const stars = deferredApp('stars');
      const { rerender } = render(<DosPlayerWithApps requestedApp={null} />);

      rerender(<DosPlayerWithApps requestedApp={stars.app} />);

      expect(stops).toEqual(['default']);
      expect(screen.queryByTestId('dos-player-mock')).not.toBeInTheDocument();
    });

    it('runs nothing behind the error of a newly requested app that fails to load', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      const stars = deferredApp('stars');
      const broken = deferredApp('broken');
      const { rerender } = render(<DosPlayerWithApps requestedApp={stars.app} />);
      await stars.finish();

      rerender(<DosPlayerWithApps requestedApp={broken.app} />);
      await broken.fail(new TypeError('Failed to fetch'));

      expect(screen.getByRole('alert')).toHaveTextContent('Error Loading Application');
      expect(screen.queryByTestId('dos-player-mock')).not.toBeInTheDocument();
      expect(boots).toEqual(['conf:stars']);
      expect(stops).toEqual(['conf:stars']);
    });

    it('does not reload an app picked in the selector when it is requested next', () => {
      // App mirrors the pick into requestedApp once the selector reports it
      const { rerender } = render(<DosPlayerWithApps showSelector={true} requestedApp={null} />);
      fireEvent.click(screen.getByRole('button', { name: 'Select App' }));

      rerender(<DosPlayerWithApps showSelector={true} requestedApp={mockApp} />);

      expect(screen.queryByText('Loading application...')).not.toBeInTheDocument();
      expect(mockApp.loader).not.toHaveBeenCalled();
      expect(boots).toEqual(['[cpu]\ncore=auto']);
      // The picked app goes on running
      expect(stops).toEqual([]);
    });

    // Such as a demo that has ended at the DOS prompt, or a program the user quit
    it('starts the running app again when it is picked in the selector again', () => {
      const { rerender } = render(<DosPlayerWithApps showSelector={true} requestedApp={null} />);
      fireEvent.click(screen.getByRole('button', { name: 'Select App' }));
      // App mirrors the pick into requestedApp, and opens the selector on Change Application
      rerender(<DosPlayerWithApps showSelector={false} requestedApp={mockApp} />);
      rerender(<DosPlayerWithApps showSelector={true} requestedApp={mockApp} />);

      fireEvent.click(screen.getByRole('button', { name: 'Select App' }));

      expect(boots).toEqual(['[cpu]\ncore=auto', '[cpu]\ncore=auto']);
      expect(stops).toEqual(['[cpu]\ncore=auto']);
    });

    it('keeps the selector Choose Another Application opened when no app is requested next', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      const onAppChange = vi.fn();
      const { rerender } = render(
        <DosPlayerWithApps requestedApp={mockAppWithError} onAppChange={onAppChange} />
      );
      fireEvent.click(await screen.findByRole('button', { name: 'Choose Another Application' }));

      // App takes the app out of the URL once it is told
      expect(onAppChange).toHaveBeenCalledExactlyOnceWith(null);
      rerender(<DosPlayerWithApps requestedApp={null} onAppChange={onAppChange} />);

      expect(screen.getByTestId('demo-selector-mock')).toBeInTheDocument();
      expect(boots).toEqual([]);
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

  // A download that stalls would keep it up for good
  describe('Loading overlay', () => {
    it('tells screen readers that the app is loading', () => {
      render(<DosPlayerWithApps requestedApp={deferredApp('stars').app} />);

      // Only the message: the Cancel button is no part of what is announced
      expect(screen.getByRole('status')).toHaveTextContent(/^Loading application\.\.\.$/);
    });

    it('stops the load on Cancel and opens the selector over nothing', async () => {
      const stars = deferredApp('stars');
      const onAppChange = vi.fn();
      const onSelectorVisibilityChange = vi.fn();
      render(
        <DosPlayerWithApps
          requestedApp={stars.app}
          onAppChange={onAppChange}
          onSelectorVisibilityChange={onSelectorVisibilityChange}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(stars.signal()?.aborted).toBe(true);
      expect(screen.queryByText('Loading application...')).not.toBeInTheDocument();
      expect(screen.getByTestId('demo-selector-mock')).toBeInTheDocument();
      expect(boots).toEqual([]);
      expect(onAppChange).toHaveBeenCalledExactlyOnceWith(null);
      expect(onSelectorVisibilityChange).toHaveBeenCalledExactlyOnceWith(true);

      // A download that finishes all the same is dropped
      await stars.finish();

      expect(boots).toEqual([]);
      expect(onAppChange).toHaveBeenCalledOnce();
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
      // The request for stars stopped the default prompt, which starts again
      expect(boots).toEqual(['default', 'default']);
    });

    it('loads the stopped app again when the request returns to it during another load', async () => {
      const stars = deferredApp('stars');
      const rotate = deferredApp('3drotate');
      const { rerender } = render(<DosPlayerWithApps requestedApp={rotate.app} />);
      await rotate.finish();
      rerender(<DosPlayerWithApps requestedApp={stars.app} />);

      rerender(<DosPlayerWithApps requestedApp={rotate.app} />);

      expect(stars.signal()?.aborted).toBe(true);
      expect(rotate.loader).toHaveBeenCalledTimes(2);
      expect(screen.getByText('Loading application...')).toBeInTheDocument();
      await stars.finish();
      await rotate.finish();
      expect(boots).toEqual(['conf:3drotate', 'conf:3drotate']);
    });

    it('lets an app picked in the selector win over a load that stopped the running app', async () => {
      const stars = deferredApp('stars');
      const rotate = deferredApp('3drotate');
      const onAppChange = vi.fn();
      const { rerender } = render(
        <DosPlayerWithApps requestedApp={rotate.app} onAppChange={onAppChange} />
      );
      await rotate.finish();
      rerender(<DosPlayerWithApps requestedApp={stars.app} onAppChange={onAppChange} />);
      // The user opens the selector during the download and picks another app
      rerender(
        <DosPlayerWithApps requestedApp={stars.app} showSelector={true} onAppChange={onAppChange} />
      );
      fireEvent.click(screen.getByRole('button', { name: 'Select App' }));

      expect(stars.signal()?.aborted).toBe(true);
      expect(screen.queryByText('Loading application...')).not.toBeInTheDocument();
      await stars.finish();
      expect(boots).toEqual(['conf:3drotate', '[cpu]\ncore=auto']);
      expect(onAppChange).toHaveBeenLastCalledWith(mockApp);
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

      // Nothing runs under the start page's selector
      expect(boots).toEqual(['conf:stars']);
      expect(screen.queryByTestId('dos-player-mock')).not.toBeInTheDocument();
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
