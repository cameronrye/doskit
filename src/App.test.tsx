/**
 * Tests for App component
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, render, screen, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Ref } from 'react';
import App from './App';
import type { DosApp } from './types/dos-app';
import type { KindFilter } from './utils/productionFilter';
import { loadStartPageState, saveStartPageState } from './utils/startPageState';

// Type definitions for test mocks
interface DosPlayerWithAppsProps {
  requestedApp: DosApp | null;
  onBrowse: (kind?: KindFilter) => void;
  onOpenApp: (app: DosApp) => void;
  onAbout: () => void;
  aboutButtonRef?: Ref<HTMLButtonElement>;
  isOnline: boolean;
  apps: readonly DosApp[];
  onStatusChange?: (status: 'idle' | 'loading' | 'ready' | 'error') => void;
  onReady?: () => void;
  onExit?: () => void;
}

const { requests, describeRequest, keysHandledInPlayer, player, testApps } = vi.hoisted(() => {
  const testApp: DosApp = {
    id: 'test-app',
    name: 'Test Application',
    description: 'A test DOS application',
    author: 'Test Author',
    year: 1995,
    kind: 'demo',
    archiveBytes: 3,
    loadMethod: 'zip',
    dosboxConf: '[cpu]\ncore=auto',
    loader: async () => new Uint8Array([1, 2, 3]),
  };
  return {
    /**
     * throws: set to make the mock player throw while rendering, as a render error would.
     * real: set to render the real player, with its production page, instead of the mock.
     */
    player: { throws: false, real: false },
    /** The requestedApp App gave DosPlayerWithApps on each commit, oldest first */
    requests: [] as string[],
    /** How a requestedApp prop shows up: the app's id, or 'none' for the DOS prompt */
    describeRequest: (app: DosApp | null) => app?.id ?? 'none',
    /** Keys the mock's own key handler got, as the player's overlays get them */
    keysHandledInPlayer: [] as string[],
    /**
     * Productions of the tests' own, beside DosKit's, at /testapp and so on: some lack what
     * every one of DosKit's has, an author or a year
     */
    testApps: {
      testApp,
      tracker: { ...testApp, id: 'test-tracker', name: 'Test Tracker', warnBeforeLeaving: true },
      noYear: { ...testApp, id: 'no-year', name: 'No Year', year: undefined },
      noAuthor: { ...testApp, id: 'no-author', name: 'No Author', author: undefined },
      anonymous: {
        ...testApp,
        id: 'anonymous',
        name: 'Anonymous',
        author: undefined,
        year: undefined,
      },
    } satisfies Record<string, DosApp>,
  };
});

// The tests' productions open from their URLs, as DosKit's do; the start page lists DosKit's
vi.mock('./config/apps.config', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./config/apps.config')>();
  const own: DosApp[] = Object.values(testApps);
  const urlIds = Object.fromEntries(own.map((app) => [app.id.replaceAll('-', ''), app.id]));
  return {
    ...actual,
    findAppById: (id: string) => own.find((app) => app.id === id) ?? actual.findAppById(id),
    // Without a prototype, as the real one, so that ?app=constructor names nothing
    APP_ID_MAPPING: Object.assign(Object.create(null), actual.APP_ID_MAPPING, urlIds),
  };
});

interface OfflineIndicatorProps {
  onNetworkStatusChange?: (isOnline: boolean) => void;
}

interface WindowWithTestCallbacks extends Window {
  __networkCallback?: (isOnline: boolean) => void;
}

// Mock DosPlayerWithApps component
vi.mock('./components/DosPlayerWithApps', async (importOriginal) => {
  const { useEffect } = await import('react');
  const actual = await importOriginal<typeof import('./components/DosPlayerWithApps')>();
  const MockPlayer = ({
    onStatusChange,
    onBrowse,
    onOpenApp,
    onAbout,
    aboutButtonRef,
    isOnline,
    apps,
    requestedApp,
  }: DosPlayerWithAppsProps) => {
    if (player.throws) {
      throw new Error('Player render failed');
    }

    const request = describeRequest(requestedApp);
    useEffect(() => {
      requests.push(request);
    });
    const secondReality = apps.find((app) => app.id === 'second-reality');

    return (
      <div
        data-testid="dos-player-with-apps-mock"
        onKeyDown={(event) => keysHandledInPlayer.push(event.key)}
      >
        {/* js-dos's element, which DosPlayerUI renders and js-dos draws the DOS screen in */}
        <div className="dos-player-container">
          <canvas data-testid="dos-screen" />
        </div>
        <button onClick={() => onStatusChange?.('ready')}>Report Ready</button>
        <button onClick={() => onStatusChange?.('loading')}>Report Loading</button>
        <button onClick={() => onStatusChange?.('idle')}>Report Idle</button>
        <button onClick={() => onStatusChange?.('error')}>Report Error</button>
        {/* As the run bar's Browse and the end card's, and the production page's breadcrumb */}
        <button onClick={() => onBrowse()}>Browse</button>
        <button onClick={() => onBrowse('intro')}>Player Browse Intros</button>
        {/* As the production page's About and the run bar's, which the DOS prompt has not */}
        {requestedApp && (
          <button ref={aboutButtonRef} onClick={onAbout}>
            About
          </button>
        )}
        {/* As a "More by" link on the production page */}
        {secondReality && (
          <button onClick={() => onOpenApp(secondReality)}>Open Second Reality</button>
        )}
        <div data-testid="requested-app">{request}</div>
        <div data-testid="network">{isOnline ? 'online' : 'offline'}</div>
      </div>
    );
  };
  return {
    DosPlayerWithApps: (props: DosPlayerWithAppsProps) =>
      player.real ? <actual.DosPlayerWithApps {...props} /> : <MockPlayer {...props} />,
  };
});

// Mock OfflineIndicator component
vi.mock('./components/OfflineIndicator', () => ({
  OfflineIndicator: ({ onNetworkStatusChange }: OfflineIndicatorProps) => {
    // Store callback in window for test access
    (window as WindowWithTestCallbacks).__networkCallback = onNetworkStatusChange;

    return (
      <div data-testid="offline-indicator-mock">
        <button onClick={() => onNetworkStatusChange?.(false)}>Go Offline</button>
        <button onClick={() => onNetworkStatusChange?.(true)}>Go Online</button>
      </div>
    );
  },
}));

/** Go back or forward in jsdom's history and wait until App has handled the popstate */
async function traverse(direction: 'back' | 'forward') {
  await act(async () => {
    const popped = new Promise((resolve) =>
      window.addEventListener('popstate', resolve, { once: true })
    );
    window.history[direction]();
    await popped;
  });
}

/** The start page's link to a production, by its name */
const productionLink = (name: string) =>
  within(screen.getByRole('list', { name: 'Productions' })).getByRole('link', {
    name: new RegExp(`^${name}`),
  });

/** Whether the start page shows, and the player does not */
function expectStartPage() {
  expect(screen.getByRole('list', { name: 'Productions' })).toBeInTheDocument();
  expect(screen.queryByTestId('dos-player-with-apps-mock')).not.toBeInTheDocument();
}

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete (window as WindowWithTestCallbacks).__networkCallback;
    // jsdom keeps one URL and history for the whole file, and the start page's state for
    // the browser session
    window.history.replaceState({}, '', '/');
    window.sessionStorage.clear();
    requests.length = 0;
    keysHandledInPlayer.length = 0;
    player.real = false;
  });

  describe('Keys and the running player', () => {
    // Stands in for js-dos, which sends every key that reaches window to DOS and cancels the
    // browser's own handling of it
    const keysAtWindow: string[] = [];
    const recordKey = (event: KeyboardEvent) => keysAtWindow.push(`${event.type} ${event.key}`);

    beforeEach(() => {
      window.history.replaceState({}, '', '/dos');
      keysAtWindow.length = 0;
      window.addEventListener('keydown', recordKey);
      window.addEventListener('keyup', recordKey);
    });

    afterEach(() => {
      window.removeEventListener('keydown', recordKey);
      window.removeEventListener('keyup', recordKey);
    });

    it("keeps keys pressed on DosKit's own controls from js-dos", () => {
      render(<App />);
      const button = screen.getByRole('button', { name: 'Browse' });

      fireEvent.keyDown(button, { key: 'Enter' });
      fireEvent.keyUp(button, { key: 'Enter' });
      fireEvent.keyDown(button, { key: 'Tab' });

      expect(keysAtWindow).toEqual([]);
    });

    it('still gives those keys to the key handlers inside the app', () => {
      render(<App />);

      fireEvent.keyDown(screen.getByText('Report Ready'), { key: 'ArrowRight' });

      expect(keysHandledInPlayer).toEqual(['ArrowRight']);
      expect(keysAtWindow).toEqual([]);
    });

    it('lets keys pressed in the player reach js-dos', () => {
      render(<App />);
      const dosScreen = screen.getByTestId('dos-screen');

      fireEvent.keyDown(dosScreen, { key: 'a' });
      fireEvent.keyUp(dosScreen, { key: 'a' });

      expect(keysAtWindow).toEqual(['keydown a', 'keyup a']);
    });

    it('lets keys reach js-dos while nothing has the focus', () => {
      render(<App />);

      fireEvent.keyDown(document.body, { key: 'Escape' });

      expect(keysAtWindow).toEqual(['keydown Escape']);
    });

    // A key held in DOS while Browse is clicked: without its release, DOSBox repeats the key
    // without end
    it('gives js-dos the release of a key pressed in the player, even on a control', () => {
      render(<App />);

      fireEvent.keyDown(screen.getByTestId('dos-screen'), { key: 'a', code: 'KeyA' });
      fireEvent.keyUp(screen.getByRole('button', { name: 'Browse' }), {
        key: 'a',
        code: 'KeyA',
      });

      expect(keysAtWindow).toEqual(['keydown a', 'keyup a']);
    });

    // A key that closes a dialog as it goes down leaves the focus on the page
    it('keeps from js-dos the release of a key pressed on a control, once the focus is on the page', () => {
      render(<App />);

      fireEvent.keyDown(screen.getByRole('button', { name: 'Browse' }), {
        key: 'Escape',
        code: 'Escape',
      });
      fireEvent.keyUp(document.body, { key: 'Escape', code: 'Escape' });

      expect(keysAtWindow).toEqual([]);
    });
  });

  describe('URL routing', () => {
    it('shows the start page at /, and runs nothing', () => {
      render(<App />);

      expectStartPage();
      expect(requests).toEqual([]);
      expect(document.title).toBe('DosKit - DOS demoscene classics in your browser');
    });

    it('requests the app a deep link names from the first render', () => {
      window.history.replaceState({}, '', '/?app=stars');

      render(<App />);

      expect(requests[0]).toBe('stars');
      expect(screen.getByTestId('requested-app')).toHaveTextContent('stars');
      expect(screen.queryByRole('list', { name: 'Productions' })).not.toBeInTheDocument();
      expect(document.title).toBe('Starfield Effect - DosKit');
    });

    it('opens a production from the start page at its own URL, with a history entry', () => {
      render(<App />);
      const lengthBefore = window.history.length;

      fireEvent.click(productionLink('Second Reality'));

      expect(window.location.pathname).toBe('/secondreality');
      expect(window.history.length).toBe(lengthBefore + 1);
      expect(screen.getByTestId('requested-app')).toHaveTextContent('second-reality');
      expect(screen.queryByRole('list', { name: 'Productions' })).not.toBeInTheDocument();
      expect(document.title).toBe('Second Reality - DosKit');
    });

    it('opens the DOS prompt from the start page at /dos, with a history entry', () => {
      render(<App />);
      const lengthBefore = window.history.length;

      fireEvent.click(screen.getByRole('button', { name: 'C:\\> DOS prompt' }));

      expect(window.location.pathname).toBe('/dos');
      expect(window.history.length).toBe(lengthBefore + 1);
      expect(screen.getByTestId('requested-app')).toHaveTextContent('none');
      expect(requests).toEqual(['none']);
    });

    it('names the DOS prompt in the title at /dos', () => {
      window.history.replaceState({}, '', '/dos');

      render(<App />);

      expect(document.title).toBe('DOS prompt - DosKit');
      expect(screen.getByTestId('requested-app')).toHaveTextContent('none');
    });

    it('returns to the start page from /dos on Back', async () => {
      render(<App />);
      fireEvent.click(screen.getByRole('button', { name: 'C:\\> DOS prompt' }));

      await traverse('back');

      expect(window.location.pathname).toBe('/');
      expectStartPage();
      expect(document.title).toBe('DosKit - DOS demoscene classics in your browser');
    });

    it.each(['/DOS', '/dos/'])('rewrites %s to /dos without a new history entry', (url) => {
      window.history.replaceState({}, '', url);
      const lengthBefore = window.history.length;

      render(<App />);

      expect(window.location.pathname).toBe('/dos');
      expect(window.history.length).toBe(lengthBefore);
      expect(screen.getByTestId('requested-app')).toHaveTextContent('none');
    });

    it('shows the start page after going back from a production, and stops it', async () => {
      window.history.pushState({}, '', '/?app=stars');
      render(<App />);

      await traverse('back');

      expectStartPage();
      expect(document.title).toBe('DosKit - DOS demoscene classics in your browser');
    });

    it('requests the app that going forward lands on', async () => {
      window.history.pushState({}, '', '/?app=3drotate');
      window.history.back();
      await new Promise((resolve) => window.addEventListener('popstate', resolve, { once: true }));
      render(<App />);

      await traverse('forward');

      expect(screen.getByTestId('requested-app')).toHaveTextContent('3drotate');
      expect(document.title).toBe('3D Rotation Demo - DosKit');
    });

    it('adds no history entry for a path-style deep link', () => {
      window.history.replaceState({}, '', '/stars');
      const lengthBefore = window.history.length;

      render(<App />);

      expect(window.location.pathname + window.location.search).toBe('/stars');
      expect(window.history.length).toBe(lengthBefore);
    });

    it('keeps the forward history when going back to a production', async () => {
      window.history.pushState({}, '', '/stars');
      window.history.pushState({}, '', '/3drotate');
      render(<App />);
      await traverse('back');
      expect(screen.getByTestId('requested-app')).toHaveTextContent('stars');

      await traverse('forward');

      expect(window.location.pathname).toBe('/3drotate');
      expect(screen.getByTestId('requested-app')).toHaveTextContent('3drotate');
    });

    // Links from before each app had a page of its own, such as the blog's
    it("rewrites an old /?app= link to the app's page without a new history entry", () => {
      window.history.replaceState({}, '', '/?app=stars');
      const lengthBefore = window.history.length;

      render(<App />);

      expect(window.location.pathname + window.location.search).toBe('/stars');
      expect(window.history.length).toBe(lengthBefore);
      expect(requests[0]).toBe('stars');
    });

    it('rewrites other spellings of a deep link to the one the app uses', () => {
      window.history.replaceState({}, '', '/?app=Second-Reality');
      const lengthBefore = window.history.length;

      render(<App />);

      expect(window.location.pathname + window.location.search).toBe('/secondreality');
      expect(window.history.length).toBe(lengthBefore);
    });

    it('rewrites an old /?app= entry that going back lands on', async () => {
      window.history.replaceState({}, '', '/?app=stars');
      window.history.pushState({}, '', '/');
      render(<App />);

      await traverse('back');

      expect(window.location.pathname + window.location.search).toBe('/stars');
      expect(screen.getByTestId('requested-app')).toHaveTextContent('stars');
    });

    it('tells the start page that a deep link named an unknown production', () => {
      window.history.replaceState({}, '', '/?app=nope');
      const lengthBefore = window.history.length;

      render(<App />);

      expectStartPage();
      expect(screen.getByRole('alert')).toHaveTextContent(
        `No production called "nope". Here's everything on DosKit.`
      );
      expect(screen.getAllByText(/No production/)).toHaveLength(1);
      // The unknown app is dropped from the URL without a new history entry
      expect(window.location.pathname + window.location.search).toBe('/');
      expect(window.history.length).toBe(lengthBefore);
    });

    it.each([
      ['no safe characters', '/?app=%E2%9C%93'],
      ['over 100 characters', `/?app=${'a'.repeat(150)}`],
      ['an empty value', '/?app='],
    ])('drops an ?app= value with %s and says the link names no production', (_, url) => {
      window.history.replaceState({}, '', url);
      const lengthBefore = window.history.length;

      render(<App />);

      // The value is left out of the message
      expect(screen.getByRole('alert')).toHaveTextContent(
        /^No production by that name\. Here's everything on DosKit\.$/
      );
      expectStartPage();
      expect(window.location.search).toBe('');
      expect(window.history.length).toBe(lengthBefore);
    });

    // /stars?app= names no app by its ?app=, but its path would run Starfield on a reload
    it('drops a path-style app with an ?app= that names none', () => {
      window.history.replaceState({}, '', '/stars?app=');

      render(<App />);

      expect(window.location.pathname + window.location.search).toBe('/');
      expectStartPage();
    });

    it('tells the start page when going forward lands on an unknown production', async () => {
      window.history.pushState({}, '', '/?app=bogus');
      window.history.back();
      await new Promise((resolve) => window.addEventListener('popstate', resolve, { once: true }));
      render(<App />);
      expect(screen.queryByText(/No production/)).not.toBeInTheDocument();

      await traverse('forward');

      expect(screen.getByRole('alert')).toHaveTextContent('No production called "bogus".');
      expect(window.location.search).toBe('');
    });

    it('stops the running production when going back lands on an unknown one', async () => {
      window.history.replaceState({}, '', '/?app=bogus');
      window.history.pushState({}, '', '/?app=stars');
      render(<App />);

      await traverse('back');

      expect(screen.getByRole('alert')).toHaveTextContent('No production called "bogus".');
      expectStartPage();
    });

    it('drops the notice once a production opens, so it does not come back with Back', async () => {
      window.history.replaceState({}, '', '/?app=bogus');
      render(<App />);
      expect(screen.getByRole('alert')).toBeInTheDocument();

      fireEvent.click(productionLink('Second Reality'));
      expect(screen.queryByText(/No production/)).not.toBeInTheDocument();
      await traverse('back');

      expectStartPage();
      expect(screen.queryByText(/No production/)).not.toBeInTheDocument();
    });

    it('records a production opened right after going back in the URL', async () => {
      window.history.pushState({}, '', '/?app=stars');
      render(<App />);
      await traverse('back');

      fireEvent.click(productionLink('3D Rotation Demo'));

      expect(window.location.pathname).toBe('/3drotate');
    });

    it("goes to the start page with a kind's tab selected when the player asks", () => {
      window.history.replaceState({}, '', '/stars');
      render(<App />);
      const lengthBefore = window.history.length;

      fireEvent.click(screen.getByRole('button', { name: 'Player Browse Intros' }));

      expect(window.location.pathname).toBe('/');
      expect(window.history.length).toBe(lengthBefore + 1);
      expectStartPage();
      expect(screen.getByRole('button', { name: /^Intros \d+$/ })).toHaveAttribute(
        'aria-pressed',
        'true'
      );
      expect(loadStartPageState()).toMatchObject({ kind: 'intro', query: '' });
    });

    it('goes back to the start page as it was when the player asks with no kind', () => {
      saveStartPageState({ kind: 'tracker', query: 'tracker', scrollTop: 0, focusId: null });
      window.history.replaceState({}, '', '/stars');
      render(<App />);

      fireEvent.click(screen.getByRole('button', { name: 'Browse' }));

      expect(window.location.pathname).toBe('/');
      expect(screen.getByRole('button', { name: /^Trackers \d+$/ })).toHaveAttribute(
        'aria-pressed',
        'true'
      );
      expect(screen.getByRole('searchbox', { name: 'Search productions' })).toHaveValue('tracker');
    });

    // A "More by" link on a production's page
    it('opens another production the player asks for at its own URL, with a history entry', () => {
      window.history.replaceState({}, '', '/unreal');
      render(<App />);
      const lengthBefore = window.history.length;

      fireEvent.click(screen.getByRole('button', { name: 'Open Second Reality' }));

      expect(window.location.pathname).toBe('/secondreality');
      expect(window.history.length).toBe(lengthBefore + 1);
      expect(screen.getByTestId('requested-app')).toHaveTextContent('second-reality');
      expect(document.title).toBe('Second Reality - DosKit');
    });
  });

  describe('Rendering', () => {
    beforeEach(() => {
      window.history.replaceState({}, '', '/dos');
    });

    it('should render DosPlayerWithApps component', () => {
      render(<App />);
      expect(screen.getByTestId('dos-player-with-apps-mock')).toBeInTheDocument();
    });

    it('should render OfflineIndicator component', () => {
      render(<App />);
      expect(screen.getByTestId('offline-indicator-mock')).toBeInTheDocument();
    });

    it('renders the OfflineIndicator on the start page too', () => {
      window.history.replaceState({}, '', '/');
      render(<App />);
      expect(screen.getByTestId('offline-indicator-mock')).toBeInTheDocument();
    });

    // For its run bar's status
    it('tells the player whether the browser is online', () => {
      render(<App />);
      expect(screen.getByTestId('network')).toHaveTextContent('online');

      fireEvent.click(screen.getByText('Go Offline'));
      expect(screen.getByTestId('network')).toHaveTextContent('offline');

      fireEvent.click(screen.getByText('Go Online'));
      expect(screen.getByTestId('network')).toHaveTextContent('online');
    });
  });

  describe('Layout', () => {
    // The run bar inside the player replaces them
    it('puts no header or footer round the running player, only the main it runs in', () => {
      window.history.replaceState({}, '', '/dos');
      const { container } = render(<App />);

      expect(container.querySelector('.app')).toBeInTheDocument();
      expect(screen.queryByRole('banner')).not.toBeInTheDocument();
      expect(screen.queryByRole('contentinfo')).not.toBeInTheDocument();
      expect(screen.getByRole('main')).toContainElement(
        screen.getByTestId('dos-player-with-apps-mock')
      );
    });

    // Its own header and footer sit in the main and the page's section, where they are no
    // landmarks (jsdom's roles would call them banner and contentinfo all the same)
    it("has one main on a production's page, round the page", async () => {
      player.real = true;
      window.history.replaceState({}, '', '/testapp');
      render(<App />);

      const page = await screen.findByRole('region', { name: 'Test Application' });
      expect(await screen.findByRole('button', { name: 'Play' })).toBeInTheDocument();

      expect(screen.getAllByRole('main')).toHaveLength(1);
      expect(screen.getByRole('main')).toContainElement(page);
    });

    // The start page has a header, a footer and a main of its own
    it('shows the start page without the main the player runs in', () => {
      const { container } = render(<App />);

      expect(container.querySelector('.app')).toBeInTheDocument();
      expect(screen.getAllByRole('main')).toHaveLength(1);
      expect(container.querySelector('.app-main')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy on the start page', () => {
      render(<App />);
      const heading = screen.getByRole('heading', { name: 'DosKit' });
      expect(heading.tagName).toBe('H1');
    });

    /** Every link that opens a new tab keeps the page that opened it out of reach */
    const expectSafeLinks = () => {
      const links = screen.getAllByRole('link');
      expect(links.some((link) => link.getAttribute('target') === '_blank')).toBe(true);
      links.forEach((link) => {
        if (link.getAttribute('target') === '_blank') {
          expect(link).toHaveAttribute('rel', 'noopener noreferrer');
        }
      });
    };

    it('should have proper link attributes for security on the start page', () => {
      render(<App />);
      expectSafeLinks();
    });

    it("should have proper link attributes for security on a production's page", async () => {
      player.real = true;
      window.history.replaceState({}, '', '/testapp');
      render(<App />);
      await screen.findByRole('button', { name: 'Play' });

      expectSafeLinks();
    });
  });

  // The player shows the About button, on the production's page and in the run bar, with
  // App's handler and ref; App shows the panel, outside the player
  describe('About button', () => {
    it('opens the About panel for the current production, and closes it', async () => {
      window.history.replaceState({}, '', '/testapp');
      render(<App />);

      fireEvent.click(screen.getByRole('button', { name: 'About' }));
      const panel = screen.getByRole('dialog', { name: 'Test Application' });
      expect(await within(panel).findByText('A test DOS application')).toBeInTheDocument();

      fireEvent.click(within(panel).getByRole('button', { name: 'Close' }));
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      // The focus goes back to the button that opened it, through App's ref
      expect(screen.getByRole('button', { name: 'About' })).toHaveFocus();
    });

    it('leaves the focus with the page when the panel is closed with the mouse, so keys reach DOS', async () => {
      window.history.replaceState({}, '', '/testapp');
      render(<App />);
      fireEvent.click(screen.getByRole('button', { name: 'About' }));
      await screen.findByText('A test DOS application');

      // A mouse click has a click count; a key's has none
      fireEvent.click(screen.getByRole('button', { name: 'Close' }), { detail: 1 });

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(document.activeElement).toBe(document.body);
    });

    // Back and Forward come through under an open panel
    it('closes the panel when the page changes, and keeps it closed on return', async () => {
      window.history.replaceState({}, '', '/');
      window.history.pushState({}, '', '/testapp');
      render(<App />);
      fireEvent.click(screen.getByRole('button', { name: 'About' }));
      await screen.findByText('A test DOS application');

      await traverse('back');
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      await traverse('forward');

      expect(screen.queryByRole('dialog', { name: 'Test Application' })).not.toBeInTheDocument();
    });

    // The page takes Escape for Browse: the panel is no part of it, so its Escape stays in it
    it("Escape with About open closes About and stays on the production's page", async () => {
      player.real = true;
      window.history.replaceState({}, '', '/testapp');
      const user = userEvent.setup();
      render(<App />);
      const page = await screen.findByRole('region', { name: 'Test Application' });
      await within(page).findByRole('button', { name: 'Play' });
      const about = within(page).getByRole('button', { name: 'About' });
      await user.click(about);
      const panel = screen.getByRole('dialog', { name: 'Test Application' });
      await within(panel).findByText('A test DOS application');
      expect(within(panel).getByRole('button', { name: 'Close' })).toHaveFocus();

      await user.keyboard('{Escape}');

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(window.location.pathname).toBe('/testapp');
      expect(screen.getByRole('region', { name: 'Test Application' })).toBe(page);
      expect(about).toHaveFocus();
    });
  });

  // The player's Browse, in the run bar, on the end card or the production's page
  describe('Browse', () => {
    it('goes to the start page, with a history entry that Back undoes', async () => {
      window.history.replaceState({}, '', '/testapp');
      render(<App />);
      const lengthBefore = window.history.length;

      fireEvent.click(screen.getByRole('button', { name: 'Browse' }));

      expect(window.location.pathname).toBe('/');
      expect(window.history.length).toBe(lengthBefore + 1);
      expectStartPage();

      await traverse('back');

      expect(screen.getByTestId('requested-app')).toHaveTextContent('test-app');
    });
  });

  describe('Leaving the page', () => {
    /**
     * Fire the beforeunload a close, reload or Ctrl+W of the tab fires, with the returnValue
     * Chrome and Edge before 119 ask on
     * @returns Whether App asked, both ways
     */
    function leavePage() {
      const event = new Event('beforeunload', { cancelable: true });
      Object.defineProperty(event, 'returnValue', { value: undefined, writable: true });
      window.dispatchEvent(event);
      return { prevented: event.defaultPrevented, returnValue: event.returnValue as unknown };
    }
    const asked = { prevented: true, returnValue: true };
    const notAsked = { prevented: false, returnValue: undefined };

    /** Open a production at its URL, its player ready, as DosPlayerWithApps reports it */
    function runApp(url: string) {
      window.history.replaceState({}, '', url);
      render(<App />);
      fireEvent.click(screen.getByText('Report Ready'));
    }

    it('asks before the page goes while an app that warns about it runs', () => {
      runApp('/testtracker');

      expect(leavePage()).toEqual(asked);
    });

    // Nothing has run yet, or nothing runs: nothing can be lost
    it.each([
      ['downloads, or its emulator starts', 'Report Loading'],
      ['failed to load or start', 'Report Error'],
    ])('lets the page go while that app %s', (_, report) => {
      runApp('/testtracker');

      fireEvent.click(screen.getByText(report));

      expect(leavePage()).toEqual(notAsked);
    });

    it('lets the page go while an app runs that does not warn about it', () => {
      runApp('/testapp');

      expect(leavePage()).toEqual(notAsked);
    });

    it('stops asking once another app replaces the one that warns', async () => {
      window.history.replaceState({}, '', '/testapp');
      window.history.pushState({}, '', '/testtracker');
      render(<App />);
      fireEvent.click(screen.getByText('Report Ready'));

      await traverse('back');

      expect(leavePage()).toEqual(notAsked);
    });

    // App's error boundary has replaced the player, which stopped it
    it('stops asking once a render error has taken the player down', () => {
      window.history.replaceState({}, '', '/testtracker');
      const { rerender } = render(<App />);
      fireEvent.click(screen.getByText('Report Ready'));
      expect(leavePage()).toEqual(asked);
      vi.spyOn(console, 'error').mockImplementation(() => {});

      player.throws = true;
      try {
        rerender(<App />);
      } finally {
        player.throws = false;
      }

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(leavePage()).toEqual(notAsked);
    });

    it('stops asking once the start page replaces the app that warns', () => {
      runApp('/testtracker');

      fireEvent.click(screen.getByRole('button', { name: 'Browse' }));

      expect(leavePage()).toEqual(notAsked);
    });

    it('stops asking once the DOS prompt replaces the app that warns', async () => {
      window.history.replaceState({}, '', '/dos');
      window.history.pushState({}, '', '/testtracker');
      render(<App />);
      fireEvent.click(screen.getByText('Report Ready'));

      await traverse('back');

      expect(leavePage()).toEqual(notAsked);
    });
  });

  // What App shows by route: the start page, or the player
  describe('Start page and player', () => {
    it('shows the start page, not the player, at /', () => {
      render(<App />);

      expectStartPage();
    });

    it.each(['/dos', '/stars'])('shows the player, not the start page, at %s', (url) => {
      window.history.replaceState({}, '', url);
      render(<App />);

      expect(screen.getByTestId('dos-player-with-apps-mock')).toBeInTheDocument();
      expect(screen.queryByRole('list', { name: 'Productions' })).not.toBeInTheDocument();
    });

    it('replaces the player with the start page on Browse, and the start page with it on a link', () => {
      window.history.replaceState({}, '', '/dos');
      render(<App />);

      fireEvent.click(screen.getByRole('button', { name: 'Browse' }));
      expectStartPage();
      fireEvent.click(productionLink('Starfield Effect'));

      expect(screen.getByTestId('requested-app')).toHaveTextContent('stars');
    });

    it('focuses the start page as it replaces the player, so its keys work at once', () => {
      window.history.replaceState({}, '', '/dos');
      render(<App />);

      fireEvent.click(screen.getByRole('button', { name: 'Browse' }));

      expect(screen.getByRole('main')).toHaveFocus();
    });
  });
});
