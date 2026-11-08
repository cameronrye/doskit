/**
 * Tests for App component
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, render, screen, fireEvent, waitFor } from '@testing-library/react';
import { version as installedJsDosVersion } from 'js-dos/package.json';
import App from './App';
import type { DosApp } from './types/dos-app';

// Type definitions for test mocks
interface DosPlayerWithAppsProps {
  onReady?: () => void;
  onExit?: () => void;
  onAppChange?: (app: DosApp | null) => void;
  onSelectorVisibilityChange?: (visible: boolean) => void;
  onStatusChange?: (status: 'loading' | 'ready' | 'error') => void;
  showSelector?: boolean;
  requestedApp?: DosApp | null;
  selectorNotice?: string | null;
}

const { requests, describeRequest, keysHandledInPlayer } = vi.hoisted(() => ({
  /** The requestedApp App gave DosPlayerWithApps on each commit, oldest first */
  requests: [] as string[],
  /** How a requestedApp prop shows up: the app's id, 'none' or 'not passed' */
  describeRequest: (app: DosApp | null | undefined) =>
    app === undefined ? 'not passed' : (app?.id ?? 'none'),
  /** Keys the mock's own key handler got, as the selector's handler gets them */
  keysHandledInPlayer: [] as string[],
}));

interface OfflineIndicatorProps {
  onNetworkStatusChange?: (isOnline: boolean) => void;
}

interface WindowWithTestCallbacks extends Window {
  __dosCallbacks?: {
    onReady?: () => void;
    onExit?: () => void;
    onAppChange?: (app: DosApp | null) => void;
    onSelectorVisibilityChange?: (visible: boolean) => void;
  };
  __networkCallback?: (isOnline: boolean) => void;
}

// Create a mock app
const mockApp: DosApp = {
  id: 'test-app',
  name: 'Test Application',
  description: 'A test DOS application',
  author: 'Test Author',
  year: 1995,
  loadMethod: 'zip',
  dosboxConf: '[cpu]\ncore=auto',
  loader: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3])),
};

// Mock DosPlayerWithApps component
vi.mock('./components/DosPlayerWithApps', async () => {
  const { useEffect } = await import('react');
  return {
    DosPlayerWithApps: ({
      onReady,
      onExit,
      onAppChange,
      onSelectorVisibilityChange,
      onStatusChange,
      showSelector,
      requestedApp,
      selectorNotice,
    }: DosPlayerWithAppsProps) => {
      // Store callbacks in window for test access
      (window as WindowWithTestCallbacks).__dosCallbacks = {
        onReady,
        onExit,
        onAppChange,
        onSelectorVisibilityChange,
      };

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
          <button onClick={() => onStatusChange?.('error')}>Report Error</button>
          <button onClick={() => onAppChange?.(mockApp)}>Load App</button>
          <button onClick={() => onAppChange?.(null)}>Clear App</button>
          <button onClick={() => onSelectorVisibilityChange?.(true)}>Show Selector</button>
          <button onClick={() => onSelectorVisibilityChange?.(false)}>Hide Selector</button>
          <button onClick={() => onAppChange?.(requestedApp ?? null)}>Report Requested App</button>
          <div data-testid="selector-state">{showSelector ? 'visible' : 'hidden'}</div>
          <div data-testid="requested-app">{request}</div>
          {selectorNotice && <div data-testid="selector-notice">{selectorNotice}</div>}
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

/** Report an app as running, as DosPlayerWithApps does once it has loaded */
function reportApp(app: DosApp) {
  act(() => (window as WindowWithTestCallbacks).__dosCallbacks?.onAppChange?.(app));
}

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

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear window callbacks
    delete (window as WindowWithTestCallbacks).__dosCallbacks;
    delete (window as WindowWithTestCallbacks).__networkCallback;
    // jsdom keeps one URL and history for the whole file
    window.history.replaceState({}, '', '/');
    requests.length = 0;
    keysHandledInPlayer.length = 0;
  });

  describe('Keys and the running player', () => {
    // Stands in for js-dos, which sends every key that reaches window to DOS and cancels the
    // browser's own handling of it
    const keysAtWindow: string[] = [];
    const recordKey = (event: KeyboardEvent) => keysAtWindow.push(`${event.type} ${event.key}`);

    beforeEach(() => {
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
      const button = screen.getByRole('button', { name: 'Select Application' });

      fireEvent.keyDown(button, { key: 'Enter' });
      fireEvent.keyUp(button, { key: 'Enter' });
      fireEvent.keyDown(button, { key: 'Tab' });

      expect(keysAtWindow).toEqual([]);
    });

    it('still gives those keys to the key handlers inside the app', () => {
      render(<App />);

      fireEvent.keyDown(screen.getByText('Show Selector'), { key: 'ArrowRight' });

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

    // A key held in DOS while Change Application is clicked: without its release, DOSBox
    // repeats the key without end
    it('gives js-dos the release of a key pressed in the player, even on a control', () => {
      render(<App />);

      fireEvent.keyDown(screen.getByTestId('dos-screen'), { key: 'a', code: 'KeyA' });
      fireEvent.keyUp(screen.getByRole('button', { name: 'Select Application' }), {
        key: 'a',
        code: 'KeyA',
      });

      expect(keysAtWindow).toEqual(['keydown a', 'keyup a']);
    });

    // Escape closes the selector as it goes down, and the focus falls to the page
    it('keeps from js-dos the release of a key pressed on a control, once the focus is on the page', () => {
      render(<App />);

      fireEvent.keyDown(screen.getByRole('button', { name: 'Select Application' }), {
        key: 'Escape',
        code: 'Escape',
      });
      fireEvent.keyUp(document.body, { key: 'Escape', code: 'Escape' });

      expect(keysAtWindow).toEqual([]);
    });
  });

  describe('URL routing', () => {
    it('requests the app a deep link names from the first render', () => {
      window.history.replaceState({}, '', '/?app=stars');

      render(<App />);

      expect(requests[0]).toBe('stars');
      expect(screen.getByTestId('requested-app')).toHaveTextContent('stars');
      expect(screen.getByText('Starfield Effect')).toBeInTheDocument();
      expect(screen.getByTestId('selector-state')).toHaveTextContent('hidden');
      expect(document.title).toBe('Starfield Effect - DosKit');
    });

    it('requests no app and opens the selector after going back to the start page', async () => {
      window.history.pushState({}, '', '/?app=stars');
      render(<App />);

      await traverse('back');

      expect(screen.getByTestId('requested-app')).toHaveTextContent('none');
      expect(screen.getByTestId('selector-state')).toHaveTextContent('visible');
      expect(screen.queryByText('Starfield Effect')).not.toBeInTheDocument();
      expect(document.title).toBe('DosKit - Cross-Platform DOS Emulator');
    });

    it('requests the app that going forward lands on', async () => {
      window.history.pushState({}, '', '/?app=3drotate');
      window.history.back();
      await new Promise((resolve) => window.addEventListener('popstate', resolve, { once: true }));
      render(<App />);

      await traverse('forward');

      expect(screen.getByTestId('requested-app')).toHaveTextContent('3drotate');
      expect(screen.getByTestId('selector-state')).toHaveTextContent('hidden');
      expect(screen.getByText('3D Rotation Demo')).toBeInTheDocument();
      expect(document.title).toBe('3D Rotation Demo - DosKit');
    });

    it('adds no history entry when a deep-linked app reports in', () => {
      window.history.replaceState({}, '', '/?app=stars');
      render(<App />);
      const lengthBefore = window.history.length;

      fireEvent.click(screen.getByText('Report Requested App'));

      expect(window.location.search).toBe('?app=stars');
      expect(window.history.length).toBe(lengthBefore);
    });

    it('keeps the forward history when an app reached by going back reports in', async () => {
      window.history.pushState({}, '', '/?app=stars');
      window.history.pushState({}, '', '/?app=3drotate');
      render(<App />);
      await traverse('back');

      fireEvent.click(screen.getByText('Report Requested App'));
      await traverse('forward');

      expect(window.location.search).toBe('?app=3drotate');
      expect(screen.getByTestId('requested-app')).toHaveTextContent('3drotate');
    });

    it('rewrites a path-style deep link to ?app= without a new history entry', () => {
      window.history.replaceState({}, '', '/stars');
      const lengthBefore = window.history.length;

      render(<App />);

      expect(window.location.pathname + window.location.search).toBe('/?app=stars');
      expect(window.history.length).toBe(lengthBefore);
      expect(requests[0]).toBe('stars');
    });

    it('adds no history entry when a path-style deep link reports in', () => {
      window.history.replaceState({}, '', '/stars');
      render(<App />);
      const lengthBefore = window.history.length;

      fireEvent.click(screen.getByText('Report Requested App'));

      expect(window.history.length).toBe(lengthBefore);
    });

    it('rewrites other spellings of a deep link to the one the app uses', () => {
      window.history.replaceState({}, '', '/?app=Second-Reality');
      render(<App />);
      const lengthBefore = window.history.length;

      fireEvent.click(screen.getByText('Report Requested App'));

      expect(window.location.search).toBe('?app=secondreality');
      expect(window.history.length).toBe(lengthBefore);
    });

    it('rewrites a path-style entry that going back lands on', async () => {
      window.history.replaceState({}, '', '/stars');
      window.history.pushState({}, '', '/');
      render(<App />);

      await traverse('back');

      expect(window.location.pathname + window.location.search).toBe('/?app=stars');
      expect(screen.getByTestId('requested-app')).toHaveTextContent('stars');
    });

    it('tells the selector that a deep link named an unknown app', () => {
      window.history.replaceState({}, '', '/?app=bogus');
      const lengthBefore = window.history.length;

      render(<App />);

      // In the selector that opens with it, and nowhere else: a banner under it went unseen
      expect(screen.getByTestId('selector-notice')).toHaveTextContent(
        'Application "bogus" not found. Please select from available applications.'
      );
      expect(screen.getAllByText(/not found/)).toHaveLength(1);
      expect(screen.getByTestId('requested-app')).toHaveTextContent('none');
      expect(screen.getByTestId('selector-state')).toHaveTextContent('visible');
      // The unknown app is dropped from the URL without a new history entry
      expect(window.location.search).toBe('');
      expect(window.history.length).toBe(lengthBefore);
    });

    it.each([
      ['no safe characters', '/?app=%E2%9C%93'],
      ['over 100 characters', `/?app=${'a'.repeat(150)}`],
      ['an empty value', '/?app='],
    ])('drops an ?app= value with %s and says the link names no app', (_, url) => {
      window.history.replaceState({}, '', url);
      const lengthBefore = window.history.length;

      render(<App />);

      // The value is left out of the message
      expect(screen.getByTestId('selector-notice')).toHaveTextContent(
        /^Application not found\. Please select from available applications\.$/
      );
      expect(screen.getByTestId('requested-app')).toHaveTextContent('none');
      expect(screen.getByTestId('selector-state')).toHaveTextContent('visible');
      expect(window.location.search).toBe('');
      expect(window.history.length).toBe(lengthBefore);
    });

    it('tells the selector when going forward lands on an unknown app', async () => {
      window.history.pushState({}, '', '/?app=bogus');
      window.history.back();
      await new Promise((resolve) => window.addEventListener('popstate', resolve, { once: true }));
      render(<App />);
      expect(screen.queryByText(/not found/)).not.toBeInTheDocument();

      await traverse('forward');

      expect(screen.getByTestId('selector-notice')).toHaveTextContent(
        /Application "bogus" not found/
      );
      expect(screen.getByTestId('requested-app')).toHaveTextContent('none');
      expect(screen.getByTestId('selector-state')).toHaveTextContent('visible');
      expect(window.location.search).toBe('');
    });

    it('stops the running app when going back lands on an unknown app', async () => {
      window.history.replaceState({}, '', '/?app=bogus');
      window.history.pushState({}, '', '/?app=stars');
      render(<App />);

      await traverse('back');

      expect(screen.getByTestId('selector-notice')).toHaveTextContent(
        /Application "bogus" not found/
      );
      expect(screen.getByTestId('requested-app')).toHaveTextContent('none');
      expect(screen.queryByText('Starfield Effect')).not.toBeInTheDocument();
    });

    it('drops the notice once an app loads', () => {
      window.history.replaceState({}, '', '/?app=bogus');
      render(<App />);
      expect(screen.getByTestId('selector-notice')).toBeInTheDocument();

      fireEvent.click(screen.getByText('Load App'));

      expect(screen.queryByText(/not found/)).not.toBeInTheDocument();
    });

    it('drops the notice once the selector closes, so it does not come back with it', () => {
      window.history.replaceState({}, '', '/?app=bogus');
      render(<App />);

      fireEvent.click(screen.getByText('Hide Selector'));
      fireEvent.click(screen.getByText('Select Application'));

      expect(screen.getByTestId('selector-state')).toHaveTextContent('visible');
      expect(screen.queryByText(/not found/)).not.toBeInTheDocument();
    });

    it('records an app picked right after going back in the URL', async () => {
      window.history.pushState({}, '', '/?app=stars');
      render(<App />);
      await traverse('back');

      fireEvent.click(screen.getByText('Load App'));

      expect(window.location.search).toBe('?app=testapp');
    });
  });

  describe('Rendering', () => {
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

    it('should render Select Application button initially', () => {
      render(<App />);
      expect(screen.getByRole('button', { name: /Select Application/i })).toBeInTheDocument();
    });
  });

  describe('Status display', () => {
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
      const { container } = render(<App />);

      expect(container.querySelector('.app')).toBeInTheDocument();
      expect(container.querySelector('.app-header')).toBeInTheDocument();
      expect(container.querySelector('.app-main')).toBeInTheDocument();
      expect(container.querySelector('.app-footer')).toBeInTheDocument();
    });

    it('should apply correct CSS classes', () => {
      const { container } = render(<App />);

      const header = container.querySelector('.app-header');
      expect(header).toBeInTheDocument();

      const main = container.querySelector('.app-main');
      expect(main).toBeInTheDocument();

      const footer = container.querySelector('.app-footer');
      expect(footer).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      render(<App />);
      const heading = screen.getByRole('heading', { name: 'DosKit' });
      expect(heading.tagName).toBe('H1');
    });

    it('should have alt text for images', () => {
      render(<App />);
      const logo = screen.getByAltText('DosKit Logo');
      expect(logo).toBeInTheDocument();
    });

    it('should have proper link attributes for security', () => {
      render(<App />);
      const links = screen.getAllByRole('link');

      links.forEach((link) => {
        if (link.getAttribute('target') === '_blank') {
          expect(link).toHaveAttribute('rel', 'noopener noreferrer');
        }
      });
    });
  });

  describe('Change Application Button', () => {
    it('should render the change application button', () => {
      render(<App />);
      const button = screen.getByRole('button', { name: /Select Application/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveClass('header-change-app-button');
    });

    it('should have correct button text when no app is selected', () => {
      render(<App />);
      const button = screen.getByRole('button', { name: /Select Application/i });
      expect(button).toHaveTextContent('Select Application');
    });

    it('should be clickable and not disabled', () => {
      render(<App />);
      const button = screen.getByRole('button', { name: /Select Application/i });
      expect(button).not.toBeDisabled();

      // Verify the button can be clicked without errors
      expect(() => fireEvent.click(button)).not.toThrow();
    });

    it('should call handleChangeAppClick when clicked', async () => {
      render(<App />);
      const button = screen.getByRole('button', { name: /Select Application/i });

      fireEvent.click(button);

      await waitFor(() => {
        const selectorState = screen.getByTestId('selector-state');
        expect(selectorState).toHaveTextContent('visible');
      });
    });

    it('should change button text when app is loaded', async () => {
      render(<App />);

      const loadAppButton = screen.getByText('Load App');
      fireEvent.click(loadAppButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Change Application/i })).toBeInTheDocument();
      });
    });

    it('should show app name in header when app is loaded', async () => {
      render(<App />);

      const loadAppButton = screen.getByText('Load App');
      fireEvent.click(loadAppButton);

      await waitFor(() => {
        expect(screen.getByText('Test Application')).toBeInTheDocument();
      });
    });

    it('should show app metadata in header when app is loaded', async () => {
      render(<App />);

      const loadAppButton = screen.getByText('Load App');
      fireEvent.click(loadAppButton);

      await waitFor(() => {
        expect(screen.getByText(/Test Author \(1995\)/i)).toBeInTheDocument();
      });
    });

    it('should hide app info when app is cleared', async () => {
      render(<App />);

      const loadAppButton = screen.getByText('Load App');
      fireEvent.click(loadAppButton);

      await waitFor(() => {
        expect(screen.getByText('Test Application')).toBeInTheDocument();
      });

      const clearAppButton = screen.getByText('Clear App');
      fireEvent.click(clearAppButton);

      await waitFor(() => {
        expect(screen.queryByText('Test Application')).not.toBeInTheDocument();
      });
    });

    it('should revert button text when app is cleared', async () => {
      render(<App />);

      const loadAppButton = screen.getByText('Load App');
      fireEvent.click(loadAppButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Change Application/i })).toBeInTheDocument();
      });

      const clearAppButton = screen.getByText('Clear App');
      fireEvent.click(clearAppButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Select Application/i })).toBeInTheDocument();
      });
    });
  });

  describe("The running app's author and year", () => {
    it('shows the author alone for an app without a year', () => {
      render(<App />);

      reportApp({ ...mockApp, year: undefined });

      expect(screen.getByText('Test Author')).toBeInTheDocument();
    });

    it('shows the year alone for an app without an author', () => {
      render(<App />);

      reportApp({ ...mockApp, author: undefined });

      expect(screen.getByText('1995')).toBeInTheDocument();
    });

    it('shows just the name for an app with neither', () => {
      render(<App />);

      reportApp({ ...mockApp, author: undefined, year: undefined });

      const appInfo = screen.getByText('Test Application').parentElement;
      expect(appInfo).toHaveTextContent(/^Test Application$/);
    });
  });

  describe('Leaving the page', () => {
    const tracker: DosApp = { ...mockApp, id: 'tracker', warnBeforeLeaving: true };

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

    /** Report an app as running, its player ready, as DosPlayerWithApps does */
    function runApp(app: DosApp) {
      reportApp(app);
      fireEvent.click(screen.getByText('Report Ready'));
    }

    it('asks before the page goes while an app that warns about it runs', () => {
      render(<App />);

      runApp(tracker);

      expect(leavePage()).toEqual(asked);
    });

    // Nothing has run yet, or nothing runs: nothing can be lost
    it.each([
      ['downloads, or its emulator starts', 'Report Loading'],
      ['failed to load or start', 'Report Error'],
    ])('lets the page go while that app %s', (_, report) => {
      render(<App />);
      runApp(tracker);

      fireEvent.click(screen.getByText(report));

      expect(leavePage()).toEqual(notAsked);
    });

    it('lets the page go while an app runs that does not warn about it', () => {
      render(<App />);

      runApp(mockApp);

      expect(leavePage()).toEqual(notAsked);
    });

    it('stops asking once another app replaces the one that warns', () => {
      render(<App />);
      runApp(tracker);

      runApp({ ...mockApp, id: 'another-app' });

      expect(leavePage()).toEqual(notAsked);
    });

    it('stops asking once the default DOS prompt replaces the app that warns', () => {
      render(<App />);
      runApp(tracker);

      act(() => (window as WindowWithTestCallbacks).__dosCallbacks?.onAppChange?.(null));

      expect(leavePage()).toEqual(notAsked);
    });
  });

  describe('Selector visibility management', () => {
    it('should update selector visibility when changed', async () => {
      render(<App />);

      const hideButton = screen.getByText('Hide Selector');
      fireEvent.click(hideButton);

      await waitFor(() => {
        const selectorState = screen.getByTestId('selector-state');
        expect(selectorState).toHaveTextContent('hidden');
      });
    });

    it('should show selector when visibility is set to true', async () => {
      render(<App />);

      const hideButton = screen.getByText('Hide Selector');
      fireEvent.click(hideButton);

      await waitFor(() => {
        const selectorState = screen.getByTestId('selector-state');
        expect(selectorState).toHaveTextContent('hidden');
      });

      const showButton = screen.getByText('Show Selector');
      fireEvent.click(showButton);

      await waitFor(() => {
        const selectorState = screen.getByTestId('selector-state');
        expect(selectorState).toHaveTextContent('visible');
      });
    });
  });
});
