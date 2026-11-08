/**
 * Tests for DosPlayerUI's layout under js-dos's soft fullscreen
 */

import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { createRef } from 'react';
import { render } from '@testing-library/react';
import { DosPlayerUI } from './DosPlayerUI';

/**
 * DosPlayer.css, read from disk: Vitest keeps imported CSS, ?raw imports included, out of
 * tests. node:fs comes through importActual, as the tests have the browser's types only.
 */
async function readPlayerStyles(): Promise<string> {
  const fs = await vi.importActual<{ readFileSync(file: URL, encoding: 'utf8'): string }>(
    'node:fs'
  );
  // The stylesheet beside this file
  return fs.readFileSync(new URL(import.meta.url.replace(/[^/]+$/, 'DosPlayer.css')), 'utf8');
}

describe('DosPlayerUI', () => {
  describe("js-dos's soft fullscreen", () => {
    let sheet: HTMLStyleElement;
    beforeAll(async () => {
      sheet = document.createElement('style');
      sheet.textContent = await readPlayerStyles();
      document.head.append(sheet);
    });
    afterAll(() => sheet.remove());

    /** The element js-dos runs in, with the class js-dos gives the element it starts in */
    function renderJsDosRoot() {
      const ref = createRef<HTMLDivElement>();
      render(<DosPlayerUI dosContainerRef={ref} isLoading={false} error={null} />);
      const root = ref.current!;
      root.classList.add('jsdos-rso');
      return root;
    }

    it('fills the viewport, above the header and footer, while js-dos has it on', () => {
      const root = renderJsDosRoot();

      // What js-dos's fullscreen button does with softFullscreen set
      root.classList.add('jsdos-fullscreen-workaround');

      const style = getComputedStyle(root);
      expect(style.position).toBe('fixed');
      expect([style.top, style.right, style.bottom, style.left]).toEqual([
        '0px',
        '0px',
        '0px',
        '0px',
      ]);
      expect(style.zIndex).toBe('999');
    });

    it('goes back into the page once js-dos turns it off', () => {
      const root = renderJsDosRoot();
      root.classList.add('jsdos-fullscreen-workaround');

      root.classList.remove('jsdos-fullscreen-workaround');

      expect(getComputedStyle(root).position).toBe('relative');
    });
  });
});
