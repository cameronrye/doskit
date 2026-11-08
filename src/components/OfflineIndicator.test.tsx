/**
 * Tests for OfflineIndicator component
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act, cleanup } from '@testing-library/react';
import { OfflineIndicator } from './OfflineIndicator';
import { PWA_CONFIG } from '../constants/app';

// Type definition for BeforeInstallPromptEvent
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
  preventDefault: () => void;
}

/** Fire the browser's beforeinstallprompt, then wait out the delay before the prompt shows */
function offerInstall(outcome: 'accepted' | 'dismissed' = 'accepted') {
  const event = new Event('beforeinstallprompt') as BeforeInstallPromptEvent;
  event.prompt = vi.fn().mockResolvedValue(undefined);
  event.userChoice = Promise.resolve({ outcome });
  fireEvent(window, event);
  act(() => {
    vi.advanceTimersByTime(PWA_CONFIG.INSTALL_PROMPT_DELAY);
  });
}

describe('OfflineIndicator', () => {
  let originalNavigator: Navigator;

  beforeEach(() => {
    vi.clearAllMocks();

    // Save originals
    originalNavigator = window.navigator;

    // Clear localStorage
    localStorage.clear();

    // Mock navigator.onLine
    Object.defineProperty(window.navigator, 'onLine', {
      writable: true,
      value: true,
    });

    // Mock matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  afterEach(() => {
    // Restore originals
    Object.defineProperty(window, 'navigator', {
      value: originalNavigator,
      writable: true,
      configurable: true,
    });
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('Online/Offline status', () => {
    it('should not show offline message when online', () => {
      render(<OfflineIndicator />);
      expect(screen.queryByText(/You're offline/i)).not.toBeInTheDocument();
    });

    it('does not announce "Back online" when the page loads while online', () => {
      render(<OfflineIndicator />);
      expect(screen.queryByText('Back online')).not.toBeInTheDocument();
    });

    it('announces "Back online" after reconnecting, then removes it', () => {
      vi.useFakeTimers();
      try {
        render(<OfflineIndicator />);

        Object.defineProperty(window.navigator, 'onLine', { value: false, writable: true });
        fireEvent(window, new Event('offline'));
        Object.defineProperty(window.navigator, 'onLine', { value: true, writable: true });
        fireEvent(window, new Event('online'));

        expect(screen.getByText('Back online')).toBeInTheDocument();

        // Must leave the DOM on its own: with prefers-reduced-motion the CSS
        // fade-out animation is disabled and would otherwise never hide it
        act(() => {
          vi.advanceTimersByTime(5000);
        });
        expect(screen.queryByText('Back online')).not.toBeInTheDocument();
      } finally {
        vi.useRealTimers();
      }
    });

    it('should show offline message when offline event fires', async () => {
      render(<OfflineIndicator />);

      // Simulate going offline
      Object.defineProperty(window.navigator, 'onLine', { value: false, writable: true });
      fireEvent(window, new Event('offline'));

      await waitFor(() => {
        expect(screen.getByText(/You're offline/i)).toBeInTheDocument();
      });
    });

    it('should hide offline message when online event fires', async () => {
      render(<OfflineIndicator />);

      // Go offline
      Object.defineProperty(window.navigator, 'onLine', { value: false, writable: true });
      fireEvent(window, new Event('offline'));

      await waitFor(() => {
        expect(screen.getByText(/You're offline/i)).toBeInTheDocument();
      });

      // Go back online
      Object.defineProperty(window.navigator, 'onLine', { value: true, writable: true });
      fireEvent(window, new Event('online'));

      await waitFor(() => {
        expect(screen.queryByText(/You're offline/i)).not.toBeInTheDocument();
      });
    });

    it('should call onNetworkStatusChange when going offline', async () => {
      const onNetworkStatusChange = vi.fn();
      render(<OfflineIndicator onNetworkStatusChange={onNetworkStatusChange} />);

      Object.defineProperty(window.navigator, 'onLine', { value: false, writable: true });
      fireEvent(window, new Event('offline'));

      await waitFor(() => {
        expect(onNetworkStatusChange).toHaveBeenCalledWith(false);
      });
    });

    it('should call onNetworkStatusChange when going online', async () => {
      const onNetworkStatusChange = vi.fn();
      render(<OfflineIndicator onNetworkStatusChange={onNetworkStatusChange} />);

      // Go offline first
      Object.defineProperty(window.navigator, 'onLine', { value: false, writable: true });
      fireEvent(window, new Event('offline'));

      await waitFor(() => {
        expect(onNetworkStatusChange).toHaveBeenCalledWith(false);
      });

      onNetworkStatusChange.mockClear();

      // Go back online
      Object.defineProperty(window.navigator, 'onLine', { value: true, writable: true });
      fireEvent(window, new Event('online'));

      await waitFor(() => {
        expect(onNetworkStatusChange).toHaveBeenCalledWith(true);
      });
    });

    it('should allow closing offline message', async () => {
      render(<OfflineIndicator />);

      Object.defineProperty(window.navigator, 'onLine', { value: false, writable: true });
      fireEvent(window, new Event('offline'));

      await waitFor(() => {
        expect(screen.getByText(/You're offline/i)).toBeInTheDocument();
      });

      const closeButton = screen.getByRole('button', { name: /Close offline message/i });
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByText(/You're offline/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('PWA install prompt', () => {
    it('should not show install prompt initially', () => {
      render(<OfflineIndicator />);
      expect(screen.queryByText(/Install DosKit/i)).not.toBeInTheDocument();
    });

    it('should capture beforeinstallprompt event', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');

      render(<OfflineIndicator />);

      expect(addEventListenerSpy).toHaveBeenCalledWith('beforeinstallprompt', expect.any(Function));
    });

    it('should not show install prompt if already installed (standalone mode)', () => {
      // Mock standalone mode
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation((query) => ({
          matches: query === '(display-mode: standalone)',
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      vi.useFakeTimers();

      render(<OfflineIndicator />);

      const event = new Event('beforeinstallprompt') as BeforeInstallPromptEvent;
      event.prompt = vi.fn();
      event.userChoice = Promise.resolve({ outcome: 'accepted' as const });
      event.preventDefault = vi.fn();

      fireEvent(window, event);
      vi.advanceTimersByTime(5000);

      expect(screen.queryByText(/Install DosKit/i)).not.toBeInTheDocument();

      vi.useRealTimers();
    });

    it('should not show install prompt if permanently dismissed', async () => {
      localStorage.setItem('pwa-install-dismissed', 'permanent');

      vi.useFakeTimers();

      render(<OfflineIndicator />);

      const event = new Event('beforeinstallprompt') as BeforeInstallPromptEvent;
      event.prompt = vi.fn();
      event.userChoice = Promise.resolve({ outcome: 'accepted' as const });
      event.preventDefault = vi.fn();

      fireEvent(window, event);
      vi.advanceTimersByTime(5000);

      expect(screen.queryByText(/Install DosKit/i)).not.toBeInTheDocument();

      vi.useRealTimers();
    });

    it('should not show install prompt if dismissed too many times', async () => {
      localStorage.setItem('pwa-install-dismissed-count', '3');

      vi.useFakeTimers();

      render(<OfflineIndicator />);

      const event = new Event('beforeinstallprompt') as BeforeInstallPromptEvent;
      event.prompt = vi.fn();
      event.userChoice = Promise.resolve({ outcome: 'accepted' as const });
      event.preventDefault = vi.fn();

      fireEvent(window, event);
      vi.advanceTimersByTime(5000);

      expect(screen.queryByText(/Install DosKit/i)).not.toBeInTheDocument();

      vi.useRealTimers();
    });

    it('should not show install prompt if in cooldown period', async () => {
      const now = new Date();
      const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
      localStorage.setItem('pwa-install-last-dismissed', twoDaysAgo.toISOString());

      vi.useFakeTimers();

      render(<OfflineIndicator />);

      const event = new Event('beforeinstallprompt') as BeforeInstallPromptEvent;
      event.prompt = vi.fn();
      event.userChoice = Promise.resolve({ outcome: 'accepted' as const });
      event.preventDefault = vi.fn();

      fireEvent(window, event);
      vi.advanceTimersByTime(5000);

      expect(screen.queryByText(/Install DosKit/i)).not.toBeInTheDocument();

      vi.useRealTimers();
    });
  });

  describe('Install prompt interactions', () => {
    it('should listen for beforeinstallprompt event', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');

      render(<OfflineIndicator />);

      expect(addEventListenerSpy).toHaveBeenCalledWith('beforeinstallprompt', expect.any(Function));
    });
  });

  describe('Dismissal tracking', () => {
    beforeEach(() => {
      vi.useFakeTimers({ now: new Date('2026-03-01T12:00:00.000Z') });
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('offers the install again once the cooldown has passed', () => {
      localStorage.setItem('pwa-install-dismissed-count', '1');
      localStorage.setItem('pwa-install-last-dismissed', '2026-02-21T12:00:00.000Z'); // 8 days ago
      render(<OfflineIndicator />);

      offerInstall();

      expect(screen.getByText('Install DosKit')).toBeInTheDocument();
    });

    it('records when the prompt was dismissed and how often', () => {
      localStorage.setItem('pwa-install-dismissed-count', '1');
      localStorage.setItem('pwa-install-last-dismissed', '2026-02-01T12:00:00.000Z');
      render(<OfflineIndicator />);
      offerInstall();

      vi.setSystemTime(new Date('2026-03-01T12:30:00.000Z'));
      fireEvent.click(screen.getByRole('button', { name: 'Not now' }));

      expect(screen.queryByText('Install DosKit')).not.toBeInTheDocument();
      expect(localStorage.getItem('pwa-install-dismissed-count')).toBe('2');
      expect(localStorage.getItem('pwa-install-last-dismissed')).toBe('2026-03-01T12:30:00.000Z');
    });

    it('counts declining the browser install dialog as a dismissal', async () => {
      render(<OfflineIndicator />);
      offerInstall('dismissed');

      vi.setSystemTime(new Date('2026-03-01T12:30:00.000Z'));
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Install' }));
      });

      expect(screen.queryByText('Install DosKit')).not.toBeInTheDocument();
      expect(localStorage.getItem('pwa-install-dismissed-count')).toBe('1');
      expect(localStorage.getItem('pwa-install-last-dismissed')).toBe('2026-03-01T12:30:00.000Z');
    });

    it('forgets past dismissals when the user installs from the prompt', async () => {
      localStorage.setItem('pwa-install-dismissed-count', '1');
      localStorage.setItem('pwa-install-last-dismissed', '2026-02-01T12:00:00.000Z');
      render(<OfflineIndicator />);
      offerInstall('accepted');

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Install' }));
      });

      expect(localStorage.getItem('pwa-install-dismissed-count')).toBeNull();
      expect(localStorage.getItem('pwa-install-last-dismissed')).toBeNull();
    });

    it('forgets past dismissals once the app is installed', () => {
      localStorage.setItem('pwa-install-dismissed', 'permanent');
      localStorage.setItem('pwa-install-dismissed-count', '3');
      localStorage.setItem('pwa-install-last-dismissed', '2026-02-01T12:00:00.000Z');
      render(<OfflineIndicator />);

      fireEvent(window, new Event('appinstalled'));

      expect(localStorage.getItem('pwa-install-dismissed')).toBeNull();
      expect(localStorage.getItem('pwa-install-dismissed-count')).toBeNull();
      expect(localStorage.getItem('pwa-install-last-dismissed')).toBeNull();
    });
  });

  describe('in a production build', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.stubEnv('DEV', false);
      vi.resetModules();
    });

    afterEach(() => {
      vi.unstubAllEnvs();
      vi.useRealTimers();
    });

    /** The component as a production build has it: its logger keeps to warnings and errors */
    const importForProduction = async () => (await import('./OfflineIndicator')).OfflineIndicator;

    /** Everything logged below warnings, as one string per call */
    function captureInformation() {
      const lines: string[] = [];
      for (const method of ['log', 'info', 'debug'] as const) {
        vi.spyOn(console, method).mockImplementation((...args: unknown[]) => {
          lines.push(args.join(' '));
        });
      }
      return lines;
    }

    it('logs nothing below warnings when the app is installed from the prompt', async () => {
      const Indicator = await importForProduction();
      const lines = captureInformation();
      render(<Indicator />);

      offerInstall('accepted');
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Install' }));
      });
      offerInstall('accepted');
      fireEvent(window, new Event('appinstalled'));

      expect(lines).toEqual([]);
    });

    it('logs nothing below warnings when the prompt is turned down for good', async () => {
      localStorage.setItem(
        'pwa-install-dismissed-count',
        String(PWA_CONFIG.MAX_INSTALL_DISMISSALS - 2)
      );
      const Indicator = await importForProduction();
      const lines = captureInformation();
      render(<Indicator />);

      offerInstall('dismissed');
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Install' }));
      });
      expect(localStorage.getItem('pwa-install-dismissed-count')).toBe(
        String(PWA_CONFIG.MAX_INSTALL_DISMISSALS - 1)
      );
      localStorage.removeItem('pwa-install-last-dismissed');
      cleanup();
      render(<Indicator />);
      offerInstall();
      fireEvent.click(screen.getByRole('button', { name: 'Not now' }));

      expect(localStorage.getItem('pwa-install-dismissed')).toBe('permanent');
      expect(lines).toEqual([]);
    });

    it('still reports an install dialog that fails to open', async () => {
      const Indicator = await importForProduction();
      const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
      render(<Indicator />);
      const event = new Event('beforeinstallprompt') as BeforeInstallPromptEvent;
      event.prompt = vi.fn().mockRejectedValue(new Error('prompt() failed'));
      event.userChoice = Promise.resolve({ outcome: 'accepted' });
      fireEvent(window, event);
      act(() => {
        vi.advanceTimersByTime(PWA_CONFIG.INSTALL_PROMPT_DELAY);
      });

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Install' }));
      });

      expect(errors).toHaveBeenCalledWith(
        expect.stringContaining('Error showing install prompt'),
        expect.any(Error)
      );
    });
  });

  describe('when the browser refuses storage', () => {
    const originalStorage = Object.getOwnPropertyDescriptor(window, 'localStorage')!;
    const uncaughtError = vi.fn();

    beforeEach(() => {
      vi.useFakeTimers();
      window.addEventListener('error', uncaughtError);
    });

    afterEach(() => {
      window.removeEventListener('error', uncaughtError);
      Object.defineProperty(window, 'localStorage', originalStorage);
      vi.useRealTimers();
    });

    /** Site data is blocked: even reading window.localStorage throws */
    const blockStorage = () =>
      Object.defineProperty(window, 'localStorage', {
        configurable: true,
        get() {
          throw new DOMException('Access is denied for this document.', 'SecurityError');
        },
      });

    /** Storage is full: reads work, writes throw */
    const fillStorage = () => {
      const storage = localStorage;
      Object.defineProperty(window, 'localStorage', {
        configurable: true,
        value: {
          getItem: (key: string) => storage.getItem(key),
          setItem() {
            throw new DOMException('The quota has been exceeded.', 'QuotaExceededError');
          },
          removeItem: (key: string) => storage.removeItem(key),
        },
      });
    };

    it('still offers to install the app when site data is blocked', () => {
      blockStorage();
      render(<OfflineIndicator />);

      offerInstall();

      expect(screen.getByText('Install DosKit')).toBeInTheDocument();
    });

    it('hides the prompt on "Not now" when the dismissal cannot be saved', () => {
      fillStorage();
      render(<OfflineIndicator />);
      offerInstall();

      fireEvent.click(screen.getByRole('button', { name: 'Not now' }));

      expect(screen.queryByText('Install DosKit')).not.toBeInTheDocument();
      expect(uncaughtError).not.toHaveBeenCalled();
    });

    it('reports no error when the app is installed while site data is blocked', () => {
      blockStorage();
      render(<OfflineIndicator />);

      fireEvent(window, new Event('appinstalled'));

      expect(uncaughtError).not.toHaveBeenCalled();
    });
  });
});
