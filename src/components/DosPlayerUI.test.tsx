/**
 * Tests for DosPlayerUI: what it tells screen readers, how it looks, and its layout under
 * js-dos's soft fullscreen
 */

import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { createRef } from 'react';
import { render, screen, within } from '@testing-library/react';
import { DosPlayerUI } from './DosPlayerUI';
import { applyStylesheet, keyframesIn, readStylesheets, resolveTokens } from '../test/stylesheets';

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
  describe('for screen readers', () => {
    it('announces that the emulator is loading', () => {
      render(<DosPlayerUI dosContainerRef={createRef()} isLoading={true} error={null} />);

      expect(screen.getByRole('status')).toHaveTextContent('Loading DOS emulator…');
    });

    it('announces at once why the emulator could not start', () => {
      render(
        <DosPlayerUI
          dosContainerRef={createRef()}
          isLoading={false}
          error="DOS emulator library not loaded. Please refresh the page."
        />
      );

      expect(screen.getByRole('alert')).toHaveTextContent(
        'DOS emulator library not loaded. Please refresh the page.'
      );
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });
  });

  // As every other screen: the VGA tokens, the interface type for a line and the reading type
  // for a sentence, and nothing that moves
  describe('in the DOS look', () => {
    const OWN = 'src/components/DosPlayer.css';
    const ERROR = 'DOS emulator library not loaded. Please refresh the page.';
    let sheet: HTMLStyleElement;
    let own: string;
    beforeAll(async () => {
      const sheets = await readStylesheets();
      own = sheets.get(OWN)!.replace(/\/\*[\s\S]*?\*\//g, '');
      sheet = applyStylesheet(resolveTokens(sheets, own));
    });
    afterAll(() => sheet.remove());

    it('says it is loading in a line of VT323 on black, with nothing turning', () => {
      const { container } = render(
        <DosPlayerUI dosContainerRef={createRef()} isLoading={true} error={null} />
      );

      const status = screen.getByRole('status');
      const line = within(status).getByText('Loading DOS emulator…');
      expect(getComputedStyle(line).fontFamily).toMatch(/^["']?VT323/);
      // In px, as the root is 14px on phones: VT323 is never under 18px
      expect(getComputedStyle(line).fontSize).toMatch(/^(1[89]|[2-9]\d)px$/);
      expect(getComputedStyle(status).backgroundColor).toBe('rgb(0, 0, 0)');
      expect(container.querySelector('[class*="spinner"]')).toBeNull();
    });

    it('animates nothing and names no colour of its own', () => {
      expect(keyframesIn(own)).toEqual([]);
      expect(own).not.toMatch(/animation|rotate\(/);
      expect(own).not.toMatch(/#[0-9a-f]{3,8}\b|rgba?\(/i);
    });

    it('shows why the emulator could not start in a DOS window, in the reading type', () => {
      render(<DosPlayerUI dosContainerRef={createRef()} isLoading={false} error={ERROR} />);

      const alert = screen.getByRole('alert');
      expect(getComputedStyle(alert).backgroundColor).toBe('rgb(0, 0, 0)');
      expect(within(alert).getByText('Error')).toHaveClass('dos-window-title');
      expect(getComputedStyle(within(alert).getByText(ERROR)).fontFamily).toMatch(/^ui-monospace/);
      // Black on light grey, the menu's colours
      const reload = within(alert).getByRole('button', { name: 'Reload Page' });
      expect(getComputedStyle(reload).color).toBe('rgb(0, 0, 0)');
      expect(getComputedStyle(reload).backgroundColor).toBe('rgb(170, 170, 170)');
    });
  });

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

    // index.html lets the page run under a phone's notch, rounded corners and home indicator
    // (viewport-fit=cover)
    it("keeps js-dos clear of a phone's notch and home indicator", async () => {
      // jsdom drops env(), so a phone's insets stand in for it
      const insets = { top: '47px', right: '12px', bottom: '34px', left: '59px' };
      const phone = document.createElement('style');
      phone.textContent = (await readPlayerStyles()).replace(
        /env\(safe-area-inset-(top|right|bottom|left)\)/g,
        (_, side: keyof typeof insets) => insets[side]
      );
      document.head.append(phone);
      try {
        const root = renderJsDosRoot();

        root.classList.add('jsdos-fullscreen-workaround');

        const style = getComputedStyle(root);
        expect([
          style.paddingTop,
          style.paddingRight,
          style.paddingBottom,
          style.paddingLeft,
        ]).toEqual(['47px', '12px', '34px', '59px']);
        // Within the 100% width and height the element has
        expect(style.boxSizing).toBe('border-box');
      } finally {
        phone.remove();
      }
    });

    it('goes back into the page once js-dos turns it off', () => {
      const root = renderJsDosRoot();
      root.classList.add('jsdos-fullscreen-workaround');

      root.classList.remove('jsdos-fullscreen-workaround');

      expect(getComputedStyle(root).position).toBe('relative');
    });
  });
});
