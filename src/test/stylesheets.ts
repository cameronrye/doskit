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
