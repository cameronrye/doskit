/**
 * Tests for UpdateNotification component
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UpdateNotification } from './UpdateNotification';
import {
  applyStylesheet,
  classesIn,
  contrastRatio,
  keyframesIn,
  readStylesheets,
  styles,
} from '../test/stylesheets';

describe('UpdateNotification', () => {
  let mockRegistration: ServiceWorkerRegistration;
  let mockWaiting: ServiceWorker;
  let originalLocation: Location;
  // navigator.serviceWorker, which tells the page that the new worker has taken control
  let serviceWorker: EventTarget;
  const takeControl = () => serviceWorker.dispatchEvent(new Event('controllerchange'));

  beforeEach(() => {
    vi.clearAllMocks();

    // Save original location
    originalLocation = window.location;

    // Mock window.location.reload
    Object.defineProperty(window, 'location', {
      value: { ...originalLocation, reload: vi.fn() },
      writable: true,
      configurable: true,
    });

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
    };

    // Mock ServiceWorkerRegistration
    const registration: Partial<ServiceWorkerRegistration> = {
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
    };
    mockRegistration = registration as ServiceWorkerRegistration;

    serviceWorker = new EventTarget();
    Object.defineProperty(navigator, 'serviceWorker', {
      value: serviceWorker,
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
    // jsdom has no navigator.serviceWorker
    Reflect.deleteProperty(navigator, 'serviceWorker');
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
        expect(
          screen.getByText(/A new version of DosKit is ready to install/i)
        ).toBeInTheDocument();
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

  // It covers the page, so it is a modal dialog for keyboards and screen readers too
  describe('as a dialog', () => {
    /** The prompt, with a control of the page behind it */
    const renderOverPage = (onDismiss?: () => void) =>
      render(
        <>
          <button>Change Application</button>
          <UpdateNotification registration={mockRegistration} onDismiss={onDismiss} />
        </>
      );
    const updateNow = () => screen.getByRole('button', { name: 'Update Now' });
    const later = () => screen.getByRole('button', { name: 'Later' });

    it('is a modal alert dialog, named by its title and described by its message', () => {
      render(<UpdateNotification registration={mockRegistration} />);

      const dialog = screen.getByRole('alertdialog', { name: 'Update Available' });
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAccessibleDescription(
        'A new version of DosKit is ready to install. Update now to get the latest features and improvements.'
      );
      expect(dialog.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    });

    // It can appear while someone types into a DOS program: on Later, a key they meant for
    // DOS reloads nothing
    it('takes the focus to Later when it appears', () => {
      renderOverPage();

      expect(later()).toHaveFocus();
    });

    it('answers Escape as it does Later', async () => {
      const user = userEvent.setup();
      const onDismiss = vi.fn();
      renderOverPage(onDismiss);

      await user.keyboard('{Escape}');

      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
      expect(onDismiss).toHaveBeenCalledOnce();
      expect(mockWaiting.postMessage).not.toHaveBeenCalled();
    });

    it('keeps Tab and Shift+Tab to its buttons', async () => {
      const user = userEvent.setup();
      renderOverPage();

      await user.tab();
      expect(updateNow()).toHaveFocus();
      await user.tab();
      expect(later()).toHaveFocus();
      await user.tab({ shift: true });
      expect(updateNow()).toHaveFocus();
      // Back from the first button to the last, not out to the page behind
      await user.tab({ shift: true });
      expect(later()).toHaveFocus();
    });

    // A click on its text gives the dialog itself the focus
    it('goes back to its last button with Shift from the dialog itself', async () => {
      const user = userEvent.setup();
      renderOverPage();
      await user.click(screen.getByText(/A new version of DosKit/));

      await user.tab({ shift: true });

      expect(later()).toHaveFocus();
    });

    it('keeps the focus when it is clicked outside its buttons', async () => {
      const user = userEvent.setup();
      renderOverPage();

      await user.click(screen.getByText(/A new version of DosKit/));
      await user.tab();
      expect(updateNow()).toHaveFocus();

      // The backdrop, which covers the page around the prompt
      await user.click(document.querySelector('.update-notification-overlay')!);
      await user.tab();
      expect(later()).toHaveFocus();
    });

    it('gives the focus back to where it was once it closes', async () => {
      const user = userEvent.setup();
      const { rerender } = render(<button>Change Application</button>);
      const behind = screen.getByRole('button', { name: 'Change Application' });
      behind.focus();
      rerender(
        <>
          <button>Change Application</button>
          <UpdateNotification registration={mockRegistration} />
        </>
      );
      expect(later()).toHaveFocus();

      await user.click(later());

      expect(behind).toHaveFocus();
    });
  });

  describe('once another tab has updated', () => {
    // Update Now there let the new worker take over this tab too, which still runs the
    // version it loaded
    const renderUpdatedInAnotherTab = (
      onUpdateRequested?: () => void,
      waiting: ServiceWorker | null = null
    ) =>
      render(
        <UpdateNotification
          registration={{ ...mockRegistration, waiting }}
          updatedInAnotherTab
          onUpdateRequested={onUpdateRequested}
        />
      );

    it('says so, and offers to reload', () => {
      renderUpdatedInAnotherTab();

      const dialog = screen.getByRole('alertdialog', { name: 'Update Installed' });
      expect(dialog).toHaveAccessibleDescription(
        'DosKit was updated in another tab. Reload to use the new version.'
      );
      expect(screen.getByRole('button', { name: 'Reload' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Later' })).toHaveFocus();
      expect(screen.queryByRole('button', { name: 'Update Now' })).not.toBeInTheDocument();
    });

    it('only reloads on Reload, even with a newer update waiting by then', () => {
      // That update is offered once the page has reloaded; Reload does not accept it
      const onUpdateRequested = vi.fn();
      renderUpdatedInAnotherTab(onUpdateRequested, mockWaiting);

      fireEvent.click(screen.getByRole('button', { name: 'Reload' }));

      expect(window.location.reload).toHaveBeenCalledOnce();
      expect(mockWaiting.postMessage).not.toHaveBeenCalled();
      expect(onUpdateRequested).not.toHaveBeenCalled();
    });
  });

  it('says when its Update Now asks the waiting worker to take over', () => {
    // Before it asks, so that the controllerchange that follows is known to be this tab's
    const onUpdateRequested = vi.fn();
    const calledFirst = vi.fn(() => onUpdateRequested.mock.calls.length === 1);
    mockWaiting.postMessage = calledFirst;
    render(
      <UpdateNotification registration={mockRegistration} onUpdateRequested={onUpdateRequested} />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Update Now' }));

    expect(onUpdateRequested).toHaveBeenCalledOnce();
    expect(calledFirst).toHaveReturnedWith(true);
  });

  // With fake timers, which the fallback reload waits on. No waitFor: it waits on a
  // timer itself, and Vitest's fake timers would keep it waiting
  describe('Update functionality', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    const clickUpdateNow = () =>
      fireEvent.click(screen.getByRole('button', { name: /Update Now/i }));

    it('asks the waiting worker to take over when Update Now is clicked', () => {
      render(<UpdateNotification registration={mockRegistration} />);

      clickUpdateNow();

      expect(mockWaiting.postMessage).toHaveBeenCalledWith({ type: 'SKIP_WAITING' });
    });

    it('reloads once the new worker has taken control, and only then', () => {
      render(<UpdateNotification registration={mockRegistration} />);

      clickUpdateNow();
      expect(window.location.reload).not.toHaveBeenCalled();
      takeControl();

      expect(window.location.reload).toHaveBeenCalledOnce();
      // Its fallback reload is called off. (Pending timers are not counted: focusing a
      // button makes jsdom schedule a selectionchange event.)
      vi.advanceTimersByTime(10_000);
      expect(window.location.reload).toHaveBeenCalledOnce();
    });

    it('listens for the new worker before it asks it to take over', () => {
      // A worker that takes control while the message is still being sent
      mockWaiting.postMessage = vi.fn(takeControl);
      render(<UpdateNotification registration={mockRegistration} />);

      clickUpdateNow();

      expect(window.location.reload).toHaveBeenCalledOnce();
    });

    it('reloads 7 seconds after Update Now when the new worker never takes control', () => {
      // It waits 1, 2 and 4 seconds for controllerchange
      render(<UpdateNotification registration={mockRegistration} />);
      clickUpdateNow();

      vi.advanceTimersByTime(6999);
      expect(window.location.reload).not.toHaveBeenCalled();
      vi.advanceTimersByTime(1);
      expect(window.location.reload).toHaveBeenCalledOnce();
    });

    it('stops waiting for the new worker once the prompt is gone', () => {
      const { unmount } = render(<UpdateNotification registration={mockRegistration} />);
      clickUpdateNow();

      unmount();

      vi.advanceTimersByTime(10_000);
      expect(window.location.reload).not.toHaveBeenCalled();
    });

    it('reloads at once when another tab has already let the update take over', () => {
      // Update Now in another tab activated the worker this prompt is for: nothing waits
      render(<UpdateNotification registration={{ ...mockRegistration, waiting: null }} />);

      clickUpdateNow();

      expect(window.location.reload).toHaveBeenCalledOnce();
      vi.advanceTimersByTime(10_000);
      expect(window.location.reload).toHaveBeenCalledOnce();
    });

    it('reloads at once when it cannot message the waiting worker', () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockWaiting.postMessage = vi.fn().mockImplementation(() => {
        throw new Error('Failed to post message');
      });
      render(<UpdateNotification registration={mockRegistration} />);

      clickUpdateNow();

      expect(consoleError).toHaveBeenCalledWith(
        expect.stringContaining('Error sending SKIP_WAITING message'),
        expect.any(Error)
      );
      expect(window.location.reload).toHaveBeenCalledOnce();
      vi.advanceTimersByTime(10_000);
      expect(window.location.reload).toHaveBeenCalledOnce();
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
    const importForProduction = async () =>
      (await import('./UpdateNotification')).UpdateNotification;

    it('logs nothing below warnings while Update Now waits for the new worker', async () => {
      const Notification = await importForProduction();
      const lines: string[] = [];
      for (const method of ['log', 'info', 'debug'] as const) {
        vi.spyOn(console, method).mockImplementation((...args: unknown[]) => {
          lines.push(args.join(' '));
        });
      }
      render(<Notification registration={mockRegistration} />);

      fireEvent.click(screen.getByRole('button', { name: /Update Now/i }));
      vi.advanceTimersByTime(7000);

      expect(window.location.reload).toHaveBeenCalledOnce();
      expect(lines).toEqual([]);
    });

    it('still reports a waiting worker it cannot message', async () => {
      const Notification = await importForProduction();
      const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockWaiting.postMessage = vi.fn().mockImplementation(() => {
        throw new Error('Failed to post message');
      });
      render(<Notification registration={mockRegistration} />);

      fireEvent.click(screen.getByRole('button', { name: /Update Now/i }));

      expect(errors).toHaveBeenCalledWith(
        expect.stringContaining('Error sending SKIP_WAITING message'),
        expect.any(Error)
      );
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

  describe('its stylesheet', () => {
    const OWN = 'src/components/UpdateNotification.css';

    it('names its animations so that no other stylesheet replaces them', async () => {
      // Keyframes are global: of two with one name, the page uses the one it loads last
      const sheets = await readStylesheets();
      const own = keyframesIn(sheets.get(OWN)!);
      const others = [...sheets]
        .filter(([file]) => file !== OWN)
        .flatMap(([, css]) => keyframesIn(css));

      expect(own).not.toEqual([]);
      expect(own.filter((name, i) => others.includes(name) || own.indexOf(name) !== i)).toEqual([]);
    });

    it("styles no class that js-dos's stylesheet styles too", async () => {
      const sheets = await readStylesheets();

      expect(
        classesIn(sheets.get(OWN)!).filter((name) => styles(sheets.get('js-dos.css')!, name))
      ).toEqual([]);
    });

    it("keeps Update Now's label readable, at 4.5:1 against the button", async () => {
      const sheet = applyStylesheet((await readStylesheets()).get(OWN)!);
      try {
        render(<UpdateNotification registration={mockRegistration} />);

        const { color, backgroundColor } = getComputedStyle(
          screen.getByRole('button', { name: 'Update Now' })
        );
        expect(contrastRatio(color, backgroundColor)).toBeGreaterThanOrEqual(4.5);
      } finally {
        sheet.remove();
      }
    });
  });

  describe('State management', () => {
    it('should show notification when registration changes from null to valid', () => {
      const { rerender } = render(<UpdateNotification registration={null} />);

      expect(screen.queryByText('Update Available')).not.toBeInTheDocument();

      rerender(<UpdateNotification registration={mockRegistration} />);

      expect(screen.getByText('Update Available')).toBeInTheDocument();
    });
  });
});
