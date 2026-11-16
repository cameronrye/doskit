/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 */

import { describe, expect, it, vi } from 'vitest';
import { createEvent, fireEvent, render, screen } from '@testing-library/react';
import { RunBar } from './RunBar';
import { applyStylesheet, readStylesheets, resolveTokens } from '../test/stylesheets';

describe('RunBar', () => {
  it('names the production with its author and year', () => {
    const { container } = render(
      <RunBar title="Unreal" meta="Future Crew · 1993" status="ready" isOnline onBrowse={vi.fn()} />
    );

    expect(container.querySelector('.run-bar-title')).toHaveTextContent('Unreal');
    expect(container.querySelector('.run-bar-meta')).toHaveTextContent('Future Crew · 1993');
  });

  // The page's own heading is gone with the page: the name heads the running view, set as the
  // bar's other items are, in VT323 at the bar's 18px, not as a heading would be
  it("makes the name the running view's heading, in the bar's own type", async () => {
    const sheets = await readStylesheets();
    const applied = ['src/index.css', 'src/components/RunBar.css'].map((file) =>
      applyStylesheet(resolveTokens(sheets, sheets.get(file)!))
    );
    try {
      render(<RunBar title="Unreal" meta={null} status="ready" isOnline onBrowse={vi.fn()} />);
      const heading = screen.getByRole('heading', { level: 1, name: 'Unreal' });
      const style = getComputedStyle(heading);
      expect([style.fontSize, style.fontWeight, style.lineHeight]).toEqual([
        'inherit',
        'inherit',
        '1.5',
      ]);
    } finally {
      applied.forEach((sheet) => sheet.remove());
    }
  });

  it('shows just the name for a production with neither author nor year', () => {
    const { container } = render(
      <RunBar title="Anonymous" meta={null} status="ready" isOnline onBrowse={vi.fn()} />
    );

    expect(container.querySelector('.run-bar')).toHaveTextContent(/^◄ BrowseAnonymous/);
    expect(container.querySelector('.run-bar-meta')).not.toBeInTheDocument();
  });

  it.each([
    ['idle', 'Idle'],
    ['loading', 'Loading'],
    ['ready', 'Ready'],
    ['error', 'Error'],
  ] as const)('labels the %s status %s, with the network beside it', (status, label) => {
    const { rerender } = render(
      <RunBar title="Unreal" meta={null} status={status} isOnline onBrowse={vi.fn()} />
    );
    expect(screen.getByRole('status')).toHaveTextContent(`${label} · Online`);

    rerender(
      <RunBar title="Unreal" meta={null} status={status} isOnline={false} onBrowse={vi.fn()} />
    );
    expect(screen.getByRole('status')).toHaveTextContent(`${label} · Offline`);
  });

  it('hides its status while ready and online, and shows it otherwise', () => {
    const { rerender } = render(
      <RunBar title="Unreal" meta="Future Crew · 1993" status="ready" isOnline onBrowse={vi.fn()} />
    );
    expect(screen.getByRole('status')).toHaveTextContent('Ready · Online');
    expect(screen.getByRole('status')).toHaveClass('visually-hidden');
    rerender(
      <RunBar title="Unreal" meta={null} status="ready" isOnline={false} onBrowse={vi.fn()} />
    );
    expect(screen.getByRole('status')).not.toHaveClass('visually-hidden');
    rerender(<RunBar title="Unreal" meta={null} status="loading" isOnline onBrowse={vi.fn()} />);
    expect(screen.getByRole('status')).not.toHaveClass('visually-hidden');
  });

  it('keeps one status region in the page, so changes are announced', () => {
    const { rerender } = render(
      <RunBar title="Unreal" meta={null} status="loading" isOnline onBrowse={vi.fn()} />
    );
    const status = screen.getByRole('status');
    rerender(<RunBar title="Unreal" meta={null} status="ready" isOnline onBrowse={vi.fn()} />);
    expect(screen.getByRole('status')).toBe(status);
    expect(status).toHaveTextContent('Ready');
  });

  it('calls back from its buttons', () => {
    const onBrowse = vi.fn();
    const onAbout = vi.fn();
    const onFiles = vi.fn();
    render(
      <RunBar
        title="Tracker"
        meta={null}
        status="ready"
        isOnline
        onBrowse={onBrowse}
        onAbout={onAbout}
        onFiles={onFiles}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Browse' }));
    fireEvent.click(screen.getByRole('button', { name: 'About' }));
    fireEvent.click(screen.getByRole('button', { name: 'Files' }));

    expect(onBrowse).toHaveBeenCalledTimes(1);
    expect(onAbout).toHaveBeenCalledTimes(1);
    expect(onFiles).toHaveBeenCalledTimes(1);
  });

  it('takes no focus from a click on its buttons', () => {
    render(
      <RunBar
        title="Tracker"
        meta={null}
        status="ready"
        isOnline
        onBrowse={vi.fn()}
        onAbout={vi.fn()}
        onFiles={vi.fn()}
      />
    );

    for (const button of screen.getAllByRole('button')) {
      const event = createEvent.mouseDown(button);
      fireEvent(button, event);
      expect(event.defaultPrevented).toBe(true);
    }
    expect(screen.getAllByRole('button')).toHaveLength(3);
  });

  // The GPL notices must be reachable from every screen: the prompt's bar has no About
  it('links the licenses only when asked, in a new tab, and takes no focus from a click', () => {
    const { rerender } = render(
      <RunBar title="Unreal" meta={null} status="ready" isOnline onBrowse={vi.fn()} />
    );
    expect(screen.queryByRole('link', { name: 'Licenses' })).not.toBeInTheDocument();

    rerender(
      <RunBar
        title="DOS prompt"
        meta={null}
        status="ready"
        isOnline
        onBrowse={vi.fn()}
        showLicenses
      />
    );

    const link = screen.getByRole('link', { name: 'Licenses' });
    expect(link).toHaveAttribute('href', '/licenses/');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    expect(link).toHaveClass('dos-menu-item');
    const event = createEvent.mouseDown(link);
    fireEvent(link, event);
    expect(event.defaultPrevented).toBe(true);
  });

  it('offers About and Files only when given', () => {
    const { rerender } = render(
      <RunBar title="DOS prompt" meta={null} status="ready" isOnline onBrowse={vi.fn()} />
    );
    expect(screen.queryByRole('button', { name: 'About' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Files' })).not.toBeInTheDocument();

    rerender(
      <RunBar
        title="Unreal"
        meta={null}
        status="ready"
        isOnline
        onBrowse={vi.fn()}
        onAbout={vi.fn()}
      />
    );
    expect(screen.getByRole('button', { name: 'About' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Files' })).not.toBeInTheDocument();
  });

  it('hands its About and Files buttons to the refs it is given', () => {
    const aboutRef = { current: null as HTMLButtonElement | null };
    const filesRef = { current: null as HTMLButtonElement | null };
    render(
      <RunBar
        title="Tracker"
        meta={null}
        status="ready"
        isOnline
        onBrowse={vi.fn()}
        onAbout={vi.fn()}
        onFiles={vi.fn()}
        aboutButtonRef={aboutRef}
        filesButtonRef={filesRef}
      />
    );

    expect(aboutRef.current).toBe(screen.getByRole('button', { name: 'About' }));
    expect(filesRef.current).toBe(screen.getByRole('button', { name: 'Files' }));
  });
});
