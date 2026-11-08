/**
 * The stylesheets a page of DosKit loads, read from disk for tests: Vitest keeps imported
 * CSS, ?raw imports included, out of tests. node:fs comes through importActual, as the
 * tests have the browser's types only.
 */

import { vi } from 'vitest';

interface FileSystem {
  readFileSync(file: URL, encoding: 'utf8'): string;
  readdirSync(dir: URL, options: { recursive: true }): string[];
}

// Not new URL('..', import.meta.url), which Vite turns into the URL of an asset
const SRC = new URL(import.meta.url.replace(/test\/[^/]+$/, ''));
// What copy-js-dos.js copies to public/js-dos.css, which index.html loads before the app's
const JS_DOS_CSS = new URL('../node_modules/js-dos/dist/js-dos.css', SRC);

const withoutComments = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, '');

/**
 * Every stylesheet of the page
 * @returns Each stylesheet's text by its path: src/... for the app's, js-dos.css for js-dos's
 */
export async function readStylesheets(): Promise<Map<string, string>> {
  const fs = await vi.importActual<FileSystem>('node:fs');
  const sheets = new Map<string, string>();
  for (const file of fs.readdirSync(SRC, { recursive: true })) {
    if (file.endsWith('.css')) {
      sheets.set(`src/${file.replaceAll('\\', '/')}`, fs.readFileSync(new URL(file, SRC), 'utf8'));
    }
  }
  sheets.set('js-dos.css', fs.readFileSync(JS_DOS_CSS, 'utf8'));
  return sheets;
}

/** The names of the @keyframes a stylesheet defines, once for each definition */
export const keyframesIn = (css: string): string[] =>
  [...withoutComments(css).matchAll(/@keyframes\s+([\w-]+)/g)].map(([, name]) => name!);

/** The class names a stylesheet's selectors name */
export const classesIn = (css: string): string[] => [
  ...new Set([...withoutComments(css).matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)].map(([, name]) => name!)),
];

/** Whether a stylesheet has a rule for the class */
export const styles = (css: string, className: string): boolean =>
  new RegExp(`\\.${className}(?![\\w-])`).test(withoutComments(css));

/** Add a stylesheet to the document, as the page would load it */
export function applyStylesheet(css: string): HTMLStyleElement {
  const sheet = document.createElement('style');
  sheet.textContent = css;
  document.head.append(sheet);
  return sheet;
}

/** WCAG's relative luminance of a computed colour, rgb(r, g, b) */
function luminance(color: string): number {
  const channels = color
    .match(/\d+(\.\d+)?/g)
    ?.slice(0, 3)
    .map(Number);
  if (channels?.length !== 3) {
    throw new Error(`not a computed colour: ${color}`);
  }
  const [r, g, b] = channels.map((channel) => {
    const c = channel / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG's contrast ratio of two computed colours: 4.5 or more passes for normal text */
export function contrastRatio(foreground: string, background: string): number {
  const [lighter, darker] = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (lighter! + 0.05) / (darker! + 0.05);
}
