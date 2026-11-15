/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * Grid geometry for keyboard navigation
 */

/**
 * Count the apps on the first row of the rendered grid. Its auto-fill columns
 * follow the viewport width, so measure on each use. A grid without layout
 * (hidden, or no layout engine) counts as a single column.
 */
export function countGridColumns(grid: HTMLElement | null): number {
  const items = grid ? Array.from(grid.children) : [];
  const first = items[0];
  if (!(first instanceof HTMLElement) || first.offsetWidth === 0) {
    return 1;
  }
  const firstOnNextRow = items.findIndex(
    (item) => item instanceof HTMLElement && item.offsetTop !== first.offsetTop
  );
  return firstOnNextRow === -1 ? items.length : firstOnNextRow;
}
