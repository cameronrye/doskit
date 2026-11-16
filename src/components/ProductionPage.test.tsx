/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProductionPage, type ProductionPageStatus } from './ProductionPage';
import { availableApps } from '../config/apps.config';
import { loadAppPage } from '../config/appPages';
import type { DosApp } from '../types/dos-app';

const make = (id: string, extra: Partial<DosApp> = {}): DosApp =>
  ({
    id,
    name: id,
    description: `About ${id}`,
    author: 'Someone',
    year: 1993,
    kind: 'demo',
    archiveBytes: 2_500_000,
    ...extra,
  }) as DosApp;

const unreal = availableApps.find((app) => app.id === 'unreal')!;
const READY: ProductionPageStatus = { kind: 'ready' };

const renderPage = async (props: Partial<React.ComponentProps<typeof ProductionPage>> = {}) => {
  const handlers = {
    onPlay: vi.fn(),
    onRetry: vi.fn(),
    onCancel: vi.fn(),
    onBrowse: vi.fn(),
    onAbout: vi.fn(),
    onOpenApp: vi.fn(),
  };
  const view = render(
    <ProductionPage app={unreal} apps={availableApps} status={READY} {...handlers} {...props} />
  );
  // The screenshot's alt text arrives with the page file
  await act(async () => {
    await loadAppPage(props.app?.id ?? unreal.id);
  });
  return { ...handlers, ...view };
};

describe('ProductionPage', () => {
  afterEach(() => {
    Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true });
  });

  it('offers Play, focused, once ready', async () => {
    await renderPage();
    const play = screen.getByRole('button', { name: 'Play' });
    expect(play).toHaveClass('doskit-play-button');
    expect(play).toHaveFocus();
    expect(screen.getByRole('heading', { level: 1, name: 'Unreal' })).toBeInTheDocument();
    expect(screen.getByAltText(/\S/)).toBeInTheDocument();
  });

  it('calls onPlay from the button', async () => {
    const { onPlay } = await renderPage();
    await userEvent.click(screen.getByRole('button', { name: 'Play' }));
    expect(onPlay).toHaveBeenCalledOnce();
  });

  it('shows the download without announcing its figure, and Cancel', async () => {
    const loading = (loadedBytes: number): ProductionPageStatus => ({
      kind: 'loading',
      progress: { loadedBytes, totalBytes: 100 },
    });
    const { rerender, onCancel, ...handlers } = await renderPage({ status: loading(50) });
    const props = { app: unreal, apps: availableApps, onCancel, ...handlers };
    expect(screen.getByText('Downloading… 50%')).toBeInTheDocument();
    expect(screen.getByText('Downloading Unreal…')).toHaveAttribute('role', 'status');
    const bar = screen.getByRole('progressbar', { name: 'Download progress' });
    expect(bar).toHaveAttribute('aria-valuenow', '50');
    expect(screen.queryByRole('button', { name: 'Play' })).not.toBeInTheDocument();

    rerender(<ProductionPage {...props} status={loading(80)} />);
    // The status stays as it was, so that screen readers say it once
    expect(screen.getByText('Downloading Unreal…')).toBeInTheDocument();
    expect(screen.getByText('Downloading… 80%')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '80');

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('shows an indeterminate bar without a size', async () => {
    await renderPage({
      status: { kind: 'loading', progress: { loadedBytes: 2_000_000, totalBytes: null } },
    });
    const bar = screen.getByRole('progressbar', { name: 'Download progress' });
    expect(bar).not.toHaveAttribute('aria-valuenow');
    expect(screen.getByText('Downloading… 2.0 MB')).not.toHaveAttribute('aria-hidden');
  });

  it('shows an error with Try Again', async () => {
    const { onRetry } = await renderPage({
      status: {
        kind: 'error',
        error: { message: 'No connection', suggestion: 'Check it', originalError: 'boom' },
      },
    });
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('No connection');
    expect(alert).toHaveTextContent('Check it');
    expect(alert).toHaveTextContent('boom');
    await userEvent.click(screen.getByRole('button', { name: 'Try Again' }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('opens About on I and browses on Escape, but not from Ctrl+I', async () => {
    const { onAbout, onBrowse } = await renderPage();
    const play = screen.getByRole('button', { name: 'Play' });
    fireEvent.keyDown(play, { key: 'i', ctrlKey: true });
    fireEvent.keyDown(play, { key: 'Escape', metaKey: true });
    expect(onAbout).not.toHaveBeenCalled();
    expect(onBrowse).not.toHaveBeenCalled();

    fireEvent.keyDown(play, { key: 'I' });
    expect(onAbout).toHaveBeenCalledOnce();
    fireEvent.keyDown(play, { key: 'Escape' });
    expect(onBrowse).toHaveBeenCalledWith();
  });

  it('plays on Enter from the page itself, but not while loading or on repeat', async () => {
    const { onPlay, onAbout, container, rerender, ...handlers } = await renderPage();
    const root = container.querySelector('.production-page')!;
    fireEvent.keyDown(root, { key: 'i', repeat: true });
    expect(onAbout).not.toHaveBeenCalled();
    fireEvent.keyDown(root, { key: 'Enter' });
    expect(onPlay).toHaveBeenCalledOnce();

    rerender(
      <ProductionPage
        app={unreal}
        apps={availableApps}
        status={{ kind: 'loading', progress: null }}
        onPlay={onPlay}
        onAbout={onAbout}
        {...handlers}
      />
    );
    fireEvent.keyDown(root, { key: 'Enter' });
    expect(onPlay).toHaveBeenCalledOnce();
  });

  it('keeps its keys after Try Again unmounts the focused button', async () => {
    const error: ProductionPageStatus = { kind: 'error', error: { message: 'No connection' } };
    const { rerender, container, onAbout, ...handlers } = await renderPage({ status: error });
    const retry = screen.getByRole('button', { name: 'Try Again' });
    retry.focus();
    rerender(
      <ProductionPage
        app={unreal}
        apps={availableApps}
        status={{ kind: 'loading', progress: null }}
        onAbout={onAbout}
        {...handlers}
      />
    );
    expect(container.querySelector('.production-page')).toHaveFocus();
    await userEvent.keyboard('i');
    expect(onAbout).toHaveBeenCalledOnce();
  });

  describe('focus', () => {
    const LOADING: ProductionPageStatus = { kind: 'loading', progress: null };
    const FAILED: ProductionPageStatus = { kind: 'error', error: { message: 'No connection' } };
    const outside = () => {
      const dialog = document.createElement('button');
      document.body.append(dialog);
      dialog.focus();
      return dialog;
    };

    it.each([
      ['ready', READY],
      ['error', FAILED],
    ])('leaves a focus outside the page alone as loading becomes %s', async (_name, next) => {
      const { rerender, onPlay, onRetry, onCancel, onBrowse, onAbout, onOpenApp } =
        await renderPage({ status: LOADING });
      const dialog = outside();
      const handlers = { onPlay, onRetry, onCancel, onBrowse, onAbout, onOpenApp };
      rerender(<ProductionPage app={unreal} apps={availableApps} status={next} {...handlers} />);
      expect(dialog).toHaveFocus();
      dialog.remove();
    });

    it('focuses Play when loading becomes ready with nothing focused', async () => {
      const { rerender, container, ...handlers } = await renderPage({ status: LOADING });
      expect(container.querySelector('.production-page')).toHaveFocus();
      (document.activeElement as HTMLElement).blur();
      rerender(<ProductionPage app={unreal} apps={availableApps} status={READY} {...handlers} />);
      expect(screen.getByRole('button', { name: 'Play' })).toHaveFocus();
    });
  });

  it('leaves the keys to a text field', async () => {
    const { onAbout, container } = await renderPage();
    const field = document.createElement('input');
    container.querySelector('.production-page')?.append(field);
    fireEvent.keyDown(field, { key: 'i' });
    expect(onAbout).not.toHaveBeenCalled();
  });

  it('opens About from its button, which takes the ref', async () => {
    const ref = { current: null as HTMLButtonElement | null };
    const { onAbout } = await renderPage({ aboutButtonRef: ref });
    const about = screen.getByRole('button', { name: 'About' });
    expect(ref.current).toBe(about);
    await userEvent.click(about);
    expect(onAbout).toHaveBeenCalledOnce();
  });

  it('browses to its kind from the breadcrumb, and home from the logo', async () => {
    const { onBrowse } = await renderPage({ app: make('d1'), apps: [make('d1')] });
    const crumbs = screen.getByRole('navigation', { name: 'Breadcrumb' });
    await userEvent.click(within(crumbs).getByRole('button', { name: 'Demos' }));
    expect(onBrowse).toHaveBeenLastCalledWith('demo');
    await userEvent.click(screen.getByRole('link', { name: 'DosKit' }));
    expect(onBrowse).toHaveBeenLastCalledWith();
  });

  it('lists more by the same author, and none for an author with one production', async () => {
    const a = make('a', { author: 'Future Crew' });
    const b = make('b', { author: 'Future Crew' });
    const c = make('c', { author: 'Other' });
    const { unmount, onOpenApp } = await renderPage({ app: a, apps: [a, b, c] });
    const list = screen.getByRole('list', { name: 'More by Future Crew' });
    expect(within(list).getAllByRole('link')).toHaveLength(1);
    await userEvent.click(within(list).getByRole('link'));
    expect(onOpenApp).toHaveBeenCalledWith(b);
    unmount();

    await renderPage({ app: c, apps: [a, b, c] });
    expect(screen.queryByRole('list', { name: /More by/ })).not.toBeInTheDocument();
  });

  it('shows the flashing warning, the content note and the start note', async () => {
    const app = make('f', {
      flashing: true,
      contentNote: 'Contains a bare chest.',
      startNote: 'Press a key at the menu.',
    });
    await renderPage({ app, apps: [app] });
    expect(screen.getByText(/flashing lights/)).toBeInTheDocument();
    expect(screen.getByText('Contains a bare chest.')).toBeInTheDocument();
    expect(screen.getByText('Press a key at the menu.')).toBeInTheDocument();
    expect(screen.getByText('2.5 MB')).toBeInTheDocument();
  });

  it('says when the link is copied, and when it could not be shared', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    await renderPage();
    await userEvent.click(screen.getByRole('button', { name: 'Share' }));
    expect(writeText).toHaveBeenCalledWith('https://doskit.net/unreal');
    expect(await screen.findByText('Link copied')).toBeInTheDocument();

    writeText.mockRejectedValue(new Error('denied'));
    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: 'Share' }));
    });
    expect(await screen.findByText("Couldn't share this link")).toBeInTheDocument();
  });
});
