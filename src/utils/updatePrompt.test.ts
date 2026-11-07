/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * Update Prompt Tests
 */

import { describe, it, expect, afterEach } from 'vitest';
import { act, fireEvent, screen } from '@testing-library/react';
import { showUpdateNotification } from './updatePrompt';

const registration = { waiting: null } as unknown as ServiceWorkerRegistration;

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
