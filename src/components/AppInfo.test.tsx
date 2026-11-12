/**
 * Tests for the About panel: what a production is, who made it, where it was shown, how
 * faithful DosKit's version is, and its terms
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { AppInfo } from './AppInfo';
import { findAppById } from '../config/apps.config';
import type { DosApp } from '../types/dos-app';

const panic = findAppById('panic')!;

describe('AppInfo', () => {
  it("tells what the production is, once its page's text has loaded", async () => {
    render(<AppInfo app={panic} onClose={() => {}} />);

    const panel = screen.getByRole('dialog', { name: 'Panic' });
    expect(await within(panel).findByText(/shown at The Party 1992/)).toBeInTheDocument();
    expect(within(panel).getByText(/Music by Purple Motion/)).toBeInTheDocument();
    expect(within(panel).getByText('Future Crew · 1993')).toBeInTheDocument();
  });

  it('says how faithful DosKit is to the original, and what its terms are', async () => {
    render(<AppInfo app={panic} onClose={() => {}} />);

    expect(await screen.findByRole('heading', { name: 'How it runs here' })).toBeInTheDocument();
    expect(
      screen.getByText(/fractal part runs two and a half to three times faster/)
    ).toBeInTheDocument();
    expect(screen.getByText(/only in its complete original condition/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'pouet.net' })).toHaveAttribute(
      'href',
      'https://www.pouet.net/prod.php?which=479'
    );
  });

  it('warns of flashing lights', async () => {
    render(<AppInfo app={panic} onClose={() => {}} />);

    expect(await screen.findByText(/contains flashing lights/i)).toBeInTheDocument();
  });

  it('tells rights holders how to reach the owner', async () => {
    render(<AppInfo app={panic} onClose={() => {}} />);

    expect(await screen.findByText(/cameron@rye\.dev/)).toBeInTheDocument();
  });

  it('shows the description of an app with no page text', async () => {
    const app: DosApp = { ...panic, id: 'no-page', name: 'No Page', description: 'Just a line' };
    render(<AppInfo app={app} onClose={() => {}} />);

    expect(await screen.findByText('Just a line')).toBeInTheDocument();
  });

  it('takes the focus as it opens, and closes on Escape or its Close button', () => {
    const onClose = vi.fn();
    render(<AppInfo app={panic} onClose={onClose} />);
    const close = screen.getByRole('button', { name: 'Close' });

    expect(close).toHaveFocus();
    fireEvent.keyDown(close, { key: 'Escape' });
    fireEvent.click(close);

    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('keeps Tab inside the panel, which covers the page', async () => {
    render(<AppInfo app={panic} onClose={() => {}} />);
    const close = screen.getByRole('button', { name: 'Close' });
    const lastLink = (await screen.findAllByRole('link')).at(-1)!;

    lastLink.focus();
    fireEvent.keyDown(lastLink, { key: 'Tab' });
    expect(close).toHaveFocus();

    fireEvent.keyDown(close, { key: 'Tab', shiftKey: true });
    expect(lastLink).toHaveFocus();
  });

  it("holds what its caller adds, such as a tracker's files", () => {
    render(
      <AppInfo app={panic} onClose={() => {}}>
        <p>Your files</p>
      </AppInfo>
    );

    expect(screen.getByText('Your files')).toBeInTheDocument();
  });
});
