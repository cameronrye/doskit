/**
 * Tests for UpdateNotification component
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UpdateNotification } from './UpdateNotification';

describe('UpdateNotification', () => {
  let mockRegistration: ServiceWorkerRegistration;
  let mockWaiting: ServiceWorker;
  let originalLocation: Location;

  beforeEach(() => {
    vi.clearAllMocks();

    // Save original location
    originalLocation = window.location;

    // Mock window.location.reload
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (window as any).location;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    window.location = { ...originalLocation, reload: vi.fn() } as any;

    // Mock ServiceWorker
    mockWaiting = {
      postMessage: vi.fn(),
      state: 'installed',
      scriptURL: 'http://localhost/sw.js',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
      onstatechange: null,
      onerror: null,
    } as unknown as ServiceWorker;

    // Mock ServiceWorkerRegistration
    mockRegistration = {
      waiting: mockWaiting,
      active: null,
      installing: null,
      scope: 'http://localhost/',
      updateViaCache: 'imports',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
      update: vi.fn(),
      unregister: vi.fn(),
      onupdatefound: null,
    } as unknown as ServiceWorkerRegistration;

    // Mock navigator.serviceWorker
    Object.defineProperty(navigator, 'serviceWorker', {
      value: {
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        controller: null,
        ready: Promise.resolve(mockRegistration),
        register: vi.fn(),
        getRegistration: vi.fn(),
        getRegistrations: vi.fn(),
      },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    // Restore original location
    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true,
      configurable: true,
    });
    vi.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('should not render when registration is null', () => {
      const { container } = render(<UpdateNotification registration={null} />);
      expect(container.querySelector('.update-notification')).not.toBeInTheDocument();
    });

    it('should render when registration is provided', async () => {
      render(<UpdateNotification registration={mockRegistration} />);
      
      await waitFor(() => {
        expect(screen.getByText('Update Available')).toBeInTheDocument();
      });
    });

    it('should display update message', async () => {
      render(<UpdateNotification registration={mockRegistration} />);
      
      await waitFor(() => {
        expect(screen.getByText(/A new version of DosKit is ready to install/i)).toBeInTheDocument();
      });
    });

    it('should render Update Now button', async () => {
      render(<UpdateNotification registration={mockRegistration} />);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Update Now/i })).toBeInTheDocument();
      });
    });

    it('should render Later button', async () => {
      render(<UpdateNotification registration={mockRegistration} />);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Later/i })).toBeInTheDocument();
      });
    });

    it('should render update icon', async () => {
      const { container } = render(<UpdateNotification registration={mockRegistration} />);
      
      await waitFor(() => {
        expect(container.querySelector('.update-notification-icon svg')).toBeInTheDocument();
      });
    });
  });

  describe('Update functionality', () => {
    it('should send SKIP_WAITING message when Update Now is clicked', async () => {
      render(<UpdateNotification registration={mockRegistration} />);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Update Now/i })).toBeInTheDocument();
      });

      const updateButton = screen.getByRole('button', { name: /Update Now/i });
      fireEvent.click(updateButton);

      await waitFor(() => {
        expect(mockWaiting.postMessage).toHaveBeenCalledWith({ type: 'SKIP_WAITING' });
      });
    });

    it('should add controllerchange event listener before sending SKIP_WAITING', async () => {
      const addEventListenerSpy = vi.spyOn(navigator.serviceWorker, 'addEventListener');
      
      render(<UpdateNotification registration={mockRegistration} />);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Update Now/i })).toBeInTheDocument();
      });

      const updateButton = screen.getByRole('button', { name: /Update Now/i });
      fireEvent.click(updateButton);

      await waitFor(() => {
        expect(addEventListenerSpy).toHaveBeenCalledWith(
          'controllerchange',
          expect.any(Function),
          { once: true }
        );
      });
    });

    it('should add controllerchange event listener when Update Now is clicked', () => {
      const addEventListenerSpy = vi.spyOn(navigator.serviceWorker, 'addEventListener');

      render(<UpdateNotification registration={mockRegistration} />);

      const updateButton = screen.getByRole('button', { name: /Update Now/i });
      fireEvent.click(updateButton);

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'controllerchange',
        expect.any(Function),
        expect.objectContaining({ once: true })
      );
    });

    it('should handle missing waiting service worker', async () => {
      const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const registrationWithoutWaiting = { ...mockRegistration, waiting: null };

      render(<UpdateNotification registration={registrationWithoutWaiting as unknown as ServiceWorkerRegistration} />);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Update Now/i })).toBeInTheDocument();
      });

      const updateButton = screen.getByRole('button', { name: /Update Now/i });
      fireEvent.click(updateButton);

      await waitFor(() => {
        expect(consoleWarn).toHaveBeenCalledWith(
          expect.stringContaining('No waiting service worker found')
        );
      });

      consoleWarn.mockRestore();
    });

    it('should handle postMessage errors gracefully', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      const errorMessage = 'Failed to post message';
      mockWaiting.postMessage = vi.fn().mockImplementation(() => {
        throw new Error(errorMessage);
      });

      render(<UpdateNotification registration={mockRegistration} />);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Update Now/i })).toBeInTheDocument();
      });

      const updateButton = screen.getByRole('button', { name: /Update Now/i });
      fireEvent.click(updateButton);

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith(
          expect.stringContaining('Error sending SKIP_WAITING message'),
          expect.any(Error)
        );
      });

      consoleError.mockRestore();
    });

    it('should reload on postMessage error as fallback', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      mockWaiting.postMessage = vi.fn().mockImplementation(() => {
        throw new Error('Failed to post message');
      });

      render(<UpdateNotification registration={mockRegistration} />);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Update Now/i })).toBeInTheDocument();
      });

      const updateButton = screen.getByRole('button', { name: /Update Now/i });
      fireEvent.click(updateButton);

      await waitFor(() => {
        expect(window.location.reload).toHaveBeenCalled();
      }, { timeout: 3000 });
    });

    it('should set up fallback timeout when Update Now is clicked', () => {
      vi.useFakeTimers();

      render(<UpdateNotification registration={mockRegistration} />);

      const updateButton = screen.getByRole('button', { name: /Update Now/i });
      fireEvent.click(updateButton);

      // Verify setTimeout was called for the fallback
      expect(vi.getTimerCount()).toBeGreaterThan(0);

      vi.useRealTimers();
    });
  });

  describe('Dismiss functionality', () => {
    it('should hide notification when Later button is clicked', () => {
      render(<UpdateNotification registration={mockRegistration} />);

      const laterButton = screen.getByRole('button', { name: /Later/i });
      fireEvent.click(laterButton);

      expect(screen.queryByText('Update Available')).not.toBeInTheDocument();
    });

    it('should call onDismiss callback when Later is clicked', () => {
      const onDismiss = vi.fn();
      render(<UpdateNotification registration={mockRegistration} onDismiss={onDismiss} />);

      const laterButton = screen.getByRole('button', { name: /Later/i });
      fireEvent.click(laterButton);

      expect(onDismiss).toHaveBeenCalledTimes(1);
    });

    it('should not call onDismiss if callback is not provided', () => {
      render(<UpdateNotification registration={mockRegistration} />);

      const laterButton = screen.getByRole('button', { name: /Later/i });

      // Should not throw error
      expect(() => fireEvent.click(laterButton)).not.toThrow();
    });
  });

  describe('State management', () => {
    it('should show notification when registration changes from null to valid', () => {
      const { rerender } = render(<UpdateNotification registration={null} />);

      expect(screen.queryByText('Update Available')).not.toBeInTheDocument();

      rerender(<UpdateNotification registration={mockRegistration} />);

      expect(screen.getByText('Update Available')).toBeInTheDocument();
    });

    it('should send SKIP_WAITING message when Update Now is clicked', () => {
      render(<UpdateNotification registration={mockRegistration} />);

      const updateButton = screen.getByRole('button', { name: /Update Now/i });
      fireEvent.click(updateButton);

      // Should send SKIP_WAITING message
      expect(mockRegistration.waiting!.postMessage).toHaveBeenCalledWith({ type: 'SKIP_WAITING' });
    });
  });
});

