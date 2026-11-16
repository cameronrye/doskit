/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StartPage } from './StartPage';
import { availableApps } from '../config/apps.config';
import { countByKind } from '../utils/productionFilter';
import { loadStartPageState, saveStartPageState } from '../utils/startPageState';

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

  it('opens the DOS prompt from its menu item, saving the scroll position first', async () => {
    const { onOpenPrompt } = renderPage();
    await userEvent.click(screen.getByRole('button', { name: 'C:\\> DOS prompt' }));
    expect(onOpenPrompt).toHaveBeenCalledTimes(1);
    expect(loadStartPageState()).not.toBeNull();
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
