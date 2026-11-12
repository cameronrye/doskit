/**
 * Tests for DemoSelector component
 * Updated to work with retro-floppy FloppyDisk components
 */

import { describe, it, expect, vi, beforeEach, afterEach, onTestFinished } from 'vitest';
import { render, screen, fireEvent, waitFor, act, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { DemoSelector } from './DemoSelector';
import type { DosApp } from '../types/dos-app';
import { loadZipArchive, type LoadProgress } from '../utils/diskLoader';
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

/** The disk of an app: an option of the selector's list, named for the app */
const getFloppyDiskByName = (name: string): HTMLElement =>
  screen.getByRole('option', { name: new RegExp(`^${name}\\b`) });

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

    it("should show each archive's own size on its disk", () => {
      render(<DemoSelector onSelect={mockOnSelect} />);

      // 2,122,910 bytes, 33,424 and 1,482, where every disk used to say 1.44 MB
      expect(within(getFloppyDiskByName('Second Reality')).getByText('2.1 MB')).toBeInTheDocument();
      expect(
        within(getFloppyDiskByName('StarPort BBS Intro II')).getByText('33 KB')
      ).toBeInTheDocument();
      expect(
        within(getFloppyDiskByName('Starfield Effect')).getByText('1.5 KB')
      ).toBeInTheDocument();
      expect(screen.queryByText('1.44 MB')).not.toBeInTheDocument();
    });

    it('should warn that a production flashes once it is selected', () => {
      render(<DemoSelector onSelect={mockOnSelect} />);

      fireEvent.click(getFloppyDiskByName('Panic'));
      expect(screen.getByText(/contains flashing lights/i)).toBeInTheDocument();

      fireEvent.click(getFloppyDiskByName('Starfield Effect'));
      expect(screen.queryByText(/contains flashing lights/i)).not.toBeInTheDocument();
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

    describe('accessible names', () => {
      /** Add an app to the registry for the length of the test, as apps.config.ts would */
      const registerApp = (release: Pick<DosApp, 'author' | 'year'>) => {
        const app: DosApp = {
          id: 'my-demo',
          name: 'My Demo',
          description: 'One line for the selector',
          kind: 'demo',
          archiveBytes: 3,
          loadMethod: 'zip',
          dosboxConf: '',
          loader: async () => new Uint8Array(),
          ...release,
        };
        availableApps.push(app);
        onTestFinished(() => {
          availableApps.splice(availableApps.indexOf(app), 1);
        });
      };

      it.each([
        [
          'an author and a year',
          { author: 'Some Group', year: 1994 },
          'My Demo by Some Group (1994)',
        ],
        ['an author but no year', { author: 'Some Group' }, 'My Demo by Some Group'],
        ['a year but no author', { year: 1994 }, 'My Demo (1994)'],
        ['neither author nor year', {}, 'My Demo'],
      ])('names the disk of an app with %s', (_, release, name) => {
        registerApp(release);
        render(<DemoSelector onSelect={mockOnSelect} />);

        const disk = document.querySelector('[data-app-id="my-demo"]');
        expect(disk).toHaveAccessibleName(`${name}. Press Enter to load.`);
      });
    });

    // Such as App's "Application not found" for a link to an app that does not exist
    describe('a notice', () => {
      const notFound = 'Application "nosuch" not found. Please select from available applications.';

      it('shows it above the disks as an alert', () => {
        render(<DemoSelector onSelect={mockOnSelect} notice={notFound} />);

        const alert = screen.getByRole('alert');
        expect(alert).toHaveTextContent(notFound);
        expect(
          alert.compareDocumentPosition(screen.getByRole('listbox')) &
            Node.DOCUMENT_POSITION_FOLLOWING
        ).toBeTruthy();
      });

      // Opening the selector focuses the first disk, which scrolls the disks' area: in a
      // phone held sideways, a notice inside it went out of sight
      it('keeps it out of the area where the disks scroll', () => {
        const { container } = render(<DemoSelector onSelect={mockOnSelect} notice={notFound} />);

        expect(container.querySelector('.demo-selector-content')).toContainElement(
          screen.getByRole('listbox')
        );
        expect(screen.getByRole('alert').closest('.demo-selector-content')).toBeNull();
      });

      it.each([null, undefined])('shows none for %s', (notice) => {
        render(<DemoSelector onSelect={mockOnSelect} notice={notice} />);

        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      });
    });

    // One tab stop for the whole list, and one name and role per disk
    describe('the list of disks', () => {
      it('lists every app as an option of one list', () => {
        render(<DemoSelector onSelect={mockOnSelect} />);

        const list = screen.getByRole('listbox', { name: 'DOS applications' });
        expect(within(list).getAllByRole('option')).toHaveLength(availableApps.length);
      });

      it('makes the list a single tab stop', () => {
        render(<DemoSelector onSelect={mockOnSelect} />);

        const list = screen.getByRole('listbox');
        const tabStops = Array.from(list.querySelectorAll<HTMLElement>('*')).filter(
          (element) => element.tabIndex >= 0
        );
        expect(tabStops).toEqual([getFloppyDiskByName(availableApps[0]!.name)]);
      });

      // retro-floppy makes each disk a focusable button of its own
      it('leaves nothing focusable or named inside a disk', () => {
        render(<DemoSelector onSelect={mockOnSelect} />);

        for (const disk of screen.getAllByRole('option')) {
          for (const inner of disk.querySelectorAll('*')) {
            expect(inner).not.toHaveAttribute('tabindex');
            expect(inner).not.toHaveAttribute('role');
            expect(inner).not.toHaveAttribute('aria-label');
          }
        }
      });

      it('marks the selected disk, and only that one', () => {
        render(<DemoSelector onSelect={mockOnSelect} />);

        fireEvent.click(getFloppyDiskByName('Impulse Tracker'));

        expect(screen.getAllByRole('option', { selected: true })).toEqual([
          getFloppyDiskByName('Impulse Tracker'),
        ]);
      });
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

    // The list scrolls on laptops and phones; the details, actions, progress and errors stay
    // in view below it (DemoSelector.css)
    it('keeps the selected app, its actions and its errors out of the scrolling list', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(loadZipArchive).mockRejectedValueOnce(new TypeError('Failed to fetch'));
      render(<DemoSelector onSelect={mockOnSelect} />);
      fireEvent.click(getFloppyDiskByName('Second Reality'));
      fireEvent.click(screen.getByRole('button', { name: 'Load Application' }));
      const alert = await screen.findByRole('alert');

      const scrolling = screen.getByRole('listbox').parentElement!;
      for (const element of [
        screen.getByText('Selected: Second Reality'),
        screen.getByRole('button', { name: 'Load Application' }),
        alert,
      ]) {
        expect(scrolling).not.toContainElement(element);
        expect(screen.getByRole('dialog')).toContainElement(element);
      }
    });

    it('should clear error when selecting a new app', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(loadZipArchive).mockRejectedValueOnce(new TypeError('Failed to fetch'));

      render(<DemoSelector onSelect={mockOnSelect} />);

      // Select and try to load an app (will fail)
      const floppyDisk = getFloppyDiskByName('Second Reality');
      fireEvent.click(floppyDisk!);

      const loadButton = screen.getByRole('button', {
        name: /Load Application/i,
      });
      fireEvent.click(loadButton);

      // Wait for error to appear
      expect(await screen.findByRole('alert')).toBeInTheDocument();

      // Select another app
      const anotherFloppyDisk = getFloppyDiskByName('Impulse Tracker');
      fireEvent.click(anotherFloppyDisk!);

      // Error should be cleared
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
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

    describe('progress', () => {
      /** Load Second Reality, whose download reports this progress and then waits */
      const loadReporting = async (...reports: LoadProgress[]) => {
        vi.mocked(loadZipArchive).mockImplementation(async (_url, onProgress) => {
          reports.forEach((progress) => onProgress?.(progress));
          return new Promise(() => {});
        });
        render(<DemoSelector onSelect={mockOnSelect} />);
        fireEvent.click(getFloppyDiskByName('Second Reality')!);
        fireEvent.click(screen.getByRole('button', { name: /Load Application/i }));
        return screen.findByRole('progressbar', { name: 'Download progress' });
      };

      it('says the download is starting until the first progress arrives', async () => {
        const bar = await loadReporting();

        expect(screen.getByText('Starting download…')).toBeInTheDocument();
        expect(bar).not.toHaveAttribute('aria-valuenow');
      });

      // As loadZipArchive reports at its request, and for an answer that gives no size
      it('says the download is starting while neither bytes nor a size have arrived', async () => {
        const bar = await loadReporting({ loadedBytes: 0, totalBytes: null });

        expect(screen.getByText('Starting download…')).toBeInTheDocument();
        expect(bar).not.toHaveAttribute('aria-valuenow');
      });

      it('shows the share downloaded when the size is known', async () => {
        const bar = await loadReporting(
          { loadedBytes: 0, totalBytes: 2_000_000 },
          { loadedBytes: 913_000, totalBytes: 2_000_000 }
        );

        expect(await screen.findByText('Downloading… 45%')).toBeInTheDocument();
        expect(bar).toHaveAttribute('aria-valuenow', '45');
        expect(bar).toHaveAttribute('aria-valuemin', '0');
        expect(bar).toHaveAttribute('aria-valuemax', '100');
      });

      it('shows the megabytes received on an indeterminate bar when the size is unknown', async () => {
        const bar = await loadReporting({ loadedBytes: 1_250_000, totalBytes: null });

        expect(await screen.findByText('Downloading… 1.3 MB')).toBeInTheDocument();
        expect(bar).not.toHaveAttribute('aria-valuenow');
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
      vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(loadZipArchive).mockRejectedValue(new TypeError('Failed to fetch'));

      render(<DemoSelector onSelect={mockOnSelect} />);

      const floppyDisk = getFloppyDiskByName('Second Reality');
      fireEvent.click(floppyDisk!);

      const loadButton = screen.getByRole('button', {
        name: /Load Application/i,
      });
      fireEvent.click(loadButton);

      // Wait for error to be displayed
      expect(await screen.findByRole('alert')).toHaveTextContent('Unable to connect to the server');

      // Verify loading state is cleared, so Load Application can try again
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Load Application/i })).toBeInTheDocument();
    });

    it('should handle non-Error exceptions', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(loadZipArchive).mockRejectedValueOnce('String error');

      render(<DemoSelector onSelect={mockOnSelect} />);

      const floppyDisk = getFloppyDiskByName('Second Reality');
      fireEvent.click(floppyDisk!);

      const loadButton = screen.getByRole('button', {
        name: /Load Application/i,
      });
      fireEvent.click(loadButton);

      expect(await screen.findByRole('alert')).toHaveTextContent('An unexpected error occurred');
    });

    it('loads the app with keyboard focus on Enter', async () => {
      render(<DemoSelector onSelect={mockOnSelect} />);

      // The selector opens with keyboard focus on the first app
      fireEvent.keyDown(document.activeElement!, { key: 'Enter' });

      await waitFor(() => expect(mockOnSelect).toHaveBeenCalledTimes(1));
      expect(mockOnSelect.mock.calls[0]?.[0].app.id).toBe(availableApps[0]!.id);
    });

    it('loads the focused app on Enter, not the one selected before', async () => {
      render(<DemoSelector onSelect={mockOnSelect} />);
      fireEvent.click(getFloppyDiskByName('Second Reality'));

      act(() => getFloppyDiskByName('Impulse Tracker').focus());
      fireEvent.keyDown(document.activeElement!, { key: 'Enter' });

      expect(screen.getByText('Selected: Impulse Tracker')).toBeInTheDocument();
      await waitFor(() => expect(mockOnSelect).toHaveBeenCalledTimes(1));
      expect(mockOnSelect.mock.calls[0]?.[0].app.id).toBe('impulse-tracker');
    });

    it('loads the app on a double-click', async () => {
      render(<DemoSelector onSelect={mockOnSelect} />);

      fireEvent.doubleClick(getFloppyDiskByName('Impulse Tracker'));

      await waitFor(() => expect(mockOnSelect).toHaveBeenCalledTimes(1));
      expect(mockOnSelect.mock.calls[0]?.[0].app.id).toBe('impulse-tracker');
    });
  });

  describe('Load errors', () => {
    /** Load Second Reality with its download failing, and return the error shown */
    const failLoading = async (error: unknown) => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(loadZipArchive).mockRejectedValueOnce(error);
      render(<DemoSelector onSelect={mockOnSelect} />);
      fireEvent.click(getFloppyDiskByName('Second Reality')!);
      fireEvent.click(screen.getByRole('button', { name: /Load Application/i }));
      return screen.findByRole('alert');
    };

    // fetch() rejects with each browser's own words for the same failure
    it.each(['Failed to fetch', 'NetworkError when attempting to fetch resource.', 'Load failed'])(
      'explains the network failure "%s" as a connection problem',
      async (technical) => {
        const alert = await failLoading(new TypeError(technical));

        expect(alert).toHaveTextContent('Unable to connect to the server');
        expect(alert).toHaveTextContent('Please check your internet connection and try again.');
      }
    );

    it('says that the app needs a connection until it has been opened online', async () => {
      vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);

      const alert = await failLoading(new TypeError('Failed to fetch'));

      expect(alert).toHaveTextContent("This application isn't available offline yet");
      expect(alert).toHaveTextContent(
        'Each application works offline once it has been opened while online.'
      );
    });

    it.each([
      ['Failed to load ZIP: HTTP 404', 'The requested file was not found'],
      ['Failed to load ZIP: HTTP 503', 'The server is temporarily unavailable'],
    ])('explains "%s" as "%s"', async (technical, friendly) => {
      expect(await failLoading(new Error(technical))).toHaveTextContent(friendly);
    });

    it('keeps the technical message in a collapsed details line', async () => {
      const alert = await failLoading(new Error('Failed to load ZIP: HTTP 404'));

      const technical = within(alert).getByText('Failed to load ZIP: HTTP 404');
      expect(technical.closest('details')).not.toHaveAttribute('open');
      expect(technical).not.toBeVisible();
      expect(within(alert).getByText('Details')).toBeVisible();
    });

    it('explains a download that stalled as a timeout, and loads it again on request', async () => {
      // How loadZipArchive fails when no data arrives for 20 seconds
      const alert = await failLoading(
        Object.assign(new Error('Download timed out: no data received for 20 seconds'), {
          name: 'TimeoutError',
        })
      );
      expect(alert).toHaveTextContent('The request took too long to complete');

      fireEvent.click(screen.getByRole('button', { name: /Load Application/i }));

      await waitFor(() => expect(mockOnSelect).toHaveBeenCalledTimes(1));
      expect(loadZipArchive).toHaveBeenCalledTimes(2);
    });

    // loadZipArchive gives up on a download that stalls, from its request on, retries
    // included; one that keeps going may take minutes on a slow connection
    it('sets no time limit of its own on a download that has started', async () => {
      vi.useFakeTimers();
      try {
        // A download that has reported its start, as loadZipArchive does at its request, and
        // gets no answer for minutes, as from a server whose slow errors it retries
        vi.mocked(loadZipArchive).mockImplementation((_url, onProgress) => {
          onProgress?.({ loadedBytes: 0, totalBytes: null });
          return new Promise(() => {});
        });
        render(<DemoSelector onSelect={mockOnSelect} />);
        fireEvent.click(getFloppyDiskByName('Second Reality')!);
        fireEvent.click(screen.getByRole('button', { name: /Load Application/i }));
        await vi.waitFor(() => expect(loadZipArchive).toHaveBeenCalled());

        act(() => vi.advanceTimersByTime(10 * 60_000));

        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Cancel Loading/i })).toBeInTheDocument();
        expect(vi.mocked(loadZipArchive).mock.calls[0]?.[2]?.aborted).toBe(false);
      } finally {
        vi.useRealTimers();
      }
    });

    // An app's loader imports its config chunk before its download starts, and only the
    // download times itself out: a chunk that never arrives would leave the load up for good
    it('gives up a load that has not started downloading within 20 seconds', async () => {
      vi.useFakeTimers();
      vi.spyOn(console, 'error').mockImplementation(() => {});
      try {
        // It never reports its start, as for a loader whose config chunk never arrives
        vi.mocked(loadZipArchive).mockImplementation(() => new Promise(() => {}));
        render(<DemoSelector onSelect={mockOnSelect} />);
        fireEvent.click(getFloppyDiskByName('Second Reality')!);
        fireEvent.click(screen.getByRole('button', { name: /Load Application/i }));
        await vi.waitFor(() => expect(loadZipArchive).toHaveBeenCalled());

        act(() => vi.advanceTimersByTime(19_000));
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
        act(() => vi.advanceTimersByTime(1_000));

        expect(screen.getByRole('alert')).toHaveTextContent(
          'The request took too long to complete'
        );
        expect(vi.mocked(loadZipArchive).mock.calls[0]?.[2]?.aborted).toBe(true);
        expect(screen.getByRole('button', { name: /Load Application/i })).toBeInTheDocument();
        expect(mockOnSelect).not.toHaveBeenCalled();
      } finally {
        vi.useRealTimers();
      }
    });
  });

  // user-event activates a button on Enter or Space, and opens details, only if the
  // keydown is not cancelled, as browsers do
  describe("Keys on the selector's own controls", () => {
    const focusOn = (element: HTMLElement) => act(() => element.focus());

    it.each(['{Enter}', ' '])('closes the selector with %s on Cancel', async (key) => {
      const user = userEvent.setup();
      render(<DemoSelector onSelect={mockOnSelect} onCancel={mockOnCancel} />);
      fireEvent.click(getFloppyDiskByName('Second Reality')!);

      focusOn(screen.getByRole('button', { name: 'Cancel' }));
      await user.keyboard(key);

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
      expect(loadZipArchive).not.toHaveBeenCalled();
    });

    it.each(['{Enter}', ' '])('closes the selector with %s on Close', async (key) => {
      const user = userEvent.setup();
      render(<DemoSelector onSelect={mockOnSelect} onCancel={mockOnCancel} />);

      focusOn(screen.getByRole('button', { name: 'Close' }));
      await user.keyboard(key);

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
      expect(screen.queryByText(/Selected:/)).not.toBeInTheDocument();
    });

    it.each(['{Enter}', ' '])('loads the selected app with %s on Load Application', async (key) => {
      const user = userEvent.setup();
      render(<DemoSelector onSelect={mockOnSelect} />);
      fireEvent.click(getFloppyDiskByName('Second Reality')!);

      focusOn(screen.getByRole('button', { name: 'Load Application' }));
      await user.keyboard(key);

      await waitFor(() => expect(mockOnSelect).toHaveBeenCalledTimes(1));
      expect(mockOnSelect.mock.calls[0]?.[0].app.id).toBe('second-reality');
    });

    it.each(['{Enter}', ' '])('cancels the download with %s on Cancel Loading', async (key) => {
      const user = userEvent.setup();
      vi.mocked(loadZipArchive).mockImplementation(() => new Promise(() => {}));
      render(<DemoSelector onSelect={mockOnSelect} />);
      fireEvent.click(getFloppyDiskByName('Second Reality')!);
      fireEvent.click(screen.getByRole('button', { name: 'Load Application' }));
      await waitFor(() => expect(loadZipArchive).toHaveBeenCalled());

      focusOn(screen.getByRole('button', { name: /Cancel Loading/i }));
      await user.keyboard(key);

      expect(vi.mocked(loadZipArchive).mock.calls[0]?.[2]?.aborted).toBe(true);
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      expect(loadZipArchive).toHaveBeenCalledTimes(1);
    });

    // The same button turns into Cancel Loading and back. Were it replaced, the focus would
    // fall to the page behind the dialog, and Tab would leave it.
    it('keeps the focus on Load Application as it turns into Cancel Loading, and back', async () => {
      const user = userEvent.setup();
      vi.mocked(loadZipArchive).mockImplementation(() => new Promise(() => {}));
      render(<DemoSelector onSelect={mockOnSelect} />);
      fireEvent.click(getFloppyDiskByName('Panic'));
      focusOn(screen.getByRole('button', { name: 'Load Application' }));

      await user.keyboard('{Enter}');
      expect(screen.getByRole('button', { name: /Cancel Loading/i })).toHaveFocus();

      await user.keyboard('{Enter}');
      expect(screen.getByRole('button', { name: 'Load Application' })).toHaveFocus();
    });

    it('gives Load Application the focus again when the download fails', async () => {
      const user = userEvent.setup();
      vi.spyOn(console, 'error').mockImplementation(() => {});
      let fail!: () => void;
      vi.mocked(loadZipArchive).mockImplementation(
        () =>
          new Promise((_resolve, reject) => {
            fail = () => reject(new TypeError('Failed to fetch'));
          })
      );
      render(<DemoSelector onSelect={mockOnSelect} />);
      fireEvent.click(getFloppyDiskByName('Panic'));
      focusOn(screen.getByRole('button', { name: 'Load Application' }));
      await user.keyboard('{Enter}');
      await waitFor(() => expect(loadZipArchive).toHaveBeenCalled());

      await act(async () => fail());

      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Load Application' })).toHaveFocus();
    });

    // jsdom does not open details from the keyboard, so check that the keys are left to it
    it.each(['Enter', ' '])("leaves %s on the error's Details to the browser", async (key) => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(loadZipArchive).mockRejectedValueOnce(new Error('Failed to load ZIP: HTTP 404'));
      render(<DemoSelector onSelect={mockOnSelect} />);
      fireEvent.click(getFloppyDiskByName('Second Reality')!);
      fireEvent.click(screen.getByRole('button', { name: 'Load Application' }));
      const summary = within(await screen.findByRole('alert')).getByText('Details');

      expect(fireEvent.keyDown(summary, { key })).toBe(true);
      fireEvent.keyUp(summary, { key });

      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(loadZipArchive).toHaveBeenCalledTimes(1);
    });
  });

  describe('Keyboard navigation', () => {
    /**
     * jsdom has no layout: report the offsets a browser gives the grid's apps
     * when it fits this many of them on a row
     */
    const layOutGrid = (columns: number) => {
      const position = (el: HTMLElement) =>
        availableApps.findIndex((a) => a.id === el.dataset.appId);
      vi.spyOn(HTMLElement.prototype, 'offsetTop', 'get').mockImplementation(function (
        this: HTMLElement
      ) {
        const index = position(this);
        return index < 0 ? 0 : Math.floor(index / columns) * 250;
      });
      vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockImplementation(function (
        this: HTMLElement
      ) {
        return position(this) < 0 ? 0 : 200;
      });
    };

    const appAt = (index: number) =>
      document.querySelector<HTMLElement>(`[data-app-id="${availableApps[index]!.id}"]`)!;
    const press = (key: string) => fireEvent.keyDown(document.activeElement!, { key });

    it('moves down to the app below it in a four-column grid', () => {
      layOutGrid(4);
      render(<DemoSelector onSelect={mockOnSelect} />);

      press('ArrowDown');

      expect(appAt(4)).toHaveFocus();
    });

    it('moves up to the app above it in a two-column grid', () => {
      layOutGrid(2);
      render(<DemoSelector onSelect={mockOnSelect} />);
      act(() => appAt(5).focus());

      press('ArrowUp');

      expect(appAt(3)).toHaveFocus();
    });

    it('measures the columns again on each key press', () => {
      layOutGrid(4);
      render(<DemoSelector onSelect={mockOnSelect} />);
      press('ArrowDown');

      layOutGrid(3); // the window got narrower
      press('ArrowDown');

      expect(appAt(7)).toHaveFocus();
    });

    it('moves down to the last app when the row below is too short', () => {
      // All apps but the last fit on the first row
      layOutGrid(availableApps.length - 1);
      render(<DemoSelector onSelect={mockOnSelect} />);
      act(() => appAt(1).focus());

      press('ArrowDown');

      expect(appAt(availableApps.length - 1)).toHaveFocus();
    });

    it('moves one app at a time when the grid has no layout to measure', () => {
      render(<DemoSelector onSelect={mockOnSelect} />);

      press('ArrowDown');

      expect(appAt(1)).toHaveFocus();
    });

    describe('at both ends of the list', () => {
      const last = availableApps.length - 1;

      it.each([
        ['ArrowRight', 0, 1],
        ['ArrowRight', last, 0],
        ['ArrowLeft', last, last - 1],
        ['ArrowLeft', 0, last],
        ['ArrowDown', 0, 4],
        ['ArrowDown', last, last],
        ['ArrowUp', 5, 1],
        ['ArrowUp', 0, 0],
        ['Home', last, 0],
        ['End', 0, last],
      ])('%s from app %i moves to app %i and selects it', (key, from, to) => {
        layOutGrid(4);
        render(<DemoSelector onSelect={mockOnSelect} />);
        act(() => appAt(from).focus());

        expect(press(key)).toBe(false);

        expect(appAt(to)).toHaveFocus();
        expect(appAt(to)).toHaveAttribute('aria-selected', 'true');
        expect(screen.getByText(`Selected: ${availableApps[to]!.name}`)).toBeInTheDocument();
        expect(mockOnSelect).not.toHaveBeenCalled();
      });
    });

    it('selects the focused app on Space without loading it', () => {
      render(<DemoSelector onSelect={mockOnSelect} />);

      expect(press(' ')).toBe(false);

      expect(appAt(0)).toHaveAttribute('aria-selected', 'true');
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      expect(loadZipArchive).not.toHaveBeenCalled();
    });

    it('cancels a download on Escape, and keeps the selector open', async () => {
      vi.mocked(loadZipArchive).mockImplementation(() => new Promise(() => {}));
      render(<DemoSelector onSelect={mockOnSelect} onCancel={mockOnCancel} />);
      press('Enter');
      await waitFor(() => expect(loadZipArchive).toHaveBeenCalled());

      expect(press('Escape')).toBe(false);

      expect(vi.mocked(loadZipArchive).mock.calls[0]?.[2]?.aborted).toBe(true);
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      expect(mockOnCancel).not.toHaveBeenCalled();
    });

    it('closes the selector on Escape when nothing is downloading', () => {
      render(<DemoSelector onSelect={mockOnSelect} onCancel={mockOnCancel} />);

      expect(press('Escape')).toBe(false);

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });

    it("closes the selector on Escape from the selector's buttons too", () => {
      render(<DemoSelector onSelect={mockOnSelect} onCancel={mockOnCancel} />);
      fireEvent.click(appAt(0));

      fireEvent.keyDown(screen.getByRole('button', { name: 'Load Application' }), {
        key: 'Escape',
      });

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });

    // Alt+Left is the browser's Back, for one
    it.each(['altKey', 'ctrlKey', 'metaKey'])('leaves keys with %s to the browser', (modifier) => {
      render(<DemoSelector onSelect={mockOnSelect} />);

      expect(fireEvent.keyDown(appAt(0), { key: 'ArrowRight', [modifier]: true })).toBe(true);
      expect(fireEvent.keyDown(appAt(0), { key: 'Enter', [modifier]: true })).toBe(true);

      expect(appAt(0)).toHaveFocus();
      expect(screen.queryByText(/Selected:/)).not.toBeInTheDocument();
      expect(loadZipArchive).not.toHaveBeenCalled();
    });
  });

  describe('Load cancellation and overlapping loads', () => {
    /**
     * Make each download wait until the test resolves it, keyed by archive URL. Like
     * loadZipArchive, a download rejects with the abort's reason once its signal aborts,
     * unless it ignores aborts, as an app's loader does while it imports its config chunk.
     */
    const deferDownloads = ({ ignoreAborts = false } = {}) => {
      const pending = new Map<string, (data: Uint8Array) => void>();
      vi.mocked(loadZipArchive).mockImplementation(
        (url: string, _onProgress, signal) =>
          new Promise<Uint8Array>((resolve, reject) => {
            pending.set(url, resolve);
            if (!ignoreAborts) {
              signal?.addEventListener('abort', () => reject(signal.reason));
            }
          })
      );
      return pending;
    };

    const startLoadingSecondReality = async (pending: Map<string, unknown>) => {
      fireEvent.click(getFloppyDiskByName('Second Reality')!);
      fireEvent.click(screen.getByRole('button', { name: /Load Application/i }));
      await waitFor(() => expect(pending.has(secondRealityZipUrl)).toBe(true));
    };

    const signalOf = (url: string) =>
      vi.mocked(loadZipArchive).mock.calls.find(([called]) => called === url)?.[2];

    it('aborts the download when loading is cancelled, with no error', async () => {
      const pending = deferDownloads();
      render(<DemoSelector onSelect={mockOnSelect} />);
      await startLoadingSecondReality(pending);

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /Cancel Loading/i }));
      });

      expect(signalOf(secondRealityZipUrl)?.aborted).toBe(true);
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Load Application' })).toBeInTheDocument();
      expect(mockOnSelect).not.toHaveBeenCalled();
    });

    it('does not deliver an app whose download finishes after loading was cancelled', async () => {
      const pending = deferDownloads({ ignoreAborts: true });
      render(<DemoSelector onSelect={mockOnSelect} />);
      await startLoadingSecondReality(pending);

      fireEvent.click(screen.getByRole('button', { name: /Cancel Loading/i }));
      await act(async () => {
        pending.get(secondRealityZipUrl)!(new Uint8Array([1]));
      });

      expect(mockOnSelect).not.toHaveBeenCalled();
    });

    it('keeps loading the newer app when the download it superseded is aborted', async () => {
      const pending = deferDownloads();
      render(<DemoSelector onSelect={mockOnSelect} />);
      await startLoadingSecondReality(pending);

      await act(async () => {
        fireEvent.doubleClick(getFloppyDiskByName('Impulse Tracker'));
      });
      await waitFor(() => expect(pending.has(impulseTrackerZipUrl)).toBe(true));

      expect(signalOf(secondRealityZipUrl)?.aborted).toBe(true);
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Cancel Loading/i })).toBeInTheDocument();
      await act(async () => {
        pending.get(impulseTrackerZipUrl)!(new Uint8Array([2]));
      });
      expect(mockOnSelect).toHaveBeenCalledTimes(1);
      expect(mockOnSelect.mock.calls[0]?.[0].app.id).toBe('impulse-tracker');
    });

    // DosPlayerWithApps remounts the selector for a newer request, which must stop its download
    it('aborts the download when the selector closes, and delivers nothing', async () => {
      const pending = deferDownloads();
      const { unmount } = render(<DemoSelector onSelect={mockOnSelect} />);
      await startLoadingSecondReality(pending);

      unmount();
      await act(async () => {
        pending.get(secondRealityZipUrl)!(new Uint8Array([1]));
      });

      expect(signalOf(secondRealityZipUrl)?.aborted).toBe(true);
      expect(mockOnSelect).not.toHaveBeenCalled();
    });

    // An app's loader imports its config chunk before it downloads, so a load given up while
    // the chunk arrives can still report progress afterwards
    it('shows no progress from a superseded load', async () => {
      const reports = new Map<string, (progress: LoadProgress) => void>();
      vi.mocked(loadZipArchive).mockImplementation((url, onProgress) => {
        reports.set(url, onProgress!);
        return new Promise(() => {});
      });
      render(<DemoSelector onSelect={mockOnSelect} />);
      await startLoadingSecondReality(reports);
      fireEvent.doubleClick(getFloppyDiskByName('Impulse Tracker')!);
      await waitFor(() => expect(reports.has(impulseTrackerZipUrl)).toBe(true));

      act(() => reports.get(secondRealityZipUrl)!({ loadedBytes: 900_000, totalBytes: 1_000_000 }));

      expect(screen.getByText('Starting download…')).toBeInTheDocument();
      expect(screen.getByRole('progressbar')).not.toHaveAttribute('aria-valuenow');
    });

    it('ignores a superseded load that finishes before the newer one', async () => {
      const pending = deferDownloads({ ignoreAborts: true });
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

    // The details below the disks always name the app that is downloading
    describe('another disk chosen during a download', () => {
      it('cancels the download when it is clicked, and selects it', async () => {
        const pending = deferDownloads();
        render(<DemoSelector onSelect={mockOnSelect} />);
        await startLoadingSecondReality(pending);

        fireEvent.click(getFloppyDiskByName('Impulse Tracker'));

        expect(signalOf(secondRealityZipUrl)?.aborted).toBe(true);
        expect(screen.getByText('Selected: Impulse Tracker')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Load Application' })).toBeInTheDocument();
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
        await act(async () => pending.get(secondRealityZipUrl)!(new Uint8Array([1])));
        expect(mockOnSelect).not.toHaveBeenCalled();
      });

      // Moving through the list chooses nothing while a download runs
      it('only moves the focus to it with an arrow key, and keeps downloading', async () => {
        const pending = deferDownloads();
        render(<DemoSelector onSelect={mockOnSelect} />);
        fireEvent.keyDown(getFloppyDiskByName('Second Reality'), { key: 'Enter' });
        await waitFor(() => expect(pending.has(secondRealityZipUrl)).toBe(true));

        fireEvent.keyDown(getFloppyDiskByName('Second Reality'), { key: 'ArrowRight' });

        const unreal = screen.getByRole('option', { name: /^Unreal by/ });
        expect(unreal).toHaveFocus();
        expect(unreal).toHaveAttribute('aria-selected', 'false');
        expect(signalOf(secondRealityZipUrl)?.aborted).toBe(false);
        expect(screen.getByText('Selected: Second Reality')).toBeInTheDocument();
        expect(screen.getByRole('progressbar')).toBeInTheDocument();
      });

      it('cancels the download when Space selects it', async () => {
        const pending = deferDownloads();
        render(<DemoSelector onSelect={mockOnSelect} />);
        fireEvent.keyDown(getFloppyDiskByName('Second Reality'), { key: 'Enter' });
        await waitFor(() => expect(pending.has(secondRealityZipUrl)).toBe(true));
        fireEvent.keyDown(getFloppyDiskByName('Second Reality'), { key: 'ArrowRight' });

        fireEvent.keyDown(document.activeElement!, { key: ' ' });

        expect(signalOf(secondRealityZipUrl)?.aborted).toBe(true);
        expect(screen.getByText('Selected: Unreal')).toBeInTheDocument();
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });

      it('loads it instead when it is double-clicked, and names it', async () => {
        const user = userEvent.setup();
        const pending = deferDownloads();
        render(<DemoSelector onSelect={mockOnSelect} />);
        await startLoadingSecondReality(pending);

        await user.dblClick(getFloppyDiskByName('Impulse Tracker'));
        await waitFor(() => expect(pending.has(impulseTrackerZipUrl)).toBe(true));

        expect(signalOf(secondRealityZipUrl)?.aborted).toBe(true);
        expect(screen.getByText('Selected: Impulse Tracker')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Cancel Loading/i })).toBeInTheDocument();
      });
    });

    describe('the disk that is downloading, chosen again', () => {
      it('keeps downloading it on a double-click', async () => {
        const user = userEvent.setup();
        const pending = deferDownloads();
        render(<DemoSelector onSelect={mockOnSelect} />);
        await startLoadingSecondReality(pending);

        await user.dblClick(getFloppyDiskByName('Second Reality'));

        expect(loadZipArchive).toHaveBeenCalledTimes(1);
        expect(vi.mocked(loadZipArchive).mock.calls[0]?.[2]?.aborted).toBe(false);
        expect(screen.getByRole('button', { name: /Cancel Loading/i })).toBeInTheDocument();
      });

      it('keeps downloading it on Enter', async () => {
        const pending = deferDownloads();
        render(<DemoSelector onSelect={mockOnSelect} />);
        await startLoadingSecondReality(pending);

        fireEvent.keyDown(getFloppyDiskByName('Second Reality'), { key: 'Enter' });

        expect(loadZipArchive).toHaveBeenCalledTimes(1);
        expect(vi.mocked(loadZipArchive).mock.calls[0]?.[2]?.aborted).toBe(false);
      });
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

  describe('as a modal dialog', () => {
    it('is a modal dialog named by its heading', () => {
      render(<DemoSelector onSelect={mockOnSelect} onCancel={mockOnCancel} />);

      const dialog = screen.getByRole('dialog', { name: 'Select DOS Application' });
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(document.getElementById(dialog.getAttribute('aria-labelledby')!)).toBe(
        screen.getByRole('heading', { name: 'Select DOS Application' })
      );
    });

    describe('Tab', () => {
      it('goes from the last control back to the first', async () => {
        const user = userEvent.setup();
        render(<DemoSelector onSelect={mockOnSelect} onCancel={mockOnCancel} />);
        fireEvent.click(getFloppyDiskByName('Panic'));
        act(() => screen.getByRole('button', { name: 'Cancel' }).focus());

        await user.tab();

        expect(screen.getByRole('button', { name: 'Close' })).toHaveFocus();
      });

      it('goes back from the first control to the last with Shift', async () => {
        const user = userEvent.setup();
        render(<DemoSelector onSelect={mockOnSelect} onCancel={mockOnCancel} />);
        fireEvent.click(getFloppyDiskByName('Panic'));
        act(() => screen.getByRole('button', { name: 'Close' }).focus());

        await user.tab({ shift: true });

        expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus();
      });

      it('moves through the controls in between as usual', async () => {
        const user = userEvent.setup();
        render(<DemoSelector onSelect={mockOnSelect} onCancel={mockOnCancel} />);
        fireEvent.click(getFloppyDiskByName('Panic'));
        act(() => screen.getByRole('button', { name: 'Close' }).focus());

        await user.tab();
        expect(getFloppyDiskByName('Panic')).toHaveFocus();
        await user.tab();
        expect(screen.getByRole('button', { name: 'Load Application' })).toHaveFocus();
      });

      // A click on the dialog's background gives the dialog itself the focus
      it('goes back to the last control with Shift from the dialog itself', async () => {
        const user = userEvent.setup();
        render(
          <>
            <button>Behind the selector</button>
            <DemoSelector onSelect={mockOnSelect} onCancel={mockOnCancel} />
          </>
        );
        fireEvent.click(getFloppyDiskByName('Panic'));
        await user.click(screen.getByRole('heading', { name: 'Select DOS Application' }));
        expect(screen.getByRole('dialog')).toHaveFocus();

        await user.tab({ shift: true });

        expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus();
      });

      it('stays on the list when it is all there is to focus', async () => {
        const user = userEvent.setup();
        render(<DemoSelector onSelect={mockOnSelect} />);

        await user.tab();

        expect(getFloppyDiskByName(availableApps[0]!.name)).toHaveFocus();
      });
    });

    // DosPlayerWithApps closes the selector when it is cancelled or an app is picked
    describe('closing', () => {
      interface PageOptions {
        /** Whether the button that opens the selector stays on the page while it is open */
        keepOpener?: boolean;
        /** Whether cancelling closes the selector */
        closeOnCancel?: boolean;
      }

      /** The header's Change Application button, which opens the selector */
      function Page({ keepOpener = true, closeOnCancel = true }: PageOptions) {
        const [open, setOpen] = useState(false);
        return (
          <>
            {(keepOpener || !open) && (
              <button onClick={() => setOpen(true)}>Change Application</button>
            )}
            {open && (
              <DemoSelector
                onSelect={() => setOpen(false)}
                onCancel={() => setOpen(!closeOnCancel)}
              />
            )}
          </>
        );
      }

      const openFromButton = async (options: PageOptions = {}) => {
        const user = userEvent.setup();
        render(<Page {...options} />);
        const opener = screen.getByRole('button', { name: 'Change Application' });
        act(() => opener.focus());
        await user.keyboard('{Enter}');
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        return { user, opener };
      };

      it('gives the focus back to the button that opened it on Escape', async () => {
        const { user, opener } = await openFromButton();

        await user.keyboard('{Escape}');

        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        expect(opener).toHaveFocus();
      });

      it.each(['Close', 'Cancel'])('gives the focus back on %s from the keyboard', async (name) => {
        const { user, opener } = await openFromButton();
        fireEvent.click(getFloppyDiskByName('Panic'));
        act(() => screen.getByRole('button', { name }).focus());

        await user.keyboard('{Enter}');

        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        expect(opener).toHaveFocus();
      });

      // js-dos gives DOS the keys pressed on the page itself
      it.each(['Close', 'Cancel'])(
        'leaves the focus on the page after a click on %s',
        async (name) => {
          const { user } = await openFromButton();
          fireEvent.click(getFloppyDiskByName('Panic'));

          await user.click(screen.getByRole('button', { name }));

          expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
          expect(document.body).toHaveFocus();
        }
      );

      it('leaves the focus on the page after an app is picked', async () => {
        const { user } = await openFromButton();

        await user.keyboard('{Enter}');

        await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
        expect(document.body).toHaveFocus();
      });

      it('leaves the focus on the page after a pick that follows an ignored Escape', async () => {
        const { user } = await openFromButton({ closeOnCancel: false });
        await user.keyboard('{Escape}');
        expect(screen.getByRole('dialog')).toBeInTheDocument();

        await user.keyboard('{Enter}');

        await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
        expect(document.body).toHaveFocus();
      });

      it('leaves the focus on the page when the button that opened it is gone', async () => {
        const { user } = await openFromButton({ keepOpener: false });

        await user.keyboard('{Escape}');

        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        expect(document.body).toHaveFocus();
      });
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
      vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(loadZipArchive).mockRejectedValueOnce(new TypeError('Failed to fetch'));

      render(<DemoSelector onSelect={mockOnSelect} onCancel={mockOnCancel} />);

      // Select and try to load an app (will fail)
      const floppyDisk = getFloppyDiskByName('Second Reality');
      fireEvent.click(floppyDisk!);

      const loadButton = screen.getByRole('button', {
        name: /Load Application/i,
      });
      fireEvent.click(loadButton);

      expect(await screen.findByRole('alert')).toBeInTheDocument();

      // Click cancel
      const cancelButtons = screen.getAllByRole('button', { name: /Cancel/i });
      const detailsCancelButton = cancelButtons.find((btn) =>
        btn.className.includes('cancel-button')
      );
      fireEvent.click(detailsCancelButton!);

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });
});
