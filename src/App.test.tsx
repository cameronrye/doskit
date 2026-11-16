/**
 * Tests for App component
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { version as installedJsDosVersion } from 'js-dos/package.json';
import App from './App';
import type { DosApp } from './types/dos-app';
import type { KindFilter } from './utils/productionFilter';
import { loadStartPageState, saveStartPageState } from './utils/startPageState';

// Type definitions for test mocks
interface DosPlayerWithAppsProps {
  requestedApp: DosApp | null;
  onBrowse: (kind?: KindFilter) => void;
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
    /** Set to make the mock player throw while rendering, as a render error would */
    player: { throws: false },
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
vi.mock('./components/DosPlayerWithApps', async () => {
  const { useEffect } = await import('react');
  return {
    DosPlayerWithApps: ({ onStatusChange, onBrowse, requestedApp }: DosPlayerWithAppsProps) => {
      if (player.throws) {
        throw new Error('Player render failed');
      }

      const request = describeRequest(requestedApp);
      useEffect(() => {
        requests.push(request);
      });

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
          {/* As the end card's Choose another, and the production page's breadcrumb to come */}
          <button onClick={() => onBrowse()}>Player Browse</button>
          <button onClick={() => onBrowse('intro')}>Player Browse Intros</button>
          <div data-testid="requested-app">{request}</div>
        </div>
      );
    },
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
      expect(screen.getByText('Starfield Effect')).toBeInTheDocument();
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
      expect(screen.queryByText('Starfield Effect', { selector: '.header-app-name' })).toBeNull();
      expect(document.title).toBe('DosKit - DOS demoscene classics in your browser');
    });

    it('requests the app that going forward lands on', async () => {
      window.history.pushState({}, '', '/?app=3drotate');
      window.history.back();
      await new Promise((resolve) => window.addEventListener('popstate', resolve, { once: true }));
      render(<App />);

      await traverse('forward');

      expect(screen.getByTestId('requested-app')).toHaveTextContent('3drotate');
      expect(screen.getByText('3D Rotation Demo')).toBeInTheDocument();
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

      fireEvent.click(screen.getByRole('button', { name: 'Player Browse' }));

      expect(window.location.pathname).toBe('/');
      expect(screen.getByRole('button', { name: /^Trackers \d+$/ })).toHaveAttribute(
        'aria-pressed',
        'true'
      );
      expect(screen.getByRole('searchbox', { name: 'Search productions' })).toHaveValue('tracker');
    });
  });

  describe('Rendering', () => {
    beforeEach(() => {
      window.history.replaceState({}, '', '/dos');
    });

    it('should render without crashing', () => {
      render(<App />);
      expect(screen.getByText('DosKit')).toBeInTheDocument();
    });

    it('should render header with logo', () => {
      render(<App />);
      const logo = screen.getByAltText('DosKit Logo');
      expect(logo).toBeInTheDocument();
      expect(logo).toHaveAttribute('src', '/logo.svg');
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
  });

  describe('Status display', () => {
    beforeEach(() => {
      window.history.replaceState({}, '', '/dos');
    });

    it('should show loading status initially', () => {
      render(<App />);
      const statusIndicators = screen.getByRole('status');
      expect(statusIndicators).toHaveTextContent(/^Loading/);
      expect(statusIndicators).toHaveTextContent(/Online/i);
    });

    it('announces the status badges as a status region that stays in the page', () => {
      render(<App />);
      const status = screen.getByRole('status');
      expect(status).toHaveTextContent('Loading');

      fireEvent.click(screen.getByText('Report Ready'));
      fireEvent.click(screen.getByText('Go Offline'));

      // A live region announces changes only to content it already holds
      expect(screen.getByRole('status')).toBe(status);
      expect(status).toHaveTextContent('Ready');
      expect(status).toHaveTextContent('Offline');
    });

    it("keeps the loading badge clear of js-dos.css's .loading rule, which draws a spinner", () => {
      render(<App />);

      const badge = screen.getByText('Loading').closest('.status-badge');

      expect(badge).not.toHaveClass('loading');
      expect(badge).toHaveClass('is-loading');
    });

    it('shows Idle while nothing runs, as on the Play screen', () => {
      render(<App />);

      fireEvent.click(screen.getByText('Report Idle'));

      expect(screen.getByRole('status')).toHaveTextContent(/^Idle/);
      expect(screen.getByText('Idle').closest('.status-badge')).toHaveAttribute(
        'title',
        'No application is running'
      );
    });

    // Nothing runs on the start page: the next player starts from Idle, not the last one's Ready
    it('sets the status to Idle on the start page', async () => {
      render(<App />);
      fireEvent.click(screen.getByText('Report Ready'));

      fireEvent.click(screen.getByRole('button', { name: 'Browse' }));
      await traverse('back');

      expect(screen.getByRole('status')).toHaveTextContent(/^Idle/);
    });

    it('shows Ready once the player is ready', () => {
      render(<App />);

      fireEvent.click(screen.getByText('Report Ready'));

      expect(screen.getByRole('status')).toHaveTextContent(/^Ready/);
    });

    it('shows Loading again once the player loads another app', () => {
      render(<App />);
      fireEvent.click(screen.getByText('Report Ready'));

      fireEvent.click(screen.getByText('Report Loading'));

      expect(screen.getByRole('status')).toHaveTextContent(/^Loading/);
    });

    // App's error boundary has replaced the player, which stopped it
    it('shows Error once a render error has taken the player down', () => {
      const { rerender } = render(<App />);
      fireEvent.click(screen.getByText('Report Ready'));
      vi.spyOn(console, 'error').mockImplementation(() => {});

      player.throws = true;
      try {
        rerender(<App />);
      } finally {
        player.throws = false;
      }

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(screen.getByRole('status')).toHaveTextContent(/^Error/);
    });

    it('shows Error, not Loading, while the player shows an error', () => {
      render(<App />);

      fireEvent.click(screen.getByText('Report Error'));

      const badge = screen.getByText('Error').closest('.status-badge');
      expect(badge).toHaveClass('is-error');
      expect(badge).toHaveAttribute('title', 'The application could not be loaded or started');
      expect(screen.getByRole('status')).not.toHaveTextContent('Loading');
    });

    it('should show offline status when network goes offline', async () => {
      render(<App />);

      const offlineButton = screen.getByText('Go Offline');
      fireEvent.click(offlineButton);

      await waitFor(() => {
        expect(screen.getByText('Offline')).toBeInTheDocument();
      });
    });

    it('should show online status when network comes back online', async () => {
      render(<App />);

      // Go offline first
      const offlineButton = screen.getByText('Go Offline');
      fireEvent.click(offlineButton);

      await waitFor(() => {
        expect(screen.getByText('Offline')).toBeInTheDocument();
      });

      // Go back online
      const onlineButton = screen.getByText('Go Online');
      fireEvent.click(onlineButton);

      await waitFor(() => {
        const onlineStatuses = screen.getAllByText('Online');
        expect(onlineStatuses.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Footer', () => {
    beforeEach(() => {
      window.history.replaceState({}, '', '/dos');
    });

    afterEach(() => {
      vi.unstubAllEnvs();
    });

    it('should render credits with the installed js-dos version', () => {
      render(<App />);
      expect(screen.getByText(/Powered by/i)).toBeInTheDocument();
      expect(screen.getByText(`js-dos v${installedJsDosVersion}`)).toBeInTheDocument();
    });

    it('should show the js-dos version the build provides', () => {
      vi.stubEnv('VITE_JSDOS_VERSION', '9.9.9');
      render(<App />);
      expect(screen.getByRole('link', { name: 'js-dos v9.9.9' })).toBeInTheDocument();
    });

    it('links to the licenses of js-dos and DOSBox next to the js-dos credit', () => {
      render(<App />);

      const licenses = screen.getByRole('link', { name: 'Licenses' });

      expect(licenses).toHaveAttribute('href', '/licenses/');
      // In a new tab, as the other footer links, so the running program keeps running
      expect(licenses).toHaveAttribute('target', '_blank');
      expect(licenses.closest('.credits')).toContainElement(
        screen.getByRole('link', { name: `js-dos v${installedJsDosVersion}` })
      );
    });

    it('should render author attribution', () => {
      render(<App />);
      expect(screen.getByText(/Made with/i)).toBeInTheDocument();
      expect(screen.getByText(/Cameron Rye/i)).toBeInTheDocument();
    });

    it('should have correct links', () => {
      render(<App />);

      const authorLink = screen.getByRole('link', { name: /Cameron Rye/i });
      expect(authorLink).toHaveAttribute('href', 'https://rye.dev/');
      expect(authorLink).toHaveAttribute('target', '_blank');
      expect(authorLink).toHaveAttribute('rel', 'noopener noreferrer');

      const jsDosLink = screen.getByRole('link', { name: `js-dos v${installedJsDosVersion}` });
      expect(jsDosLink).toHaveAttribute('href', 'https://js-dos.com');
      expect(jsDosLink).toHaveAttribute('target', '_blank');
      expect(jsDosLink).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });

  describe('Layout', () => {
    it('should have correct structure', () => {
      window.history.replaceState({}, '', '/dos');
      const { container } = render(<App />);

      expect(container.querySelector('.app')).toBeInTheDocument();
      expect(container.querySelector('.app-header')).toBeInTheDocument();
      expect(container.querySelector('.app-main')).toBeInTheDocument();
      expect(container.querySelector('.app-footer')).toBeInTheDocument();
    });

    // The start page has a header, a footer and a main of its own
    it('shows the start page without the header and the footer around the player', () => {
      const { container } = render(<App />);

      expect(container.querySelector('.app')).toBeInTheDocument();
      expect(screen.getAllByRole('main')).toHaveLength(1);
      expect(container.querySelector('.app-header')).not.toBeInTheDocument();
      expect(container.querySelector('.app-main')).not.toBeInTheDocument();
      expect(container.querySelector('.app-footer')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it.each(['/', '/dos'])('should have proper heading hierarchy at %s', (url) => {
      window.history.replaceState({}, '', url);
      render(<App />);
      const heading = screen.getByRole('heading', { name: 'DosKit' });
      expect(heading.tagName).toBe('H1');
    });

    it('should have alt text for images', () => {
      window.history.replaceState({}, '', '/dos');
      render(<App />);
      const logo = screen.getByAltText('DosKit Logo');
      expect(logo).toBeInTheDocument();
    });

    it.each(['/', '/dos'])('should have proper link attributes for security at %s', (url) => {
      window.history.replaceState({}, '', url);
      render(<App />);
      const links = screen.getAllByRole('link');

      links.forEach((link) => {
        if (link.getAttribute('target') === '_blank') {
          expect(link).toHaveAttribute('rel', 'noopener noreferrer');
        }
      });
    });
  });

  describe('About button', () => {
    it('is there only while a production is current', () => {
      window.history.replaceState({}, '', '/dos');
      const { unmount } = render(<App />);
      expect(screen.queryByRole('button', { name: 'About' })).not.toBeInTheDocument();
      unmount();

      window.history.replaceState({}, '', '/testapp');
      render(<App />);

      expect(screen.getByRole('button', { name: 'About' })).toBeInTheDocument();
    });

    it('opens the About panel for the current app, and closes it', async () => {
      window.history.replaceState({}, '', '/testapp');
      render(<App />);

      fireEvent.click(screen.getByRole('button', { name: 'About' }));
      const panel = screen.getByRole('dialog', { name: 'Test Application' });
      expect(await within(panel).findByText('A test DOS application')).toBeInTheDocument();

      fireEvent.click(within(panel).getByRole('button', { name: 'Close' }));
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      // The focus goes back to the button that opened it
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
  });

  describe('Browse button', () => {
    it.each(['/dos', '/testapp'])('is in the header at %s', (url) => {
      window.history.replaceState({}, '', url);
      render(<App />);

      const button = screen.getByRole('button', { name: 'Browse' });

      expect(button).toHaveClass('header-change-app-button');
      expect(button).not.toBeDisabled();
    });

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

    it('shows the production, its author and its year in the header', () => {
      window.history.replaceState({}, '', '/testapp');
      render(<App />);

      expect(screen.getByText('Test Application')).toBeInTheDocument();
      expect(screen.getByText('Test Author (1995)')).toBeInTheDocument();
    });

    it('shows no production in the header at the DOS prompt', () => {
      window.history.replaceState({}, '', '/dos');
      const { container } = render(<App />);

      expect(container.querySelector('.header-app-info')).not.toBeInTheDocument();
    });
  });

  describe("The running app's author and year", () => {
    it('shows the author alone for an app without a year', () => {
      window.history.replaceState({}, '', '/noyear');
      render(<App />);

      expect(screen.getByText('Test Author')).toBeInTheDocument();
    });

    it('shows the year alone for an app without an author', () => {
      window.history.replaceState({}, '', '/noauthor');
      render(<App />);

      expect(screen.getByText('1995')).toBeInTheDocument();
    });

    it('shows just the name for an app with neither', () => {
      window.history.replaceState({}, '', '/anonymous');
      render(<App />);

      const appInfo = screen.getByText('Anonymous').parentElement;
      expect(appInfo).toHaveTextContent(/^Anonymous$/);
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

  // What App shows instead of the selector: the start page, or the player
  describe('Selector visibility management', () => {
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
