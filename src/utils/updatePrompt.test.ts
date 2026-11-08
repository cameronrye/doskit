/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * Update Prompt Tests
 */

import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { act, fireEvent, screen, within } from '@testing-library/react';
import { showUpdateNotification } from './updatePrompt';

const registration = { waiting: null } as ServiceWorkerRegistration;

describe('showUpdateNotification', () => {
  // navigator.serviceWorker, which tells each tab when a new worker takes control of it
  let serviceWorker: EventTarget;
  const takeControl = () =>
    act(() => {
      serviceWorker.dispatchEvent(new Event('controllerchange'));
    });

  beforeEach(() => {
    serviceWorker = new EventTarget();
    Object.defineProperty(navigator, 'serviceWorker', { value: serviceWorker, configurable: true });
  });

  afterEach(() => {
    // Dismiss whatever is still on screen so tests stay independent
    for (const later of screen.queryAllByRole('button', { name: 'Later' })) {
      act(() => {
        fireEvent.click(later);
      });
    }
    // jsdom has no navigator.serviceWorker
    Reflect.deleteProperty(navigator, 'serviceWorker');
  });

  // Update Now there lets the new worker take over every tab, which keeps running the
  // version it loaded until it reloads
  describe('when another tab updates', () => {
    const originalLocation = window.location;

    afterEach(() => {
      Object.defineProperty(window, 'location', { value: originalLocation, configurable: true });
    });

    it('says so in the prompt this tab shows, and leaves the focus where it is', async () => {
      await act(async () => {
        showUpdateNotification(registration);
      });
      const later = screen.getByRole('button', { name: 'Later' });
      act(() => later.focus());

      takeControl();

      expect(screen.getAllByRole('alertdialog')).toHaveLength(1);
      const dialog = screen.getByRole('alertdialog', { name: 'Update Installed' });
      // Its new wording is announced
      expect(
        within(dialog)
          .getByText(/updated in another tab/)
          .closest('[aria-live]')
      ).toHaveAttribute('aria-live', 'polite');
      expect(screen.getByRole('button', { name: 'Reload' })).toBeInTheDocument();
      expect(later).toHaveFocus();
    });

    it('takes the focus to Later when it shows the prompt again', async () => {
      await act(async () => {
        showUpdateNotification(registration);
      });
      act(() => {
        fireEvent.click(screen.getByRole('button', { name: 'Later' }));
      });

      takeControl();

      expect(screen.getByRole('button', { name: 'Later' })).toHaveFocus();
    });

    it('shows the prompt again, though this tab put it off', async () => {
      await act(async () => {
        showUpdateNotification(registration);
      });
      act(() => {
        fireEvent.click(screen.getByRole('button', { name: 'Later' }));
      });

      takeControl();

      expect(screen.getByRole('alertdialog', { name: 'Update Installed' })).toBeInTheDocument();
    });

    it("does not take this tab's own Update Now for another tab's", async () => {
      const reload = vi.fn();
      Object.defineProperty(window, 'location', {
        value: { ...originalLocation, reload },
        configurable: true,
      });
      const waiting = { postMessage: vi.fn() } as unknown as ServiceWorker;
      await act(async () => {
        showUpdateNotification({ waiting } as ServiceWorkerRegistration);
      });
      act(() => {
        fireEvent.click(screen.getByRole('button', { name: 'Update Now' }));
      });

      takeControl();

      expect(reload).toHaveBeenCalledOnce();
      expect(screen.queryByRole('alertdialog', { name: 'Update Installed' })).toBeNull();
    });

    it('shows nothing when the first worker takes control of the page', async () => {
      // The first install's worker claims the open pages, which no worker controlled when
      // they loaded, so none of them was told of an update. Loaded afresh, as main.tsx loads
      // it into a page that has navigator.serviceWorker.
      vi.resetModules();
      await import('./updatePrompt');

      takeControl();

      expect(document.getElementById('update-notification-container')).toBeNull();
    });
  });

  it('shows a single prompt when an update is reported more than once', async () => {
    // Reported on load for a waiting worker, then again by a periodic update check
    await act(async () => {
      showUpdateNotification(registration);
      showUpdateNotification(registration);
    });

    expect(screen.getAllByText('Update Available')).toHaveLength(1);
  });

  it('keeps the keys pressed in it from js-dos, which takes every key that reaches window', async () => {
    // js-dos cancels each key it gets: the prompt's buttons could not be reached or
    // pressed from the keyboard, and the keys would be typed into DOS
    const reachedWindow = vi.fn();
    window.addEventListener('keydown', reachedWindow);
    window.addEventListener('keyup', reachedWindow);
    try {
      await act(async () => {
        showUpdateNotification(registration);
      });
      const later = screen.getByRole('button', { name: 'Later' });

      fireEvent.keyDown(later, { key: 'Tab' });
      fireEvent.keyUp(later, { key: 'Tab' });
      expect(reachedWindow).not.toHaveBeenCalled();
      // The prompt still gets them
      fireEvent.keyDown(later, { key: 'Escape' });
      expect(screen.queryByText('Update Available')).not.toBeInTheDocument();
      // Keys pressed anywhere else still reach js-dos
      fireEvent.keyDown(document.body, { key: 'a' });
      expect(reachedWindow).toHaveBeenCalledOnce();
    } finally {
      window.removeEventListener('keydown', reachedWindow);
      window.removeEventListener('keyup', reachedWindow);
    }
  });

  it('keeps from js-dos the release of a key that closed it', async () => {
    // Escape, or Enter on a button, closes the prompt as the key goes down, so the key comes
    // up on the page: js-dos would send DOS the release of a key it never had pressed
    const reachedWindow = vi.fn();
    window.addEventListener('keyup', reachedWindow);
    try {
      await act(async () => {
        showUpdateNotification(registration);
      });

      fireEvent.keyDown(screen.getByRole('button', { name: 'Later' }), {
        key: 'Escape',
        code: 'Escape',
      });
      expect(screen.queryByText('Update Available')).not.toBeInTheDocument();
      fireEvent.keyUp(document.body, { key: 'Escape', code: 'Escape' });
      expect(reachedWindow).not.toHaveBeenCalled();

      // Keys pressed on the page then still reach it, that one too
      fireEvent.keyDown(document.body, { key: 'Escape', code: 'Escape' });
      fireEvent.keyUp(document.body, { key: 'Escape', code: 'Escape' });
      expect(reachedWindow).toHaveBeenCalledOnce();
    } finally {
      window.removeEventListener('keyup', reachedWindow);
    }
  });

  // It takes the focus as it appears, maybe while someone holds a key in DOS: without its
  // release, DOSBox repeats the key without end
  it('lets the release of a key pressed in DOS before it appeared reach js-dos', async () => {
    const reachedWindow = vi.fn();
    window.addEventListener('keyup', reachedWindow);
    try {
      fireEvent.keyDown(document.body, { key: 'a', code: 'KeyA' });
      await act(async () => {
        showUpdateNotification(registration);
      });

      fireEvent.keyUp(screen.getByRole('button', { name: 'Later' }), { key: 'a', code: 'KeyA' });

      expect(reachedWindow).toHaveBeenCalledOnce();
    } finally {
      window.removeEventListener('keyup', reachedWindow);
    }
  });

  it('shows the prompt again after the previous one was dismissed', async () => {
    await act(async () => {
      showUpdateNotification(registration);
    });
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Later' }));
    });
    expect(screen.queryByText('Update Available')).not.toBeInTheDocument();

    await act(async () => {
      showUpdateNotification(registration);
    });

    expect(screen.getAllByText('Update Available')).toHaveLength(1);
  });
});
