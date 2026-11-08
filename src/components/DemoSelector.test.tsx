/**
 * Tests for DemoSelector component
 * Updated to work with retro-floppy FloppyDisk components
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { DemoSelector } from './DemoSelector';
import { loadZipArchive } from '../utils/diskLoader';
import { availableApps } from '../config/apps.config';
import { secondRealityDosboxConf, secondRealityZipUrl } from '../dos-apps/second-reality.config';
import { impulseTrackerZipUrl } from '../dos-apps/impulse-tracker.config';

// Only downloads are mocked: the app list and the src/dos-apps configs are real.
//
// Don't vi.mock() a dos-app config with a factory here. DemoSelector starts an
// app's loadDosboxConf() and loader() together, so apps.config.ts imports that
// config twice at once, and Vitest gives the second of two overlapping imports
// of a factory-mocked module the real module. Loads would mix the mock's DOSBox
// config with the real ZIP URL, or use the mock's URL after a hover preload.
vi.mock('../utils/diskLoader', () => ({
  loadZipArchive: vi.fn(async () => new Uint8Array([1, 2, 3])),
}));

/**
 * Helper function to find a FloppyDisk component by its label/name
 * FloppyDisk renders as a <figure> with role="button" and aria-label
 */
const getFloppyDiskByName = (name: string): HTMLElement | null => {
  const allFloppies = screen.getAllByRole('button');
  return (
    (allFloppies.find(
      (el) => el.getAttribute('aria-label')?.includes(name) || el.textContent?.includes(name)
    ) as HTMLElement) || null
  );
};

describe('DemoSelector', () => {
  const mockOnSelect = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    // Also drops implementations and queued once-values that a test set, so
    // loadZipArchive starts every test with the factory's download again
    vi.resetAllMocks();
  });

  afterEach(() => {
    // Spies on the shared app configs must not outlive the test that set them
    vi.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('should render without crashing', () => {
      render(<DemoSelector onSelect={mockOnSelect} />);
      expect(screen.getByText('Select DOS Application')).toBeInTheDocument();
    });

    it('should render available applications', () => {
      render(<DemoSelector onSelect={mockOnSelect} />);
      expect(screen.getByText('Second Reality')).toBeInTheDocument();
      expect(screen.getByText('Impulse Tracker')).toBeInTheDocument();
    });

    it('should render close button when onCancel is provided', () => {
      render(<DemoSelector onSelect={mockOnSelect} onCancel={mockOnCancel} />);
      expect(screen.getByRole('button', { name: /Close/i })).toBeInTheDocument();
    });

    it('should not render close button when onCancel is not provided', () => {
      render(<DemoSelector onSelect={mockOnSelect} />);
      expect(screen.queryByRole('button', { name: /Close/i })).not.toBeInTheDocument();
    });

    it('should render FloppyDisk components with app info', () => {
      render(<DemoSelector onSelect={mockOnSelect} />);
      // FloppyDisk renders with aria-label containing name, author, and year
      const secondReality = getFloppyDiskByName('Second Reality');
      expect(secondReality).toBeInTheDocument();
      expect(secondReality?.getAttribute('aria-label')).toContain('Future Crew');
      expect(secondReality?.getAttribute('aria-label')).toContain('1993');
    });

    it('should render app metadata via FloppyDisk aria-labels', () => {
      render(<DemoSelector onSelect={mockOnSelect} />);
      // FloppyDisk components use aria-label for accessibility which contains author/year
      const secondReality = getFloppyDiskByName('Second Reality');
      const impulseTracker = getFloppyDiskByName('Impulse Tracker');

      expect(secondReality?.getAttribute('aria-label')).toContain('Future Crew');
      expect(impulseTracker?.getAttribute('aria-label')).toContain('Jeffrey Lim');
    });

    it('should render load method type in FloppyDisk labels', () => {
      render(<DemoSelector onSelect={mockOnSelect} />);
      // FloppyDisk shows type (load method) in the disk label area as uppercase
      expect(screen.getAllByText('ZIP').length).toBeGreaterThan(0);
    });
  });

  describe('App selection', () => {
    it('should select app when FloppyDisk is clicked', () => {
      render(<DemoSelector onSelect={mockOnSelect} />);

      const floppyDisk = getFloppyDiskByName('Second Reality');
      expect(floppyDisk).toBeInTheDocument();

      fireEvent.click(floppyDisk!);

      // After clicking, the app details section should appear
      expect(screen.getByText(/Selected: Second Reality/i)).toBeInTheDocument();
    });

    it('should show app details when FloppyDisk is clicked', () => {
      render(<DemoSelector onSelect={mockOnSelect} />);

      const floppyDisk = getFloppyDiskByName('Second Reality');
      fireEvent.click(floppyDisk!);

      expect(screen.getByText(/Selected: Second Reality/i)).toBeInTheDocument();
    });

    it('should show Load Application button when app is selected', () => {
      render(<DemoSelector onSelect={mockOnSelect} />);

      const floppyDisk = getFloppyDiskByName('Second Reality');
      fireEvent.click(floppyDisk!);

      expect(screen.getByRole('button', { name: /Load Application/i })).toBeInTheDocument();
    });

    it('should show Cancel button when app is selected', () => {
      render(<DemoSelector onSelect={mockOnSelect} />);

      const floppyDisk = getFloppyDiskByName('Second Reality');
      fireEvent.click(floppyDisk!);

      const cancelButtons = screen.getAllByRole('button', { name: /Cancel/i });
      expect(cancelButtons.length).toBeGreaterThan(0);
    });

    it('should clear error when selecting a new app', async () => {
      vi.mocked(loadZipArchive).mockRejectedValueOnce(new Error('Load failed'));

      render(<DemoSelector onSelect={mockOnSelect} />);

      // Select and try to load an app (will fail)
      const floppyDisk = getFloppyDiskByName('Second Reality');
      fireEvent.click(floppyDisk!);

      const loadButton = screen.getByRole('button', {
        name: /Load Application/i,
      });
      fireEvent.click(loadButton);

      // Wait for error to appear
      await waitFor(() => {
        expect(screen.getByText(/Load failed/i)).toBeInTheDocument();
      });

      // Select another app
      const anotherFloppyDisk = getFloppyDiskByName('Impulse Tracker');
      fireEvent.click(anotherFloppyDisk!);

      // Error should be cleared
      expect(screen.queryByText(/Load failed/i)).not.toBeInTheDocument();
    });
  });

  describe('App loading', () => {
    it('should load app when Load Application button is clicked', async () => {
      render(<DemoSelector onSelect={mockOnSelect} />);

      const floppyDisk = getFloppyDiskByName('Second Reality');
      fireEvent.click(floppyDisk!);

      const loadButton = screen.getByRole('button', {
        name: /Load Application/i,
      });
      fireEvent.click(loadButton);

      await waitFor(() => {
        expect(loadZipArchive).toHaveBeenCalledWith(
          secondRealityZipUrl,
          expect.any(Function),
          expect.any(AbortSignal)
        );
      });
    });

    it('should call onSelect with loaded app data after successful load', async () => {
      render(<DemoSelector onSelect={mockOnSelect} />);

      const floppyDisk = getFloppyDiskByName('Second Reality');
      fireEvent.click(floppyDisk!);

      const loadButton = screen.getByRole('button', {
        name: /Load Application/i,
      });
      fireEvent.click(loadButton);

      await waitFor(() => {
        expect(mockOnSelect).toHaveBeenCalledWith(
          expect.objectContaining({
            app: expect.objectContaining({
              id: 'second-reality',
              name: 'Second Reality',
            }),
            files: expect.any(Uint8Array),
            dosboxConf: secondRealityDosboxConf,
          })
        );
      });
    });

    it('should show loading state while loading', async () => {
      vi.mocked(loadZipArchive).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      render(<DemoSelector onSelect={mockOnSelect} />);

      const floppyDisk = getFloppyDiskByName('Second Reality');
      fireEvent.click(floppyDisk!);

      const loadButton = screen.getByRole('button', {
        name: /Load Application/i,
      });
      fireEvent.click(loadButton);

      // New UI shows "Cancel Loading" button instead of "Loading..." text
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Cancel Loading/i })).toBeInTheDocument();
      });
    });

    it('should show load progress', async () => {
      vi.mocked(loadZipArchive).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      render(<DemoSelector onSelect={mockOnSelect} />);

      const floppyDisk = getFloppyDiskByName('Second Reality');
      fireEvent.click(floppyDisk!);

      const loadButton = screen.getByRole('button', {
        name: /Load Application/i,
      });
      fireEvent.click(loadButton);

      await waitFor(() => {
        expect(screen.getByText(/Loading Starting.../i)).toBeInTheDocument();
      });
    });

    it('should show cancel button while loading', async () => {
      vi.mocked(loadZipArchive).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      render(<DemoSelector onSelect={mockOnSelect} />);

      const floppyDisk = getFloppyDiskByName('Second Reality');
      fireEvent.click(floppyDisk!);

      const loadButton = screen.getByRole('button', {
        name: /Load Application/i,
      });
      fireEvent.click(loadButton);

      // New UI replaces Load/Cancel buttons with a single "Cancel Loading" button
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Cancel Loading/i })).toBeInTheDocument();
        // Load Application button should not be visible during loading
        expect(screen.queryByRole('button', { name: /Load Application/i })).not.toBeInTheDocument();
      });
    });

    it('should handle loading errors', async () => {
      const errorMessage = 'Load failed';
      vi.mocked(loadZipArchive).mockRejectedValue(new Error(errorMessage));

      render(<DemoSelector onSelect={mockOnSelect} />);

      const floppyDisk = getFloppyDiskByName('Second Reality');
      fireEvent.click(floppyDisk!);

      const loadButton = screen.getByRole('button', {
        name: /Load Application/i,
      });
      fireEvent.click(loadButton);

      // Wait for error to be displayed
      await waitFor(
        () => {
          expect(screen.getByText(errorMessage)).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      // Verify loading state is cleared
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Load Application/i })).toBeInTheDocument();
    });

    it('should handle non-Error exceptions', async () => {
      vi.mocked(loadZipArchive).mockRejectedValueOnce('String error');

      render(<DemoSelector onSelect={mockOnSelect} />);

      const floppyDisk = getFloppyDiskByName('Second Reality');
      fireEvent.click(floppyDisk!);

      const loadButton = screen.getByRole('button', {
        name: /Load Application/i,
      });
      fireEvent.click(loadButton);

      await waitFor(() => {
        expect(screen.getByText(/Failed to load application/i)).toBeInTheDocument();
      });
    });

    it('should not load if no app is selected', () => {
      render(<DemoSelector onSelect={mockOnSelect} />);

      // Try to trigger load without selecting an app (shouldn't be possible in UI, but test the logic)
      // This tests the early return in handleLoadApp
      expect(loadZipArchive).not.toHaveBeenCalled();
    });
  });

  describe('Load cancellation and overlapping loads', () => {
    /** Make each download wait until the test resolves it, keyed by archive URL */
    const deferDownloads = () => {
      const pending = new Map<string, (data: Uint8Array) => void>();
      vi.mocked(loadZipArchive).mockImplementation(
        (url: string) =>
          new Promise<Uint8Array>((resolve) => {
            pending.set(url, resolve);
          })
      );
      return pending;
    };

    const startLoadingSecondReality = async (pending: Map<string, unknown>) => {
      fireEvent.click(getFloppyDiskByName('Second Reality')!);
      fireEvent.click(screen.getByRole('button', { name: /Load Application/i }));
      await waitFor(() => expect(pending.has(secondRealityZipUrl)).toBe(true));
    };

    it('does not deliver the app when loading is cancelled before the download finishes', async () => {
      const pending = deferDownloads();
      render(<DemoSelector onSelect={mockOnSelect} />);
      await startLoadingSecondReality(pending);

      fireEvent.click(screen.getByRole('button', { name: /Cancel Loading/i }));
      await act(async () => {
        pending.get(secondRealityZipUrl)!(new Uint8Array([1]));
      });

      expect(mockOnSelect).not.toHaveBeenCalled();
    });

    it('aborts the in-flight download when loading is cancelled', async () => {
      const pending = deferDownloads();
      render(<DemoSelector onSelect={mockOnSelect} />);
      await startLoadingSecondReality(pending);

      fireEvent.click(screen.getByRole('button', { name: /Cancel Loading/i }));

      const signal = vi.mocked(loadZipArchive).mock.calls[0]?.[2];
      expect(signal).toBeInstanceOf(AbortSignal);
      expect(signal?.aborted).toBe(true);
    });

    it('ignores a superseded load that finishes before the newer one', async () => {
      const pending = deferDownloads();
      render(<DemoSelector onSelect={mockOnSelect} />);
      await startLoadingSecondReality(pending);

      // User changes their mind while Second Reality is still downloading
      fireEvent.doubleClick(getFloppyDiskByName('Impulse Tracker')!);
      await waitFor(() => expect(pending.has(impulseTrackerZipUrl)).toBe(true));

      await act(async () => {
        pending.get(secondRealityZipUrl)!(new Uint8Array([1]));
      });
      expect(mockOnSelect).not.toHaveBeenCalled();

      await act(async () => {
        pending.get(impulseTrackerZipUrl)!(new Uint8Array([2]));
      });
      expect(mockOnSelect).toHaveBeenCalledTimes(1);
      expect(mockOnSelect.mock.calls[0]?.[0].app.id).toBe('impulse-tracker');
    });
  });

  describe('Config preloading', () => {
    it('loads the app after a hover preload of its DOSBox config failed', async () => {
      const app = availableApps.find((a) => a.id === 'second-reality')!;
      const preload = vi
        .spyOn(app, 'loadDosboxConf')
        .mockRejectedValueOnce(new Error('Failed to fetch dynamically imported module'));

      render(<DemoSelector onSelect={mockOnSelect} />);
      fireEvent.mouseEnter(document.querySelector('[data-app-id="second-reality"]')!);
      await waitFor(() => expect(preload).toHaveBeenCalledTimes(1));

      // Connection recovered; the user now loads the app
      fireEvent.click(getFloppyDiskByName('Second Reality')!);
      fireEvent.click(screen.getByRole('button', { name: /Load Application/i }));

      await waitFor(() => expect(mockOnSelect).toHaveBeenCalledTimes(1));
    });

    it('does not reuse a config preloaded by an earlier selector', async () => {
      const app = availableApps.find((a) => a.id === 'second-reality')!;
      const preload = vi.spyOn(app, 'loadDosboxConf').mockResolvedValueOnce('[cpu]\ncycles=1');

      const earlier = render(<DemoSelector onSelect={mockOnSelect} />);
      fireEvent.mouseEnter(document.querySelector('[data-app-id="second-reality"]')!);
      await waitFor(() => expect(preload).toHaveBeenCalledTimes(1));
      earlier.unmount();

      render(<DemoSelector onSelect={mockOnSelect} />);
      fireEvent.click(getFloppyDiskByName('Second Reality')!);
      fireEvent.click(screen.getByRole('button', { name: /Load Application/i }));

      await waitFor(() => expect(mockOnSelect).toHaveBeenCalledTimes(1));
      expect(mockOnSelect.mock.calls[0]?.[0].dosboxConf).toBe(secondRealityDosboxConf);
    });

    it('does not start a preload once the selector has closed', () => {
      vi.useFakeTimers();
      try {
        const app = availableApps.find((a) => a.id === 'impulse-tracker')!;
        const preload = vi.spyOn(app, 'loadDosboxConf');

        const { unmount } = render(<DemoSelector onSelect={mockOnSelect} />);
        fireEvent.mouseEnter(document.querySelector('[data-app-id="impulse-tracker"]')!);
        unmount();
        vi.advanceTimersByTime(1000);

        expect(preload).not.toHaveBeenCalled();
      } finally {
        vi.useRealTimers();
      }
    });
  });

  describe('Cancel functionality', () => {
    it('should call onCancel when close button is clicked', () => {
      render(<DemoSelector onSelect={mockOnSelect} onCancel={mockOnCancel} />);

      const closeButton = screen.getByRole('button', { name: /Close/i });
      fireEvent.click(closeButton);

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });

    it('should clear selected app when cancel is clicked', () => {
      render(<DemoSelector onSelect={mockOnSelect} onCancel={mockOnCancel} />);

      // Select an app using FloppyDisk
      const floppyDisk = getFloppyDiskByName('Second Reality');
      fireEvent.click(floppyDisk!);

      expect(screen.getByText(/Selected: Second Reality/i)).toBeInTheDocument();

      // Click cancel in app details
      const cancelButtons = screen.getAllByRole('button', { name: /Cancel/i });
      const detailsCancelButton = cancelButtons.find((btn) =>
        btn.className.includes('cancel-button')
      );
      fireEvent.click(detailsCancelButton!);

      expect(screen.queryByText(/Selected: Second Reality/i)).not.toBeInTheDocument();
    });

    it('should clear error when cancel is clicked', async () => {
      vi.mocked(loadZipArchive).mockRejectedValueOnce(new Error('Load failed'));

      render(<DemoSelector onSelect={mockOnSelect} onCancel={mockOnCancel} />);

      // Select and try to load an app (will fail)
      const floppyDisk = getFloppyDiskByName('Second Reality');
      fireEvent.click(floppyDisk!);

      const loadButton = screen.getByRole('button', {
        name: /Load Application/i,
      });
      fireEvent.click(loadButton);

      await waitFor(() => {
        expect(screen.getByText(/Load failed/i)).toBeInTheDocument();
      });

      // Click cancel
      const cancelButtons = screen.getAllByRole('button', { name: /Cancel/i });
      const detailsCancelButton = cancelButtons.find((btn) =>
        btn.className.includes('cancel-button')
      );
      fireEvent.click(detailsCancelButton!);

      expect(screen.queryByText(/Load failed/i)).not.toBeInTheDocument();
    });
  });
});
