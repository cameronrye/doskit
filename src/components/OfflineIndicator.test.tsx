/**
 * Tests for OfflineIndicator component
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
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
});
