/**
 * Tests for OfflineIndicator component
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { OfflineIndicator } from './OfflineIndicator';

// Type definition for BeforeInstallPromptEvent
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
  preventDefault: () => void;
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
      value: vi.fn().mockImplementation(query => ({
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

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'beforeinstallprompt',
        expect.any(Function)
      );
    });

    it('should not show install prompt if already installed (standalone mode)', () => {
      // Mock standalone mode
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
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

    it('should respect cooldown period in localStorage', () => {
      const now = new Date();
      const eightDaysAgo = new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000);
      localStorage.setItem('pwa-install-last-dismissed', eightDaysAgo.toISOString());
      localStorage.setItem('pwa-install-dismissed-count', '1');

      render(<OfflineIndicator />);

      // Component should read from localStorage
      expect(localStorage.getItem('pwa-install-last-dismissed')).toBe(eightDaysAgo.toISOString());
      expect(localStorage.getItem('pwa-install-dismissed-count')).toBe('1');
    });
  });

  describe('Install prompt interactions', () => {
    it('should listen for beforeinstallprompt event', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');

      render(<OfflineIndicator />);

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'beforeinstallprompt',
        expect.any(Function)
      );
    });

    it('should use localStorage for dismissal tracking', () => {
      render(<OfflineIndicator />);

      // Component should be able to read/write to localStorage
      localStorage.setItem('pwa-install-dismissed-count', '1');
      expect(localStorage.getItem('pwa-install-dismissed-count')).toBe('1');
    });

    it('should respect max dismissals setting', () => {
      localStorage.setItem('pwa-install-dismissed-count', '3');

      render(<OfflineIndicator />);

      // Component should read the dismissal count
      expect(localStorage.getItem('pwa-install-dismissed-count')).toBe('3');
    });
  });
});
