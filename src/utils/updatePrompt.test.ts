/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * Update Prompt Tests
 */

import { describe, it, expect, afterEach, vi } from 'vitest';
import { act, fireEvent, screen } from '@testing-library/react';
import { showUpdateNotification } from './updatePrompt';

const registration = { waiting: null } as ServiceWorkerRegistration;

describe('showUpdateNotification', () => {
  afterEach(() => {
    // Dismiss whatever is still on screen so tests stay independent
    for (const later of screen.queryAllByRole('button', { name: 'Later' })) {
      act(() => {
        fireEvent.click(later);
      });
    }
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
