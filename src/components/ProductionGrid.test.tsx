/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import { createEvent, fireEvent, render, screen } from '@testing-library/react';
import { ProductionGrid } from './ProductionGrid';
import type { DosApp } from '../types/dos-app';

const make = (id: string, name: string, author?: string, year?: number): DosApp =>
  ({ id, name, description: '', author, year, kind: 'demo' }) as DosApp;

const apps: DosApp[] = [
  make('unreal', 'Unreal', 'Future Crew', 1992),
  make('second-reality', 'Second Reality', 'Future Crew', 1993),
  make('a3', 'Three'),
  make('a4', 'Four'),
  make('a5', 'Five'),
  make('a6', 'Six'),
  make('a7', 'Seven'),
];
const last = apps.length - 1;

const renderGrid = (props: Partial<React.ComponentProps<typeof ProductionGrid>> = {}) => {
  const onOpen = vi.fn();
  const onActiveChange = vi.fn();
  const onHighlight = vi.fn();
  render(
    <ProductionGrid
      apps={apps}
      label="Productions"
      onOpen={onOpen}
      activeId={null}
      onActiveChange={onActiveChange}
      onHighlight={onHighlight}
      {...props}
    />
  );
  return { onOpen, onActiveChange, onHighlight };
};

const linkAt = (index: number) => screen.getAllByRole('link')[index]!;
const press = (key: string, init: object = {}) =>
  fireEvent.keyDown(document.activeElement!, { key, ...init });

/** jsdom has no layout: report the offsets a browser gives a grid of this many columns */
const layOutGrid = (columns: number) => {
  const position = (el: HTMLElement) =>
    el.parentElement?.tagName === 'UL' ? Array.from(el.parentElement.children).indexOf(el) : -1;
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

afterEach(() => vi.restoreAllMocks());

/**
 * Click a link and report whether the app took the click over. The click is then cancelled,
 * as jsdom would otherwise log that it can't navigate.
 */
const clickTakenOver = (link: HTMLElement, init: object) => {
  let taken = false;
  const record = (event: Event) => {
    taken = event.defaultPrevented;
    event.preventDefault();
  };
  document.addEventListener('click', record);
  fireEvent(link, createEvent.click(link, init));
  document.removeEventListener('click', record);
  return taken;
};

describe('ProductionGrid', () => {
  it('lists the productions as links with a name, author and short year', () => {
    renderGrid();
    expect(screen.getByRole('list', { name: 'Productions' })).toBeInTheDocument();
    const link = screen.getByRole('link', { name: /Unreal/ });
    expect(link).toHaveAttribute('href', '/unreal');
    expect(link).toHaveAccessibleName("Unreal Future Crew '92");
    expect(screen.getByRole('link', { name: /Second Reality/ })).toHaveAttribute(
      'href',
      '/secondreality'
    );
  });

  it('opens on a plain click, without a page load', () => {
    const { onOpen } = renderGrid();
    const link = screen.getByRole('link', { name: /Unreal/ });
    expect(clickTakenOver(link, { button: 0 })).toBe(true);
    expect(onOpen).toHaveBeenCalledWith(expect.objectContaining({ id: 'unreal' }));
  });

  it.each([
    { ctrlKey: true },
    { metaKey: true },
    { shiftKey: true },
    { altKey: true },
    { button: 1 },
  ])('leaves %o clicks to the browser', (init) => {
    const { onOpen } = renderGrid();
    const link = screen.getByRole('link', { name: /Unreal/ });
    expect(clickTakenOver(link, init)).toBe(false);
    expect(onOpen).not.toHaveBeenCalled();
  });

  // The pointer only highlights: were the tab stop to follow it, Tab from a link with the
  // focus could land on whichever link the pointer last crossed
  it('highlights the app under the pointer, and moves the tab stop with the focus only', () => {
    const { onActiveChange, onHighlight } = renderGrid();
    fireEvent.mouseEnter(linkAt(2));
    expect(onHighlight).toHaveBeenLastCalledWith(apps[2]);
    expect(onActiveChange).not.toHaveBeenCalled();
    fireEvent.focus(linkAt(3));
    expect(onHighlight).toHaveBeenLastCalledWith(apps[3]);
    expect(onActiveChange).toHaveBeenLastCalledWith(apps[3]);
  });

  it('has one tab stop, on the active app', () => {
    renderGrid({ activeId: 'a4' });
    const stops = screen.getAllByRole('link').filter((l) => l.tabIndex === 0);
    expect(stops).toEqual([linkAt(3)]);
  });

  it('falls back to the first app when activeId names none of them', () => {
    renderGrid({ activeId: 'gone' });
    expect(linkAt(0)).toHaveAttribute('tabindex', '0');
    expect(linkAt(1)).toHaveAttribute('tabindex', '-1');
  });

  it('focuses the active link on mount when asked', () => {
    renderGrid({ activeId: 'a4', autoFocusActive: true });
    expect(linkAt(3)).toHaveFocus();
  });

  describe('keyboard', () => {
    it('moves down in a four-column grid', () => {
      layOutGrid(4);
      renderGrid();
      linkAt(0).focus();
      press('ArrowDown');
      expect(linkAt(4)).toHaveFocus();
    });

    it('moves up in a two-column grid', () => {
      layOutGrid(2);
      renderGrid();
      linkAt(5).focus();
      press('ArrowUp');
      expect(linkAt(3)).toHaveFocus();
    });

    it('measures the columns again on each key press', () => {
      layOutGrid(4);
      renderGrid();
      linkAt(0).focus();
      press('ArrowDown');
      layOutGrid(3);
      press('ArrowDown');
      expect(linkAt(7 > last ? last : 7)).toHaveFocus();
    });

    it('moves one at a time when the grid has no layout to measure', () => {
      renderGrid();
      linkAt(0).focus();
      press('ArrowDown');
      expect(linkAt(1)).toHaveFocus();
    });

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
    ])('%s from app %i moves to app %i', (key, from, to) => {
      layOutGrid(4);
      renderGrid();
      linkAt(from).focus();
      press(key!);
      expect(linkAt(to)).toHaveFocus();
    });

    it.each([{ altKey: true }, { ctrlKey: true }, { metaKey: true }])(
      'leaves %o combinations to the browser',
      (init) => {
        renderGrid();
        linkAt(0).focus();
        const event = createEvent.keyDown(document.activeElement!, { key: 'ArrowRight', ...init });
        fireEvent(document.activeElement!, event);
        expect(event.defaultPrevented).toBe(false);
        expect(linkAt(0)).toHaveFocus();
      }
    );

    it('moves only left and right in the strip', () => {
      layOutGrid(4);
      renderGrid({ variant: 'strip' });
      linkAt(1).focus();
      press('ArrowDown');
      expect(linkAt(1)).toHaveFocus();
      press('ArrowRight');
      expect(linkAt(2)).toHaveFocus();
    });
  });
});
