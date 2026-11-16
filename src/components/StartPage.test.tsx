/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StartPage } from './StartPage';
import { availableApps } from '../config/apps.config';
import { countByKind } from '../utils/productionFilter';
import { loadStartPageState, saveStartPageState } from '../utils/startPageState';
import { applyStylesheet, readStylesheets, resolveTokens } from '../test/stylesheets';

const renderPage = (props: Partial<React.ComponentProps<typeof StartPage>> = {}) => {
  const onOpen = vi.fn();
  const onOpenPrompt = vi.fn();
  const view = render(
    <StartPage
      apps={availableApps}
      notice={null}
      onOpen={onOpen}
      onOpenPrompt={onOpenPrompt}
      {...props}
    />
  );
  return { onOpen, onOpenPrompt, ...view };
};

const links = () => within(screen.getByRole('list', { name: 'Productions' })).getAllByRole('link');

describe('StartPage', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  it('shows every production and the count in the tagline', () => {
    renderPage();
    // The visually hidden status also says "N productions", so ask the tagline itself
    expect(screen.getByText(/running in your browser/)).toHaveTextContent(
      `${availableApps.length} productions`
    );
    expect(links()).toHaveLength(availableApps.length);
  });

  it('sets the logo in display type with the stacked shadow, light magenta then blue', async () => {
    const sheets = await readStylesheets();
    const applied = ['src/index.css', 'src/components/StartPage.css'].map((file) =>
      applyStylesheet(resolveTokens(sheets, sheets.get(file)!))
    );
    try {
      renderPage();
      const logo = screen.getByRole('heading', { level: 1, name: 'DosKit' });
      expect(getComputedStyle(logo).textShadow.replace(/\s+/g, ' ')).toBe(
        '2px 2px 0 #ff55ff, 4px 4px 0 #0000aa'
      );
    } finally {
      applied.forEach((sheet) => sheet.remove());
    }
  });

  it('filters by kind, and says how many are shown', async () => {
    renderPage();
    await userEvent.click(screen.getByRole('button', { name: /^Trackers \d+$/ }));
    expect(screen.getByRole('button', { name: /^Trackers/ })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(screen.getByRole('status')).toHaveTextContent(
      `${countByKind(availableApps).tracker} productions`
    );
  });

  it('leaves out a kind with no productions', () => {
    renderPage({ apps: availableApps.filter((app) => app.kind === 'demo') });
    expect(screen.queryByRole('button', { name: /^Trackers/ })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Demos \d+$/ })).toBeInTheDocument();
  });

  it('shows an empty state that clears the search', async () => {
    renderPage();
    await userEvent.type(screen.getByRole('searchbox', { name: 'Search productions' }), 'zzzz');
    expect(screen.getByText('Nothing matches “zzzz”.')).toBeInTheDocument();
    expect(screen.queryByRole('list', { name: 'Productions' })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Clear search' }));
    expect(links()).toHaveLength(availableApps.length);
    expect(screen.getByRole('searchbox')).toHaveValue('');
  });

  it('focuses the search on /, and types / and r inside it', async () => {
    renderPage();
    await userEvent.keyboard('/');
    expect(screen.getByRole('searchbox')).toHaveFocus();
    await userEvent.keyboard('r/');
    expect(screen.getByRole('searchbox')).toHaveValue('r/');
  });

  it('clears the search on Escape, then leaves it', async () => {
    renderPage();
    const search = screen.getByRole('searchbox');
    await userEvent.type(search, 'crew');
    await userEvent.keyboard('{Escape}');
    expect(search).toHaveValue('');
    expect(search).toHaveFocus();
    await userEvent.keyboard('{Escape}');
    expect(search).not.toHaveFocus();
    expect(screen.getByRole('main')).toHaveFocus();
    await userEvent.keyboard('/');
    expect(search).toHaveFocus();
  });

  it('opens a random shown production on R, but not with Ctrl', async () => {
    const { onOpen } = renderPage();
    await userEvent.click(screen.getByRole('button', { name: /^Trackers \d+$/ }));
    await userEvent.keyboard('{Control>}r{/Control}');
    expect(onOpen).not.toHaveBeenCalled();
    await userEvent.keyboard('r');
    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(onOpen.mock.calls[0]?.[0].kind).toBe('tracker');
  });

  it('opens a random production from all when the search matches nothing', async () => {
    const { onOpen } = renderPage();
    await userEvent.type(screen.getByRole('searchbox'), 'zzzz');
    await userEvent.click(screen.getByText(/Nothing matches/));
    await userEvent.keyboard('R');
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it('opens the DOS prompt from its menu item', async () => {
    const { onOpenPrompt } = renderPage();
    await userEvent.click(screen.getByRole('button', { name: 'C:\\> DOS prompt' }));
    expect(onOpenPrompt).toHaveBeenCalledTimes(1);
  });

  it('saves the scroll position before opening a production or the prompt', async () => {
    const { onOpen, onOpenPrompt } = renderPage();
    const page = screen.getByRole('main');
    page.scrollTop = 321;
    onOpen.mockImplementation(() => expect(loadStartPageState()?.scrollTop).toBe(321));
    await userEvent.click(links()[0] as HTMLElement);
    expect(onOpen).toHaveBeenCalledTimes(1);
    page.scrollTop = 654;
    onOpenPrompt.mockImplementation(() => expect(loadStartPageState()?.scrollTop).toBe(654));
    await userEvent.click(screen.getByRole('button', { name: 'C:\\> DOS prompt' }));
    expect(onOpenPrompt).toHaveBeenCalledTimes(1);
  });

  it('restores the saved scroll position', () => {
    saveStartPageState({ kind: 'all', query: '', scrollTop: 480, focusId: null });
    renderPage();
    expect(screen.getByRole('main').scrollTop).toBe(480);
  });

  it('leaves the search its focus when the grid comes back after returning', async () => {
    saveStartPageState({ kind: 'all', query: '', scrollTop: 0, focusId: 'fishtro' });
    renderPage();
    const search = screen.getByRole('searchbox');
    await userEvent.click(search);
    await userEvent.type(search, 'zzzz');
    await userEvent.type(search, '{Backspace>4/}');
    expect(links()).toHaveLength(availableApps.length);
    expect(search).toHaveFocus();
  });

  it('falls back to all when the saved kind has no productions', () => {
    saveStartPageState({ kind: 'tracker', query: '', scrollTop: 0, focusId: null });
    renderPage({ apps: availableApps.filter((app) => app.kind === 'demo') });
    expect(screen.getByRole('button', { name: /^All/ })).toHaveAttribute('aria-pressed', 'true');
    expect(links().length).toBeGreaterThan(0);
  });

  it('ignores a held R key', async () => {
    const { onOpen } = renderPage();
    const page = screen.getByRole('main');
    fireEvent.keyDown(page, { key: 'r' });
    fireEvent.keyDown(page, { key: 'r', repeat: true });
    fireEvent.keyDown(page, { key: 'r', repeat: true });
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it('opens a production from its link', async () => {
    const { onOpen } = renderPage();
    await userEvent.click(links()[0] as HTMLElement);
    expect(onOpen).toHaveBeenCalledWith(availableApps[0]);
  });

  it('shows the highlighted production in the info window, starting on the first', () => {
    renderPage();
    const info = screen.getByRole('complementary', { name: 'Highlighted production' });
    expect(info).toHaveTextContent(availableApps[0]?.description ?? '');
  });

  it('restores kind, query and focus from the saved state, ignoring a missing focus id', () => {
    saveStartPageState({ kind: 'intro', query: 'crew', scrollTop: 0, focusId: 'fishtro' });
    const first = renderPage();
    expect(screen.getByRole('button', { name: /^Intros/ })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('searchbox')).toHaveValue('crew');
    first.unmount();

    saveStartPageState({ kind: 'all', query: '', scrollTop: 0, focusId: 'fishtro' });
    renderPage();
    expect(screen.getByRole('link', { name: /^Fishtro/ })).toHaveFocus();
    // Fishtro is an intro, so reset the state to the unfiltered page
    expect(links()).toHaveLength(availableApps.length);
  });

  it('starts on the first production when the saved focus id is gone', () => {
    saveStartPageState({ kind: 'all', query: '', scrollTop: 0, focusId: 'gone' });
    renderPage();
    expect(links()[0]).toHaveAttribute('tabindex', '0');
  });

  it('saves its state as it changes', async () => {
    renderPage();
    await userEvent.type(screen.getByRole('searchbox'), 'x');
    expect(loadStartPageState()?.query).toBe('x');
  });

  it('shows the notice as an alert', () => {
    renderPage({ notice: 'No production called "nope".' });
    expect(screen.getByRole('alert')).toHaveTextContent('No production called "nope".');
  });
});
