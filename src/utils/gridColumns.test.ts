import { afterEach, describe, expect, it, vi } from 'vitest';
import { countGridColumns } from './gridColumns';

/** jsdom has no layout: give each child of a grid the offsets a browser would */
function makeGrid(count: number, columns: number, width = 200): HTMLElement {
  const grid = document.createElement('div');
  for (let i = 0; i < count; i++) {
    const child = document.createElement('a');
    Object.defineProperty(child, 'offsetTop', { value: Math.floor(i / columns) * 250 });
    Object.defineProperty(child, 'offsetWidth', { value: width });
    grid.appendChild(child);
  }
  return grid;
}

describe('countGridColumns', () => {
  afterEach(() => vi.restoreAllMocks());

  it.each([1, 2, 4, 7])('counts the items on the first row of a %i-column grid', (columns) => {
    expect(countGridColumns(makeGrid(20, columns))).toBe(columns);
  });

  it('counts every item when they all fit on one row', () => {
    expect(countGridColumns(makeGrid(3, 5))).toBe(3);
  });

  it('counts one column for no grid or an empty one', () => {
    expect(countGridColumns(null)).toBe(1);
    expect(countGridColumns(document.createElement('div'))).toBe(1);
  });

  it('counts one column for a grid without layout', () => {
    expect(countGridColumns(makeGrid(6, 3, 0))).toBe(1);
  });
});
