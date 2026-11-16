/**
 * Tests for DosPlayerWithApps component
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, type ComponentProps } from 'react';
import { DosPlayerWithApps } from './DosPlayerWithApps';
import type { DosApp } from '../types/dos-app';
import type { DosOptions } from '../types/js-dos';
import type { LoadProgress } from '../utils/diskLoader';
import { getSavedFiles, putSavedFiles, removeSavedFiles } from '../utils/savedFiles';
import { zipEntryNames } from '../utils/dosNames';

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

/** The files mockApp's download gives */
const mockFiles = new Uint8Array([1, 2, 3]);

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

/** The files each emulator start got, in order, and its other js-dos options */
const startFs = vi.hoisted(() => [] as unknown[]);
const startOptions = vi.hoisted(() => [] as unknown[]);

/** What the fake ci.persist() answers: the bundle of files a program saved, or never */
const persisted = vi.hoisted(() => ({ next: null as Uint8Array | null, calls: 0, hang: false }));

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
vi.mock('../utils/savedFiles', () => ({
  getSavedFiles: vi.fn(async () => null),
  putSavedFiles: vi.fn(async () => {}),
  removeSavedFiles: vi.fn(async () => {}),
}));

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
      const [initFs] = useState(options?.initFs);
      const [startedWith] = useState(options);
      useEffect(() => {
        boots.push(boot);
        startFs.push(initFs);
        startOptions.push(startedWith);
        return () => {
          stops.push(boot);
        };
      }, [boot, initFs, startedWith]);
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
            events: () => ({ onFrame: () => {}, onSoundPush: () => {} }),
            width: () => 640,
            height: () => 400,
            sendKeyEvent: (code: number, pressed: boolean) =>
              entry.keys.push(`${code} ${pressed ? 'down' : 'up'}`),
            persist: async () => {
              persisted.calls += 1;
              if (persisted.hang) return new Promise(() => {});
              return persisted.next;
            },
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
          frames: { latest: () => null, subscribe: () => () => {} },
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

// The production page's screenshot takes its alt text from the page file, which the tests
// leave out: it would arrive after the test, outside act()
vi.mock('../config/appPages', () => ({
  loadAppPage: () => new Promise(() => {}),
}));

/** What App passes to the player for the start page, another production and About */
const onBrowse = vi.fn();
const onOpenApp = vi.fn();
const onAbout = vi.fn();

/** The kinds the player asked the start page to show, undefined for none */
const browsedKinds = () => onBrowse.mock.calls.map(([kind]) => kind as unknown);

/** The player as App renders it: the DOS prompt, unless a test asks for a production */
function Player(props: Partial<ComponentProps<typeof DosPlayerWithApps>>) {
  return (
    <DosPlayerWithApps
      requestedApp={null}
      onBrowse={onBrowse}
      onOpenApp={onOpenApp}
      onAbout={onAbout}
      isOnline
      apps={[]}
      {...props}
    />
  );
}

/** The production page's button: Play, or Start for a tracker, or Read for a diskmag */
const playButton = () => screen.getByRole('button', { name: /^(Play|Start|Read)$/ });

/** A production's page, a region named by its heading */
const productionPage = (name: string) => screen.getByRole('region', { name });

/** The bar over a running production or the DOS prompt, if it shows */
const queryRunBar = () => document.querySelector<HTMLElement>('.run-bar');
function runBar(): HTMLElement {
  const bar = queryRunBar();
  if (!bar) throw new Error('No run bar in the page');
  return bar;
}

/** Open a production, as a link to it or Back and Forward do, and wait for its Play button */
async function openApp(app: DosApp, props: Partial<ComponentProps<typeof DosPlayerWithApps>> = {}) {
  const view = render(<Player requestedApp={app} {...props} />);
  await screen.findByRole('button', { name: /^(Play|Start|Read)$/ });
  return view;
}

/** Open a production, press Play, and have its emulator report ready */
async function runApp(app: DosApp) {
  const view = await openApp(app);
  fireEvent.click(playButton());
  fireEvent.click(screen.getByRole('button', { name: 'Trigger Ready' }));
  return view;
}

/**
 * As runApp, under fake timers, which findBy* queries would wait on for good: the download's
 * promise, then a tracker's saved files, settle as the timers advance
 */
async function runAppWithFakeTimers(app: DosApp) {
  const view = render(<Player requestedApp={app} />);
  await act(() => vi.advanceTimersByTimeAsync(0));
  await act(() => vi.advanceTimersByTimeAsync(0));
  fireEvent.click(playButton());
  fireEvent.click(screen.getByRole('button', { name: 'Trigger Ready' }));
  return view;
}

/** Whether the page has a click or key press of the last few seconds to start sound with */
const setActivation = (isActive: boolean) =>
  Object.defineProperty(navigator, 'userActivation', {
    configurable: true,
    value: { isActive, hasBeenActive: isActive },
  });

/** An app whose download finishes, fails or reports progress when the test says so */
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
    /** Report the latest download's progress, as loadZipArchive does */
    report: (progress: LoadProgress) => act(() => loader.mock.lastCall?.[0]?.(progress)),
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
    stops.length = 0;
    handles.length = 0;
    startFs.length = 0;
    startOptions.length = 0;
    persisted.next = null;
    persisted.calls = 0;
    persisted.hang = false;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    // As src/test/setup.ts leaves it: a click in the page of the last few seconds
    setActivation(true);
  });

  describe('Rendering', () => {
    it('boots the DOS prompt when no production is asked for', () => {
      render(<Player />);

      expect(screen.getByTestId('dos-player-mock')).toHaveAttribute('data-dosbox-conf', 'default');
      expect(boots).toEqual(['default']);
      expect(screen.queryByRole('button', { name: 'Play' })).not.toBeInTheDocument();
    });

    it('runs nothing while a production it is asked for downloads', () => {
      render(<Player requestedApp={deferredApp('stars').app} />);

      expect(screen.queryByTestId('dos-player-mock')).not.toBeInTheDocument();
      expect(boots).toEqual([]);
    });

    it('names the DOS prompt in its bar, with Browse and neither About nor Files', () => {
      render(<Player />);
      fireEvent.click(screen.getByRole('button', { name: 'Trigger Ready' }));

      const bar = runBar();
      expect(bar).toHaveTextContent('DOS prompt');
      expect(within(bar).queryByRole('button', { name: 'About' })).not.toBeInTheDocument();
      expect(within(bar).queryByRole('button', { name: 'Files' })).not.toBeInTheDocument();
      fireEvent.click(within(bar).getByRole('button', { name: 'Browse' }));
      expect(browsedKinds()).toEqual([undefined]);
    });
  });

  // App passes the production its URL names, or null for the DOS prompt at /dos
  describe('Prop synchronization', () => {
    it('loads the production a new requestedApp names', async () => {
      const stars = deferredApp('stars');
      const { rerender } = render(<Player />);

      rerender(<Player requestedApp={stars.app} />);
      await stars.finish();

      expect(stars.loader).toHaveBeenCalledOnce();
      expect(playButton()).toBeInTheDocument();
    });

    it('boots the DOS prompt once requestedApp goes back to null', async () => {
      const stars = deferredApp('stars');
      const { rerender } = render(<Player requestedApp={stars.app} />);
      await stars.finish();

      rerender(<Player requestedApp={null} />);

      expect(boots).toEqual(['default']);
      expect(screen.queryByRole('button', { name: 'Play' })).not.toBeInTheDocument();
    });

    // By its id: a production is the same whichever object names it
    it('loads nothing again for a new copy of the production on its Play screen', async () => {
      const stars = deferredApp('stars');
      const { rerender } = render(<Player requestedApp={stars.app} />);
      await stars.finish();

      rerender(<Player requestedApp={{ ...stars.app }} />);

      expect(stars.loader).toHaveBeenCalledOnce();
      expect(playButton()).toBeInTheDocument();
    });
  });

  describe('Callbacks', () => {
    it('should call onReady callback when DosPlayer is ready', () => {
      const onReady = vi.fn();
      render(<Player onReady={onReady} />);

      // fireEvent clicks inside act(), as the status a ready player sets is React state
      fireEvent.click(screen.getByText('Trigger Ready'));

      expect(onReady).toHaveBeenCalled();
    });

    it('should call onExit callback when DosPlayer exits', () => {
      const onExit = vi.fn();
      render(<Player onExit={onExit} />);

      fireEvent.click(screen.getByText('Trigger Exit'));

      expect(onExit).toHaveBeenCalled();
    });

    it("asks for the start page from the production's page: Cancel and Escape with no kind, the breadcrumb with its kind", async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      const stars = deferredApp('stars');
      render(<Player requestedApp={stars.app} />);

      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
      expect(browsedKinds()).toEqual([undefined]);

      await stars.fail(new TypeError('Failed to fetch'));
      fireEvent.keyDown(screen.getByRole('button', { name: 'Try Again' }), { key: 'Escape' });
      fireEvent.click(
        within(screen.getByRole('navigation', { name: 'Breadcrumb' })).getByRole('button', {
          name: 'Demos',
        })
      );

      expect(browsedKinds()).toEqual([undefined, undefined, 'demo']);
    });

    it('opens About from the page and from the bar, whose button takes the ref', async () => {
      const aboutButtonRef = createRef<HTMLButtonElement>();
      await openApp(mockApp, { aboutButtonRef });
      const onPage = within(productionPage('Test App')).getByRole('button', { name: 'About' });
      expect(aboutButtonRef.current).toBe(onPage);
      fireEvent.click(onPage);

      fireEvent.click(playButton());
      const inBar = within(runBar()).getByRole('button', { name: 'About' });
      expect(aboutButtonRef.current).toBe(inBar);
      fireEvent.click(inBar);

      expect(onAbout).toHaveBeenCalledTimes(2);
    });
  });

  // What the page's footer shows
  describe('Status', () => {
    it('reports loading until js-dos reports the emulator ready', () => {
      const onStatusChange = vi.fn();
      render(<Player onStatusChange={onStatusChange} />);

      expect(onStatusChange.mock.calls).toEqual([['loading']]);

      fireEvent.click(screen.getByRole('button', { name: 'Trigger Ready' }));

      expect(onStatusChange.mock.calls).toEqual([['loading'], ['ready']]);
    });

    // A DOS prompt whose emulator failed, such as when emulators.js failed to download, which
    // the next start loads again: the prompt that comes back starts afresh
    it('reports loading for a new DOS prompt after an earlier one failed to start', () => {
      const onStatusChange = vi.fn();
      const { rerender } = render(<Player onStatusChange={onStatusChange} />);
      fireEvent.click(screen.getByRole('button', { name: 'Trigger Error' }));
      expect(onStatusChange).toHaveBeenLastCalledWith('error');

      // A production is asked for, then the DOS prompt again before it has loaded
      rerender(<Player requestedApp={deferredApp('stars').app} onStatusChange={onStatusChange} />);
      rerender(<Player requestedApp={null} onStatusChange={onStatusChange} />);

      expect(onStatusChange).toHaveBeenLastCalledWith('loading');
    });

    it('reports loading while it downloads, idle on its Play screen, then loading until ready', async () => {
      const stars = deferredApp('stars');
      const onStatusChange = vi.fn();
      render(<Player requestedApp={stars.app} onStatusChange={onStatusChange} />);

      await stars.finish();
      expect(onStatusChange.mock.calls).toEqual([['loading'], ['idle']]);

      fireEvent.click(playButton());
      expect(onStatusChange).toHaveBeenLastCalledWith('loading');
      fireEvent.click(screen.getByRole('button', { name: 'Trigger Ready' }));
      expect(onStatusChange).toHaveBeenLastCalledWith('ready');
    });

    it('reports an error while the load error shows, and loading again on Try Again', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      const stars = deferredApp('stars');
      const onStatusChange = vi.fn();
      render(<Player requestedApp={stars.app} onStatusChange={onStatusChange} />);

      await stars.fail(new TypeError('Failed to fetch'));

      expect(onStatusChange.mock.calls).toEqual([['loading'], ['error']]);

      fireEvent.click(screen.getByRole('button', { name: 'Try Again' }));

      expect(onStatusChange.mock.calls).toEqual([['loading'], ['error'], ['loading']]);
    });

    it('reports an error when the emulator cannot start', () => {
      const onStatusChange = vi.fn();
      render(<Player onStatusChange={onStatusChange} />);

      fireEvent.click(screen.getByRole('button', { name: 'Trigger Error' }));

      expect(onStatusChange.mock.calls).toEqual([['loading'], ['error']]);
    });

    it('reports loading for the next production until its emulator is ready', async () => {
      const stars = deferredApp('stars');
      const onStatusChange = vi.fn();
      const { rerender } = render(<Player onStatusChange={onStatusChange} />);
      fireEvent.click(screen.getByRole('button', { name: 'Trigger Ready' }));

      rerender(<Player requestedApp={stars.app} onStatusChange={onStatusChange} />);
      await stars.finish();
      fireEvent.click(playButton());

      expect(onStatusChange.mock.calls).toEqual([
        ['loading'],
        ['ready'],
        ['loading'],
        ['idle'],
        ['loading'],
      ]);
      fireEvent.click(screen.getByRole('button', { name: 'Trigger Ready' }));
      expect(onStatusChange).toHaveBeenLastCalledWith('ready');
    });

    // Nothing runs then until the next start, as the footer said before
    it('reports loading once DOS has exited', () => {
      const onStatusChange = vi.fn();
      render(<Player onStatusChange={onStatusChange} />);
      fireEvent.click(screen.getByRole('button', { name: 'Trigger Ready' }));

      fireEvent.click(screen.getByRole('button', { name: 'Trigger Exit' }));

      expect(onStatusChange.mock.calls).toEqual([['loading'], ['ready'], ['loading']]);
    });

    it('still passes the ready emulator and its exit on', () => {
      const onReady = vi.fn();
      const onExit = vi.fn();
      render(<Player onReady={onReady} onExit={onExit} onStatusChange={() => {}} />);

      fireEvent.click(screen.getByRole('button', { name: 'Trigger Ready' }));
      fireEvent.click(screen.getByRole('button', { name: 'Trigger Exit' }));

      expect(onReady).toHaveBeenCalledOnce();
      expect(onExit).toHaveBeenCalledOnce();
    });
  });

  describe("The production's page", () => {
    it('the production page carries the download, the error and Play', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      const stars = deferredApp('stars');
      render(<Player requestedApp={stars.app} />);

      // The download, in the page, with nothing running and no bar
      const page = productionPage('stars');
      expect(within(page).getByRole('progressbar', { name: 'Download progress' })).toBeVisible();
      expect(within(page).getByText('Downloading stars…')).toHaveAttribute('role', 'status');
      expect(queryRunBar()).not.toBeInTheDocument();
      expect(screen.queryByTestId('dos-player-mock')).not.toBeInTheDocument();

      // Its error, in the same page, with Try Again focused
      await stars.fail(new TypeError('Failed to fetch'));
      expect(productionPage('stars')).toBe(page);
      expect(within(page).getByRole('alert')).toHaveTextContent('Unable to connect to the server');
      expect(within(page).getByRole('button', { name: 'Try Again' })).toHaveFocus();

      // A click on Try Again that is no longer fresh by the time the files are in waits for Play
      setActivation(false);
      fireEvent.click(within(page).getByRole('button', { name: 'Try Again' }));
      expect(within(page).queryByRole('alert')).not.toBeInTheDocument();
      expect(within(page).getByText('Starting download…')).toBeInTheDocument();
      await stars.finish();

      expect(within(page).getByRole('button', { name: 'Play' })).toHaveFocus();
      expect(within(page).queryByRole('progressbar')).not.toBeInTheDocument();
      expect(boots).toEqual([]);
    });

    it('the run bar replaces the page once Play is pressed, with Files for a tracker that saves', async () => {
      const tracker: DosApp = {
        ...mockApp,
        id: 'tracker',
        name: 'Tracker',
        kind: 'tracker',
        saveFiles: true,
      };
      await openApp(tracker);
      expect(queryRunBar()).not.toBeInTheDocument();

      fireEvent.click(playButton());

      expect(screen.queryByRole('region', { name: 'Tracker' })).not.toBeInTheDocument();
      const bar = runBar();
      expect(bar).toHaveTextContent('Tracker');
      expect(bar).toHaveTextContent('Test Author · 2024');
      expect(within(bar).getByRole('status')).toHaveTextContent('Loading · Online');
      expect(within(bar).getByRole('button', { name: 'Browse' })).toBeInTheDocument();
      expect(within(bar).getByRole('button', { name: 'About' })).toBeInTheDocument();
      // Files once the tracker is ready, and its status heard but no longer shown
      expect(within(bar).queryByRole('button', { name: 'Files' })).not.toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: 'Trigger Ready' }));
      expect(within(bar).getByRole('button', { name: 'Files' })).toBeInTheDocument();
      expect(within(bar).getByRole('status')).toHaveTextContent('Ready · Online');
      expect(within(bar).getByRole('status')).toHaveClass('visually-hidden');
    });

    it('says Offline in the bar while the browser is offline', async () => {
      const { rerender } = await runApp(mockApp);

      rerender(<Player requestedApp={mockApp} isOnline={false} />);

      expect(within(runBar()).getByRole('status')).toHaveTextContent('Ready · Offline');
      expect(within(runBar()).getByRole('status')).not.toHaveClass('visually-hidden');
    });

    it('offers no Files to a production that keeps none', async () => {
      await runApp(mockApp);

      expect(within(runBar()).queryByRole('button', { name: 'Files' })).not.toBeInTheDocument();
    });

    it('More by opens another production through onOpenApp', async () => {
      const other: DosApp = { ...mockApp, id: 'other', name: 'Other App' };
      await openApp(mockApp, { apps: [mockApp, other] });

      const more = screen.getByRole('list', { name: 'More by Test Author' });
      fireEvent.click(within(more).getByRole('link', { name: /^Other App/ }));

      expect(onOpenApp).toHaveBeenCalledExactlyOnceWith(other);
    });

    it('waits for Play before it starts a production opened with no fresh click', async () => {
      setActivation(false);
      const stars = deferredApp('stars');
      const onStatusChange = vi.fn();
      render(<Player requestedApp={stars.app} onStatusChange={onStatusChange} />);
      await stars.finish();

      // Nothing runs behind it: sound started by the click that starts the emulator plays
      expect(boots).toEqual([]);
      expect(onStatusChange).toHaveBeenLastCalledWith('idle');
      fireEvent.click(screen.getByRole('button', { name: 'Play' }));

      expect(boots).toEqual(['conf:stars']);
      expect(screen.queryByRole('button', { name: 'Play' })).not.toBeInTheDocument();
    });

    // A click on the start page's grid, or anywhere else, while it loads is no press of Play
    it('waits for Play even when the page has fresh user activation', async () => {
      setActivation(true);
      await openApp(mockApp);

      // The mock DosPlayer's test id: no emulator has started
      expect(screen.queryByTestId('dos-player-mock')).not.toBeInTheDocument();
      expect(boots).toEqual([]);
    });

    it('warns of flashing lights, and says what its start will do', async () => {
      const panic = deferredApp('panic');
      Object.assign(panic.app, {
        flashing: true,
        startNote: 'DosKit picks Execute the demo in its menu.',
      });
      render(<Player requestedApp={panic.app} />);
      await panic.finish();

      const page = productionPage('panic');
      expect(within(page).getByText(/contains flashing lights/i)).toBeInTheDocument();
      expect(
        within(page).getByText('DosKit picks Execute the demo in its menu.')
      ).toBeInTheDocument();
      expect(within(page).getByRole('button', { name: 'Play' })).toHaveFocus();
    });

    it('says what else a production shows before it plays', async () => {
      const timeless = deferredApp('timeless');
      Object.assign(timeless.app, { contentNote: 'Contains nudity: its end picture.' });
      render(<Player requestedApp={timeless.app} />);
      await timeless.finish();

      const page = productionPage('timeless');
      expect(within(page).getByText('Contains nudity: its end picture.')).toBeInTheDocument();
      expect(within(page).getByRole('button', { name: 'Play' })).toHaveFocus();
    });

    it("names a diskmag's button Read", async () => {
      const diskmag = deferredApp('diskmag');
      Object.assign(diskmag.app, { kind: 'diskmag' });
      render(<Player requestedApp={diskmag.app} />);
      await diskmag.finish();

      expect(screen.getByRole('button', { name: 'Read' })).toHaveClass('doskit-play-button');
    });

    it("names a tracker's button Start", async () => {
      const tracker = deferredApp('tracker');
      Object.assign(tracker.app, { kind: 'tracker' });
      render(<Player requestedApp={tracker.app} />);
      await tracker.finish();

      expect(screen.getByRole('button', { name: 'Start' })).toHaveClass('doskit-play-button');
    });

    // Try Again is a click on the same page: it starts the production, as Play would
    it('starts at once on Try Again while its click is fresh, and waits for Play otherwise', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      /** Open a production whose first download fails, and press Try Again */
      const retry = async (fresh: boolean) => {
        const app: DosApp = {
          ...mockApp,
          id: 'flaky',
          loader: vi
            .fn()
            .mockRejectedValueOnce(new TypeError('Failed to fetch'))
            .mockResolvedValue(mockFiles),
        };
        const view = render(<Player requestedApp={app} />);
        await screen.findByRole('alert');
        setActivation(fresh);
        fireEvent.click(screen.getByRole('button', { name: 'Try Again' }));
        return view;
      };

      const { unmount } = await retry(true);
      expect(await screen.findByTestId('dos-player-mock')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Play' })).not.toBeInTheDocument();
      expect(boots).toEqual(['[cpu]\ncore=auto']);
      unmount();

      // Its click is no longer fresh once the download has taken a few seconds
      await retry(false);
      expect(await screen.findByRole('button', { name: 'Play' })).toBeInTheDocument();
      expect(boots).toEqual(['[cpu]\ncore=auto']);
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

    it('sends its keys once its setup screen is up', async () => {
      await runApp(appWithStart);
      expect(handles[0]?.keys).toEqual([]);

      act(() => handles[0]?.print('READY'));

      await waitFor(() => expect(handles[0]?.keys).toContain('257 down'));
    });

    it('shows the keys to press when its setup screen never comes', async () => {
      vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'performance'] });
      try {
        await runAppWithFakeTimers(appWithStart);

        await act(() => vi.advanceTimersByTimeAsync(46_000));

        expect(screen.getByText('Press Enter to start it.')).toBeInTheDocument();
        expect(handles[0]?.keys).toEqual([]);
      } finally {
        vi.useRealTimers();
      }
    });
  });

  describe("A tracker's saved files", () => {
    const tracker: DosApp = {
      ...mockApp,
      id: 'tracker',
      name: 'Tracker',
      kind: 'tracker',
      saveFiles: true,
    };

    it('come back after its archive when it starts', async () => {
      vi.mocked(getSavedFiles).mockResolvedValueOnce({
        bytes: new Uint8Array([9, 9]),
        savedAt: 1,
      });

      await runApp(tracker);

      expect(startFs[0]).toEqual([mockFiles, new Uint8Array([9, 9])]);
    });

    it('stay out where the browser cannot keep files, and the tracker still starts', async () => {
      vi.mocked(getSavedFiles).mockRejectedValueOnce(new Error('IndexedDB is not available'));

      await runApp(tracker);

      expect(startFs[0]).toEqual([mockFiles]);
    });

    it('are kept a few seconds after keys reach DOS', async () => {
      vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval'] });
      try {
        await runAppWithFakeTimers(tracker);
        persisted.next = new Uint8Array([1, 2, 3]);

        fireEvent.keyDown(document.body, { key: 'Enter' });
        await act(() => vi.advanceTimersByTimeAsync(2_900));
        expect(putSavedFiles).not.toHaveBeenCalled();
        await act(() => vi.advanceTimersByTimeAsync(200));

        expect(putSavedFiles).toHaveBeenCalledWith('tracker', new Uint8Array([1, 2, 3]));
      } finally {
        vi.useRealTimers();
      }
    });

    // A phone's on-screen keyboard sends its keys to DOS from taps, never as key events, and
    // js-dos stops the pointerup of a tap on its screen before it bubbles to the window
    it('are kept a few seconds after a tap, even one js-dos stops, as on a phone', async () => {
      vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval'] });
      const dosScreen = document.createElement('div');
      dosScreen.addEventListener('pointerup', (event) => event.stopPropagation());
      document.body.append(dosScreen);
      try {
        await runAppWithFakeTimers(tracker);
        persisted.next = new Uint8Array([1, 2, 3]);

        fireEvent.pointerUp(dosScreen);
        await act(() => vi.advanceTimersByTimeAsync(2_900));
        expect(putSavedFiles).not.toHaveBeenCalled();
        await act(() => vi.advanceTimersByTimeAsync(200));

        expect(putSavedFiles).toHaveBeenCalledWith('tracker', new Uint8Array([1, 2, 3]));
      } finally {
        dosScreen.remove();
        vi.useRealTimers();
      }
    });

    it('wait for no more keys or taps once the tracker has gone', async () => {
      vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval'] });
      try {
        const { unmount } = await runAppWithFakeTimers(tracker);
        persisted.next = new Uint8Array([1, 2, 3]);

        unmount();
        fireEvent.keyDown(document.body, { key: 'Enter' });
        fireEvent.pointerUp(document.body);
        await act(() => vi.advanceTimersByTimeAsync(3_100));

        expect(putSavedFiles).not.toHaveBeenCalled();
      } finally {
        vi.useRealTimers();
      }
    });

    it('are kept when the tab is hidden, and the same files only once', async () => {
      await runApp(tracker);
      persisted.next = new Uint8Array([4]);
      const hide = () => {
        Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' });
        document.dispatchEvent(new Event('visibilitychange'));
      };
      try {
        hide();
        await waitFor(() => expect(putSavedFiles).toHaveBeenCalledTimes(1));
        hide();
        await waitFor(() => expect(persisted.calls).toBe(2));

        expect(putSavedFiles).toHaveBeenCalledTimes(1);
      } finally {
        Object.defineProperty(document, 'visibilityState', {
          configurable: true,
          value: 'visible',
        });
      }
    });
  });

  describe("A tracker's Files panel", () => {
    const tracker: DosApp = {
      ...mockApp,
      id: 'tracker',
      name: 'Tracker',
      kind: 'tracker',
      saveFiles: true,
      jsdos: { renderAspect: 'AsIs' },
    };

    it("opens from the run bar's Files button, there only while a tracker runs", async () => {
      await openApp(tracker);
      expect(screen.queryByRole('button', { name: 'Files' })).not.toBeInTheDocument();
      fireEvent.click(playButton());
      fireEvent.click(screen.getByRole('button', { name: 'Trigger Ready' }));

      fireEvent.click(within(runBar()).getByRole('button', { name: 'Files' }));

      expect(screen.getByRole('dialog', { name: 'Your files' })).toBeInTheDocument();
    });

    it("gives the bar's Files button the focus back when the panel is closed from the keyboard", async () => {
      await runApp(tracker);
      const files = within(runBar()).getByRole('button', { name: 'Files' });
      fireEvent.click(files);

      fireEvent.keyDown(screen.getByRole('dialog', { name: 'Your files' }), { key: 'Escape' });

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(files).toHaveFocus();
    });

    it('downloads what the tracker saved, as the ZIP js-dos packed', async () => {
      const objectUrls: Blob[] = [];
      vi.spyOn(URL, 'createObjectURL').mockImplementation((blob) => {
        objectUrls.push(blob as Blob);
        return 'blob:files';
      });
      vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
      const clicked = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
      await runApp(tracker);
      persisted.next = new Uint8Array([80, 75, 5, 6]);

      fireEvent.click(screen.getByRole('button', { name: 'Files' }));
      fireEvent.click(screen.getByRole('button', { name: /download/i }));

      await waitFor(() => expect(clicked).toHaveBeenCalled());
      const downloaded = await new Promise<ArrayBuffer>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as ArrayBuffer);
        reader.readAsArrayBuffer(objectUrls[0]!);
      });
      expect(new Uint8Array(downloaded)).toEqual(new Uint8Array([80, 75, 5, 6]));
      expect((clicked.mock.contexts[0] as HTMLAnchorElement).download).toBe('tracker-files.zip');
    });

    it("restarts the tracker with modules of the visitor's own, under DOS names", async () => {
      await runApp(tracker);
      fireEvent.click(screen.getByRole('button', { name: 'Files' }));

      const song = new File([new Uint8Array([7, 7])], 'My Song.it');
      fireEvent.change(screen.getByLabelText(/bring in modules/i), { target: { files: [song] } });

      await waitFor(() => expect(boots).toHaveLength(2));
      // After the archive, as a bundle of their own
      const [archive, bundle] = startFs[1] as [Uint8Array, Uint8Array];
      expect(archive).toEqual(mockFiles);
      expect(zipEntryNames(bundle)).toEqual(['MYSONG.IT']);
    });

    it('keeps the modules brought in soon after the restart, without waiting for keys', async () => {
      await runApp(tracker);
      fireEvent.click(screen.getByRole('button', { name: 'Files' }));
      fireEvent.change(screen.getByLabelText(/bring in modules/i), {
        target: { files: [new File([new Uint8Array([7])], 'song.it')] },
      });
      await waitFor(() => expect(boots).toHaveLength(2));
      vi.mocked(putSavedFiles).mockClear();
      // What js-dos packs once the restarted tracker runs: the module, with what was saved
      persisted.next = new Uint8Array([8, 8]);

      fireEvent.click(screen.getByRole('button', { name: 'Trigger Ready' }));

      await waitFor(
        () => expect(putSavedFiles).toHaveBeenCalledWith('tracker', new Uint8Array([8, 8])),
        {
          timeout: 2_500,
        }
      );
    });

    it('deletes the kept files and restarts the tracker as it came, on Start over', async () => {
      vi.mocked(getSavedFiles).mockResolvedValueOnce({ bytes: new Uint8Array([9]), savedAt: 1 });
      await runApp(tracker);
      fireEvent.click(screen.getByRole('button', { name: 'Files' }));

      fireEvent.click(screen.getByRole('button', { name: 'Start over' }));
      fireEvent.click(screen.getByRole('button', { name: 'Delete them and restart' }));

      await waitFor(() => expect(boots).toHaveLength(2));
      expect(removeSavedFiles).toHaveBeenCalledWith('tracker');
      expect(startFs[1]).toEqual([mockFiles]);
    });

    it("starts with the js-dos options the app asks for, such as Impulse Tracker's aspect", async () => {
      await runApp(tracker);

      expect(startOptions[0]).toMatchObject({ renderAspect: 'AsIs' });
    });
  });

  // Browse, in the run bar or on the end card, is the way to the start page from a running
  // production
  describe('Leaving a running tracker', () => {
    const tracker: DosApp = {
      ...mockApp,
      id: 'tracker',
      name: 'Tracker',
      kind: 'tracker',
      saveFiles: true,
      dosboxConf: '[autoexec]\nTRACKER.EXE\n',
    };
    /** The tracker returns to DOS, and the visitor asks for the start page from its end card */
    const browse = () => {
      act(() => handles.at(-1)?.print('Tracker has ended.'));
      const card = screen.getByRole('dialog', { name: 'Tracker has ended.' });
      fireEvent.click(within(card).getByRole('button', { name: 'Browse' }));
    };

    it("asks before the run bar's Browse leaves a running tracker, and keeps its files first", async () => {
      await runApp(tracker);
      persisted.next = new Uint8Array([6]);

      fireEvent.click(within(runBar()).getByRole('button', { name: 'Browse' }));
      expect(onBrowse).not.toHaveBeenCalled();
      const ask = screen.getByRole('dialog', { name: 'Leave Tracker?' });
      expect(within(ask).getByRole('button', { name: 'Leave' })).toHaveFocus();
      fireEvent.click(within(ask).getByRole('button', { name: 'Leave' }));

      await waitFor(() => expect(browsedKinds()).toEqual([undefined]));
      expect(putSavedFiles).toHaveBeenCalledWith('tracker', new Uint8Array([6]));
      expect(vi.mocked(putSavedFiles).mock.invocationCallOrder[0]).toBeLessThan(
        onBrowse.mock.invocationCallOrder[0]!
      );
    });

    it("leaves from the run bar's Browse without asking while the tracker is still starting", async () => {
      await openApp(tracker);
      fireEvent.click(playButton());

      fireEvent.click(within(runBar()).getByRole('button', { name: 'Browse' }));

      expect(screen.queryByRole('dialog', { name: /^Leave/ })).not.toBeInTheDocument();
      expect(browsedKinds()).toEqual([undefined]);
    });

    it('asks before Browse leaves a running tracker, and keeps its files first', async () => {
      await runApp(tracker);

      browse();
      const ask = screen.getByRole('dialog', { name: 'Leave Tracker?' });
      // The end card gives way to the question
      expect(screen.queryByRole('dialog', { name: 'Tracker has ended.' })).not.toBeInTheDocument();
      expect(within(ask).getByRole('button', { name: 'Leave' })).toHaveFocus();
      fireEvent.click(within(ask).getByRole('button', { name: 'Stay' }));
      expect(onBrowse).not.toHaveBeenCalled();
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

      browse();
      persisted.next = new Uint8Array([5]);
      fireEvent.click(screen.getByRole('button', { name: 'Leave' }));

      await waitFor(() => expect(browsedKinds()).toEqual([undefined]));
      expect(putSavedFiles).toHaveBeenCalledWith('tracker', new Uint8Array([5]));
      expect(vi.mocked(putSavedFiles).mock.invocationCallOrder[0]).toBeLessThan(
        onBrowse.mock.invocationCallOrder[0]!
      );
    });

    it('leaves without asking from a production that keeps no files', async () => {
      await runApp({ ...tracker, saveFiles: undefined });

      browse();

      expect(screen.queryByRole('dialog', { name: /^Leave/ })).not.toBeInTheDocument();
      expect(browsedKinds()).toEqual([undefined]);
    });

    it('forgets the Leave question when Back or Forward ends the tracker it asked about', async () => {
      const stars = deferredApp('stars');
      const { rerender } = await runApp(tracker);
      browse();
      expect(screen.getByRole('dialog', { name: 'Leave Tracker?' })).toBeInTheDocument();

      rerender(<Player requestedApp={stars.app} />);
      await stars.finish();
      fireEvent.click(playButton());

      // Neither over the app Back or Forward brought, nor again later
      expect(screen.queryByRole('dialog', { name: /^Leave/ })).not.toBeInTheDocument();
    });

    it("says on Leave that this browser can't keep the tracker's files, when it can't", async () => {
      vi.mocked(getSavedFiles).mockRejectedValueOnce(new Error('IndexedDB is not available'));
      await runApp(tracker);

      browse();

      expect(screen.getByRole('dialog', { name: 'Leave Tracker?' })).toHaveTextContent(
        /can't keep files/i
      );
    });
  });

  describe('Fixes from review', () => {
    const tracker: DosApp = {
      ...mockApp,
      id: 'tracker',
      name: 'Tracker',
      kind: 'tracker',
      saveFiles: true,
      dosboxConf: '[autoexec]\nTRACKER.EXE\n',
    };

    it('plays a tracker again with what it saved since it started, and keeps that first', async () => {
      vi.mocked(getSavedFiles).mockResolvedValueOnce({ bytes: new Uint8Array([9, 9]), savedAt: 1 });
      await runApp(tracker);
      persisted.next = new Uint8Array([9, 9, 5]);
      act(() => handles[0]?.print('Tracker has ended.'));

      fireEvent.click(screen.getByRole('button', { name: 'Play again' }));

      await waitFor(() => expect(boots).toHaveLength(2));
      expect(startFs[1]).toEqual([mockFiles, new Uint8Array([9, 9, 5])]);
      expect(putSavedFiles).toHaveBeenCalledWith('tracker', new Uint8Array([9, 9, 5]));
    });

    it('starts with the saved files last, so they win over modules brought in earlier', async () => {
      await runApp(tracker);
      fireEvent.click(screen.getByRole('button', { name: 'Files' }));
      fireEvent.change(screen.getByLabelText(/bring in modules/i), {
        target: { files: [new File([new Uint8Array([1])], 'song.it')] },
      });
      await waitFor(() => expect(boots).toHaveLength(2));
      fireEvent.click(screen.getByRole('button', { name: 'Trigger Ready' }));
      // The tracker saved an edited SONG.IT, which js-dos packs with the saved files
      persisted.next = new Uint8Array([2, 2]);

      fireEvent.click(screen.getByRole('button', { name: 'Files' }));
      fireEvent.change(screen.getByLabelText(/bring in modules/i), {
        target: { files: [new File([new Uint8Array([3])], 'other.it')] },
      });

      await waitFor(() => expect(boots).toHaveLength(3));
      const [archive, imports, saved] = startFs[2] as Uint8Array[];
      expect(archive).toEqual(mockFiles);
      expect(zipEntryNames(imports!)).toEqual(['SONG.IT', 'OTHER.IT']);
      expect(saved).toEqual(new Uint8Array([2, 2]));
    });

    it('downloads what js-dos packed even when the browser cannot keep it', async () => {
      vi.mocked(putSavedFiles).mockRejectedValue(new Error('QuotaExceededError'));
      const objectUrls: Blob[] = [];
      vi.spyOn(URL, 'createObjectURL').mockImplementation((blob) => {
        objectUrls.push(blob as Blob);
        return 'blob:files';
      });
      vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
      vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
      try {
        await runApp(tracker);
        persisted.next = new Uint8Array([5, 5]);

        fireEvent.click(screen.getByRole('button', { name: 'Files' }));
        fireEvent.click(screen.getByRole('button', { name: /download/i }));

        await waitFor(() => expect(objectUrls).toHaveLength(1));
        expect(screen.queryByText(/nothing to download/i)).not.toBeInTheDocument();
      } finally {
        vi.mocked(putSavedFiles).mockResolvedValue(undefined);
      }
    });

    it('restarts with what js-dos packed on an import even when the browser cannot keep it', async () => {
      vi.mocked(putSavedFiles).mockRejectedValue(new Error('QuotaExceededError'));
      try {
        await runApp(tracker);
        persisted.next = new Uint8Array([5, 5]);
        fireEvent.click(screen.getByRole('button', { name: 'Files' }));

        fireEvent.change(screen.getByLabelText(/bring in modules/i), {
          target: { files: [new File([new Uint8Array([1])], 'song.it')] },
        });

        await waitFor(() => expect(boots).toHaveLength(2));
        expect((startFs[1] as Uint8Array[]).at(-1)).toEqual(new Uint8Array([5, 5]));
      } finally {
        vi.mocked(putSavedFiles).mockResolvedValue(undefined);
      }
    });
  });

  describe('Rulings on what the review set aside', () => {
    const tracker: DosApp = {
      ...mockApp,
      id: 'tracker',
      name: 'Tracker',
      kind: 'tracker',
      saveFiles: true,
    };

    /** A production whose first download fails, opened and then tried again with a fresh click */
    const retried = async (app: DosApp) => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      const flaky: DosApp = {
        ...app,
        loader: vi
          .fn()
          .mockRejectedValueOnce(new TypeError('Failed to fetch'))
          .mockResolvedValue(mockFiles),
      };
      render(<Player requestedApp={flaky} />);
      fireEvent.click(await screen.findByRole('button', { name: 'Try Again' }));
    };

    it('shows a flashing production its Play screen on Try Again, even with a fresh click', async () => {
      // Its warning would never show if Try Again started it
      await retried({ ...mockApp, flashing: true });

      expect(await screen.findByRole('button', { name: 'Play' })).toBeInTheDocument();
      expect(screen.getByText(/contains flashing lights/i)).toBeInTheDocument();
      expect(boots).toEqual([]);
    });

    it('shows a production with a content note its Play screen on Try Again, even with a fresh click', async () => {
      await retried({ ...mockApp, contentNote: 'Contains nudity: its end picture.' });

      expect(await screen.findByRole('button', { name: 'Play' })).toBeInTheDocument();
      expect(boots).toEqual([]);
    });

    it("doesn't say the browser can't keep files when js-dos is only slow to pack them", async () => {
      vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval'] });
      try {
        await runAppWithFakeTimers(tracker);
        persisted.hang = true;

        fireEvent.keyDown(document.body, { key: 'Enter' });
        // The save after the keys, and the 10 s js-dos gets to answer it
        await act(() => vi.advanceTimersByTimeAsync(14_000));
        persisted.hang = false;
        fireEvent.click(screen.getByRole('button', { name: 'Files' }));

        expect(screen.queryByText(/can't keep files/i)).not.toBeInTheDocument();
      } finally {
        persisted.hang = false;
        vi.useRealTimers();
      }
    });

    it('starts a tracker without its saved files when the browser does not answer for them', async () => {
      vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
      try {
        vi.mocked(getSavedFiles).mockReturnValueOnce(new Promise(() => {}));
        render(<Player requestedApp={tracker} />);
        // The download, then the wait for the saved files
        await act(() => vi.advanceTimersByTimeAsync(0));
        await act(() => vi.advanceTimersByTimeAsync(5_000));
        fireEvent.click(screen.getByRole('button', { name: 'Start' }));

        expect(startFs[0]).toEqual([mockFiles]);
      } finally {
        vi.useRealTimers();
      }
    });

    it("says which file it couldn't bring in", async () => {
      await runApp(tracker);
      fireEvent.click(screen.getByRole('button', { name: 'Files' }));
      vi.spyOn(FileReader.prototype, 'readAsArrayBuffer').mockImplementation(function (
        this: FileReader
      ) {
        setTimeout(() => this.onerror?.(new ProgressEvent('error') as ProgressEvent<FileReader>));
      });

      fireEvent.change(screen.getByLabelText(/bring in modules/i), {
        target: { files: [new File([new Uint8Array([1])], 'broken.it')] },
      });

      expect(await screen.findByText(/broken\.it could not be read/i)).toBeInTheDocument();
      expect(boots).toHaveLength(1);
    });
  });

  describe("A program's end", () => {
    const appWithAutoexec: DosApp = {
      ...mockApp,
      dosboxConf: '[cpu]\ncore=auto\n\n[autoexec]\nTEST.EXE\n',
    };

    const runToTheEnd = async () => {
      const view = await runApp(appWithAutoexec);
      act(() => handles[0]?.print('Test App has ended.'));
      return view;
    };

    it('offers to play it again, or to browse, once it returns to DOS', async () => {
      await runToTheEnd();

      const card = screen.getByRole('dialog', { name: 'Test App has ended.' });
      expect(within(card).getByRole('button', { name: 'Play again' })).toHaveFocus();
      expect(within(card).getByRole('button', { name: 'Browse' })).toBeInTheDocument();
      expect(within(card).getByRole('button', { name: 'Back to DOS' })).toBeInTheDocument();
    });

    it("leaves js-dos's fullscreen, where the card would be hidden", async () => {
      await runApp(appWithAutoexec);
      // js-dos's soft fullscreen: a class on the player's element
      screen.getByTestId('dos-player-mock').classList.add('jsdos-fullscreen-workaround');

      act(() => handles[0]?.print('Test App has ended.'));

      expect(handles[0]?.fullScreen).toEqual([false]);
    });

    it('leaves the fullscreen alone when the player is not in it', async () => {
      // js-dos would then call document.exitFullscreen(), which throws outside fullscreen
      await runToTheEnd();

      expect(handles[0]?.fullScreen).toEqual([]);
    });

    it('plays it again from the files it has, on Play again', async () => {
      await runToTheEnd();

      fireEvent.click(screen.getByRole('button', { name: 'Play again' }));

      const conf = `${appWithAutoexec.dosboxConf}echo.\necho Test App has ended.\n`;
      expect(boots).toEqual([conf, conf]);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('leaves the DOS prompt on Back to DOS', async () => {
      await runToTheEnd();

      fireEvent.click(screen.getByRole('button', { name: 'Back to DOS' }));

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(boots).toHaveLength(1);
    });

    it('goes to the start page on Browse', async () => {
      await runToTheEnd();

      const card = screen.getByRole('dialog', { name: 'Test App has ended.' });
      fireEvent.click(within(card).getByRole('button', { name: 'Browse' }));

      expect(browsedKinds()).toEqual([undefined]);
    });

    it('has the autoexec print a line once the program returns to DOS', async () => {
      await openApp(appWithAutoexec);

      fireEvent.click(playButton());

      expect(screen.getByTestId('dos-player-mock')).toHaveAttribute(
        'data-dosbox-conf',
        '[cpu]\ncore=auto\n\n[autoexec]\nTEST.EXE\necho.\necho Test App has ended.\n'
      );
    });
  });

  describe('CSS classes', () => {
    it('should apply custom className', () => {
      const { container } = render(<Player className="custom-class" />);
      const wrapper = container.querySelector('.dos-player-with-apps');
      expect(wrapper).toHaveClass('custom-class');
    });

    it('should have default class', () => {
      const { container } = render(<Player />);
      const wrapper = container.querySelector('.dos-player-with-apps');
      expect(wrapper).toBeInTheDocument();
    });
  });

  describe("A load error on the production's page", () => {
    beforeEach(() => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    it('explains a download that cannot reach the server', async () => {
      render(<Player requestedApp={mockAppWithError} />);

      const alert = await screen.findByRole('alert');
      expect(productionPage('Test App')).toContainElement(alert);
      // Explained, not the browser's own words
      expect(alert).toHaveTextContent('Unable to connect to the server');
      expect(alert).toHaveTextContent('Please check your internet connection and try again.');
      expect(screen.queryByText('Starting download…')).not.toBeInTheDocument();
    });

    it('keeps the technical message in a collapsed details line', async () => {
      render(<Player requestedApp={mockAppWithError} />);

      const alert = await screen.findByRole('alert');
      const technical = within(alert).getByText('Failed to fetch');
      expect(technical.closest('details')).not.toHaveAttribute('open');
      expect(technical).not.toBeVisible();
      expect(within(alert).getByText('Details')).toBeVisible();
    });

    it('says that the app needs a connection until it has been opened online', async () => {
      vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);

      render(<Player requestedApp={mockAppWithError} />);

      const alert = await screen.findByRole('alert');
      expect(productionPage('Test App')).toContainElement(alert);
      expect(alert).toHaveTextContent("This application isn't available offline yet");
      expect(alert).toHaveTextContent(
        'Each application works offline once it has been opened while online.'
      );
      expect(screen.getByRole('button', { name: 'Try Again' })).toBeInTheDocument();
    });

    it('explains an archive the server does not have', async () => {
      const missing: DosApp = {
        ...mockApp,
        id: 'missing-app',
        loader: vi.fn().mockRejectedValue(new Error('Failed to load ZIP: HTTP 404')),
      };

      render(<Player requestedApp={missing} />);

      expect(await screen.findByRole('alert')).toHaveTextContent(
        'The requested file was not found'
      );
    });

    it('should handle non-Error exceptions during loading', async () => {
      const appWithStringError: DosApp = {
        ...mockApp,
        loader: vi.fn().mockRejectedValue('String error'),
      };

      render(<Player requestedApp={appWithStringError} />);

      expect(await screen.findByRole('alert')).toHaveTextContent('An unexpected error occurred');
    });

    it('offers Try Again in the alert, and keeps the page itself', async () => {
      render(<Player requestedApp={mockAppWithError} />);

      const alert = await screen.findByRole('alert');
      expect(within(alert).getByRole('button', { name: 'Try Again' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 1, name: 'Test App' })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Play' })).not.toBeInTheDocument();
    });

    it('loads the app that failed again on Try Again', async () => {
      const stars = deferredApp('stars');
      render(<Player requestedApp={stars.app} />);
      await stars.fail(new Error('Failed to load ZIP: HTTP 503'));

      fireEvent.click(screen.getByRole('button', { name: 'Try Again' }));

      expect(stars.loader).toHaveBeenCalledTimes(2);
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      expect(screen.getByText('Starting download…')).toBeInTheDocument();

      await stars.finish();

      // Its click is still fresh: it starts as Play would
      expect(boots).toEqual(['conf:stars']);
      expect(onBrowse).not.toHaveBeenCalled();
    });

    it('shows the error again when Try Again fails too', async () => {
      const stars = deferredApp('stars');
      render(<Player requestedApp={stars.app} />);
      await stars.fail(new TypeError('Failed to fetch'));

      fireEvent.click(screen.getByRole('button', { name: 'Try Again' }));
      await stars.fail(new Error('Failed to load ZIP: HTTP 404'));

      expect(screen.getByRole('alert')).toHaveTextContent('The requested file was not found');
      expect(screen.getByRole('button', { name: 'Try Again' })).toHaveFocus();
      expect(boots).toEqual([]);
    });

    it('focuses Try Again when the error appears', async () => {
      render(<Player requestedApp={mockAppWithError} />);

      // The button can be in the page a moment before the effect that focuses it has run
      await waitFor(() => expect(screen.getByRole('button', { name: 'Try Again' })).toHaveFocus());
    });

    it('tries again from the keyboard', async () => {
      const user = userEvent.setup();
      const stars = deferredApp('stars');
      render(<Player requestedApp={stars.app} />);
      await stars.fail(new TypeError('Failed to fetch'));

      expect(screen.getByRole('button', { name: 'Try Again' })).toHaveFocus();
      await user.keyboard('{Enter}');

      expect(stars.loader).toHaveBeenCalledTimes(2);
    });

    it('goes to the start page on Escape, with nothing running', async () => {
      const user = userEvent.setup();
      render(<Player requestedApp={mockAppWithError} />);
      await waitFor(() => expect(screen.getByRole('button', { name: 'Try Again' })).toHaveFocus());

      await user.keyboard('{Escape}');

      expect(browsedKinds()).toEqual([undefined]);
      expect(boots).toEqual([]);
      expect(mockAppWithError.loader).toHaveBeenCalledOnce();
    });
  });

  describe('Requested apps', () => {
    it('runs a requested app without booting the default prompt first', async () => {
      const stars = deferredApp('stars');
      render(<Player requestedApp={stars.app} />);

      expect(screen.getByText('Starting download…')).toBeInTheDocument();
      expect(boots).toEqual([]);

      await stars.finish();
      fireEvent.click(playButton());

      expect(boots).toEqual(['conf:stars']);
      expect(screen.queryByText('Starting download…')).not.toBeInTheDocument();
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
      render(<Player requestedApp={app} />);

      await stars.finish();
      fireEvent.click(playButton());

      // With the line it prints once its program returns to DOS
      expect(boots).toEqual(['[autoexec]\nSTARS.EXE\necho.\necho stars has ended.\n']);
      expect(screen.getByTestId('dos-player-mock')).toHaveAttribute(
        'data-dosbox-conf',
        '[autoexec]\nSTARS.EXE\necho.\necho stars has ended.\n'
      );
    });

    it('switches to a newly requested app once it has loaded', async () => {
      const stars = deferredApp('stars');
      const { rerender } = render(<Player requestedApp={null} />);

      rerender(<Player requestedApp={stars.app} />);
      expect(screen.getByText('Starting download…')).toBeInTheDocument();
      await stars.finish();
      fireEvent.click(playButton());

      expect(boots).toEqual(['default', 'conf:stars']);
    });

    it('stops the running app as soon as another app is requested', async () => {
      const stars = deferredApp('stars');
      const rotate = deferredApp('3drotate');
      const { rerender } = render(<Player requestedApp={stars.app} />);
      await stars.finish();
      fireEvent.click(playButton());

      // Going back or forward to another app's URL
      rerender(<Player requestedApp={rotate.app} />);

      // Nothing runs, or plays sound, while the next app downloads
      expect(stops).toEqual(['conf:stars']);
      expect(screen.queryByTestId('dos-player-mock')).not.toBeInTheDocument();
      expect(screen.getByText('Starting download…')).toBeInTheDocument();

      await rotate.finish();
      fireEvent.click(playButton());

      expect(boots).toEqual(['conf:stars', 'conf:3drotate']);
      expect(screen.queryByText('Starting download…')).not.toBeInTheDocument();
    });

    it('stops the default prompt as soon as an app is requested', () => {
      const stars = deferredApp('stars');
      const { rerender } = render(<Player requestedApp={null} />);

      rerender(<Player requestedApp={stars.app} />);

      expect(stops).toEqual(['default']);
      expect(screen.queryByTestId('dos-player-mock')).not.toBeInTheDocument();
    });

    it('runs nothing behind the error of a newly requested app that fails to load', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      const stars = deferredApp('stars');
      const broken = deferredApp('broken');
      const { rerender } = render(<Player requestedApp={stars.app} />);
      await stars.finish();
      fireEvent.click(playButton());

      rerender(<Player requestedApp={broken.app} />);
      await broken.fail(new TypeError('Failed to fetch'));

      expect(within(productionPage('broken')).getByRole('alert')).toBeInTheDocument();
      expect(screen.queryByTestId('dos-player-mock')).not.toBeInTheDocument();
      expect(boots).toEqual(['conf:stars']);
      expect(stops).toEqual(['conf:stars']);
    });

    it('stops the running app and boots the default prompt when no app is requested', async () => {
      const stars = deferredApp('stars');
      const { rerender } = render(<Player requestedApp={stars.app} />);
      await stars.finish();
      fireEvent.click(playButton());

      rerender(<Player requestedApp={null} />);

      expect(boots).toEqual(['conf:stars', 'default']);
      expect(screen.getByTestId('dos-player-mock')).toHaveAttribute('data-dosbox-conf', 'default');
    });

    it('replaces a load error with the default prompt when no app is requested', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      const { rerender } = render(<Player requestedApp={mockAppWithError} />);
      expect(await screen.findByRole('alert')).toBeInTheDocument();

      rerender(<Player requestedApp={null} />);

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      expect(screen.queryByRole('region', { name: 'Test App' })).not.toBeInTheDocument();
      expect(boots).toEqual(['default']);
    });

    it('clears an earlier load error when another app is requested', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      const stars = deferredApp('stars');
      const { rerender } = render(<Player requestedApp={mockAppWithError} />);
      expect(await screen.findByRole('alert')).toBeInTheDocument();

      rerender(<Player requestedApp={stars.app} />);

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      await stars.finish();
      fireEvent.click(playButton());
      expect(boots).toEqual(['conf:stars']);
    });
  });

  // The archive downloads as the production's page opens, so that Play starts it at once
  describe('Downloads', () => {
    it('shows the download progress while it loads', async () => {
      const stars = deferredApp('stars');
      render(<Player requestedApp={stars.app} />);
      expect(screen.getByText('Starting download…')).toBeInTheDocument();

      await stars.report({ loadedBytes: 50, totalBytes: 100 });

      expect(screen.getByText('Downloading… 50%')).toBeInTheDocument();
    });

    // Until then the page would say the download is starting
    it("keeps the finished download on the page while a tracker's saved files are read", async () => {
      let answer: (found: null) => void = () => {};
      vi.mocked(getSavedFiles).mockReturnValueOnce(
        new Promise((resolve) => {
          answer = resolve;
        })
      );
      const tracker = deferredApp('tracker');
      Object.assign(tracker.app, { kind: 'tracker', saveFiles: true });
      render(<Player requestedApp={tracker.app} />);
      await tracker.report({ loadedBytes: 100, totalBytes: 100 });

      await tracker.finish();

      const page = productionPage('tracker');
      expect(within(page).getByText('Downloading… 100%')).toBeInTheDocument();
      expect(within(page).getByText('Downloading tracker…')).toHaveAttribute('role', 'status');
      expect(screen.queryByRole('button', { name: 'Start' })).not.toBeInTheDocument();

      answer(null);
      expect(await screen.findByRole('button', { name: 'Start' })).toBeInTheDocument();
    });

    it('shows no progress from a superseded load', async () => {
      const stars = deferredApp('stars');
      const rotate = deferredApp('3drotate');
      const { rerender } = render(<Player requestedApp={stars.app} />);
      const reportStars = stars.loader.mock.lastCall?.[0];
      rerender(<Player requestedApp={rotate.app} />);

      act(() => reportStars?.({ loadedBytes: 50, totalBytes: 100 }));

      expect(screen.getByText('Starting download…')).toBeInTheDocument();
    });

    // A loader that never reports its start, such as one whose request never goes out: a
    // download times itself out only once it has started
    it('fails with Try again when nothing arrives for 20 s', async () => {
      vi.useFakeTimers();
      vi.spyOn(console, 'error').mockImplementation(() => {});
      try {
        const stars = deferredApp('stars');
        render(<Player requestedApp={stars.app} />);

        await act(() => vi.advanceTimersByTimeAsync(19_000));
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
        await act(() => vi.advanceTimersByTimeAsync(1_000));

        // In the production's page, in place of the download: no endless progress bar
        const page = productionPage('stars');
        expect(within(page).getByRole('alert')).toHaveTextContent(
          'The request took too long to complete'
        );
        expect(within(page).getByRole('button', { name: 'Try Again' })).toHaveFocus();
        expect(within(page).queryByRole('progressbar')).not.toBeInTheDocument();
        expect(stars.signal()?.aborted).toBe(true);
        expect(boots).toEqual([]);
      } finally {
        vi.useRealTimers();
      }
    });

    // A load that reported a share, then failed, such as one that stalled
    it("starts a load Try Again begins from nothing, not from the last load's share", async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      const stars = deferredApp('stars');
      render(<Player requestedApp={stars.app} />);
      await stars.report({ loadedBytes: 50, totalBytes: 100 });
      await stars.fail(new Error('Download timed out: no data received for 20 seconds'));

      fireEvent.click(screen.getByRole('button', { name: 'Try Again' }));

      expect(screen.getByText('Starting download…')).toBeInTheDocument();
      expect(screen.getByRole('progressbar', { name: 'Download progress' })).not.toHaveAttribute(
        'aria-valuenow'
      );
    });

    // Back or Forward away from a production while it downloads, and to it again
    it('starts a new load of the same production from nothing', async () => {
      const stars = deferredApp('stars');
      const rotate = deferredApp('3drotate');
      const { rerender } = render(<Player requestedApp={stars.app} />);
      await stars.report({ loadedBytes: 50, totalBytes: 100 });
      rerender(<Player requestedApp={rotate.app} />);

      rerender(<Player requestedApp={stars.app} />);

      expect(stars.loader).toHaveBeenCalledTimes(2);
      expect(screen.getByText('Starting download…')).toBeInTheDocument();
    });

    // The failed load's 20 s would otherwise run out during the next one, and fail it
    it("clears a failed load's start timer before Try Again", async () => {
      vi.useFakeTimers();
      vi.spyOn(console, 'error').mockImplementation(() => {});
      try {
        let fail: (error: unknown) => void = () => {};
        let report: ((progress: LoadProgress) => void) | undefined;
        const loader = vi
          .fn<DosApp['loader']>()
          .mockImplementationOnce(
            () =>
              new Promise((_, reject) => {
                fail = reject;
              })
          )
          .mockImplementationOnce((onProgress) => {
            report = onProgress;
            return new Promise(() => {});
          });
        render(<Player requestedApp={{ ...mockApp, id: 'stalls', loader }} />);
        await act(() => vi.advanceTimersByTimeAsync(5_000));
        fail(new TypeError('Failed to fetch'));
        await act(() => vi.advanceTimersByTimeAsync(0));
        expect(screen.getByRole('alert')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Try Again' }));
        act(() => report?.({ loadedBytes: 0, totalBytes: null }));
        await act(() => vi.advanceTimersByTimeAsync(25_000));

        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
        expect(loader).toHaveBeenCalledTimes(2);
        expect(loader.mock.calls[1]?.[1]?.aborted).toBe(false);
      } finally {
        vi.useRealTimers();
      }
    });

    // loadZipArchive gives up on a download that stalls, from its request on, retries
    // included; one that keeps going may take minutes on a slow connection
    it('sets no time limit of its own on a download that has started', async () => {
      vi.useFakeTimers();
      try {
        const stars = deferredApp('stars');
        render(<Player requestedApp={stars.app} />);
        await stars.report({ loadedBytes: 0, totalBytes: null });

        await act(() => vi.advanceTimersByTimeAsync(10 * 60_000));

        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
        expect(screen.getByText('Starting download…')).toBeInTheDocument();
        expect(stars.signal()?.aborted).toBe(false);
      } finally {
        vi.useRealTimers();
      }
    });
  });

  // The download on the production's page: one that stalls would keep it up for good
  describe("The download on the production's page", () => {
    /** The page's announcement of the download */
    const downloadStatus = () => within(productionPage('stars')).getByText(/^Downloading stars…$/);

    // The share changes with each chunk of the archive: announced, it would be read out up to
    // a hundred times
    it('tells screen readers once that it downloads, and keeps the share in a progress bar', async () => {
      const stars = deferredApp('stars');
      render(<Player requestedApp={stars.app} />);
      const status = downloadStatus();
      const bar = screen.getByRole('progressbar', { name: 'Download progress' });

      // Only the message: the share and the Cancel button are no part of what is announced
      expect(status).toHaveAttribute('role', 'status');
      expect(status).toHaveTextContent(/^Downloading stars…$/);
      expect(screen.getByText('Starting download…')).toBeInTheDocument();
      expect(bar).not.toHaveAttribute('aria-valuenow');

      await stars.report({ loadedBytes: 913_000, totalBytes: 2_000_000 });

      expect(downloadStatus()).toBe(status);
      expect(status).toHaveTextContent(/^Downloading stars…$/);
      // Shown, and hidden from screen readers, which have the bar's value
      expect(screen.getByText('Downloading… 45%')).toHaveAttribute('aria-hidden', 'true');
      expect(bar).toHaveAttribute('aria-valuenow', '45');
      expect(bar).toHaveAttribute('aria-valuemin', '0');
      expect(bar).toHaveAttribute('aria-valuemax', '100');
    });

    it('shows the megabytes received on an indeterminate bar when the size is unknown', async () => {
      const stars = deferredApp('stars');
      render(<Player requestedApp={stars.app} />);

      await stars.report({ loadedBytes: 1_250_000, totalBytes: null });

      // The bar has no value to give, so the figure stays readable
      expect(screen.getByText('Downloading… 1.3 MB')).not.toHaveAttribute('aria-hidden');
      expect(screen.getByRole('progressbar', { name: 'Download progress' })).not.toHaveAttribute(
        'aria-valuenow'
      );
      expect(downloadStatus()).toHaveAttribute('role', 'status');
    });
  });

  // Cancel leaves for the start page, which unmounts the player and so stops the download
  describe('Cancel functionality', () => {
    it('goes to the start page on Cancel, with no kind', () => {
      const stars = deferredApp('stars');
      render(<Player requestedApp={stars.app} />);

      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(browsedKinds()).toEqual([undefined]);
      expect(boots).toEqual([]);
    });

    it('stops the download once the start page replaces the player', async () => {
      const stars = deferredApp('stars');
      const { unmount } = render(<Player requestedApp={stars.app} />);
      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

      unmount();
      await stars.finish();

      expect(stars.signal()?.aborted).toBe(true);
      expect(boots).toEqual([]);
    });
  });

  describe('Overlapping loads', () => {
    it('aborts the download of a request that a newer one supersedes', () => {
      const stars = deferredApp('stars');
      const rotate = deferredApp('3drotate');
      const { rerender } = render(<Player requestedApp={stars.app} />);
      expect(stars.signal()?.aborted).toBe(false);

      rerender(<Player requestedApp={rotate.app} />);

      expect(stars.signal()?.aborted).toBe(true);
      expect(rotate.signal()?.aborted).toBe(false);
    });

    it('ignores a superseded load that finishes after the newer one', async () => {
      const stars = deferredApp('stars');
      const rotate = deferredApp('3drotate');
      const { rerender } = render(<Player requestedApp={stars.app} />);
      rerender(<Player requestedApp={rotate.app} />);

      await rotate.finish();
      await stars.finish();
      fireEvent.click(playButton());

      expect(boots).toEqual(['conf:3drotate']);
    });

    it('ignores a superseded load that finishes before the newer one', async () => {
      const stars = deferredApp('stars');
      const rotate = deferredApp('3drotate');
      const { rerender } = render(<Player requestedApp={stars.app} />);
      rerender(<Player requestedApp={rotate.app} />);

      await stars.finish();

      expect(screen.queryByRole('button', { name: 'Play' })).not.toBeInTheDocument();
      expect(screen.getByText('Starting download…')).toBeInTheDocument();

      await rotate.finish();
      fireEvent.click(playButton());

      expect(boots).toEqual(['conf:3drotate']);
    });

    it('does not report a superseded load that fails', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      const broken = deferredApp('broken');
      const stars = deferredApp('stars');
      const { rerender } = render(<Player requestedApp={broken.app} />);
      rerender(<Player requestedApp={stars.app} />);

      await broken.fail(new Error('Network down'));

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      expect(consoleError).not.toHaveBeenCalled();
      await stars.finish();
      fireEvent.click(playButton());
      expect(boots).toEqual(['conf:stars']);
    });

    it('drops a load still running when no app is requested', async () => {
      const stars = deferredApp('stars');
      const { rerender } = render(<Player requestedApp={null} />);
      rerender(<Player requestedApp={stars.app} />);

      rerender(<Player requestedApp={null} />);

      expect(stars.signal()?.aborted).toBe(true);
      expect(screen.queryByText('Starting download…')).not.toBeInTheDocument();
      await stars.finish();
      // The request for stars stopped the default prompt, which starts again
      expect(boots).toEqual(['default', 'default']);
    });

    it('loads the stopped app again when the request returns to it during another load', async () => {
      const stars = deferredApp('stars');
      const rotate = deferredApp('3drotate');
      const { rerender } = render(<Player requestedApp={rotate.app} />);
      await rotate.finish();
      fireEvent.click(playButton());
      rerender(<Player requestedApp={stars.app} />);

      rerender(<Player requestedApp={rotate.app} />);

      expect(stars.signal()?.aborted).toBe(true);
      expect(rotate.loader).toHaveBeenCalledTimes(2);
      expect(screen.getByText('Starting download…')).toBeInTheDocument();
      await stars.finish();
      await rotate.finish();
      fireEvent.click(playButton());
      expect(boots).toEqual(['conf:3drotate', 'conf:3drotate']);
    });

    it('aborts a requested load when unmounted', () => {
      const stars = deferredApp('stars');
      const { unmount } = render(<Player requestedApp={stars.app} />);

      unmount();

      expect(stars.signal()?.aborted).toBe(true);
    });
  });
});
