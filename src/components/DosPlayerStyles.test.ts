/**
 * Tests that the player's stylesheets share no name with js-dos's. index.html loads
 * js-dos.css for the whole page, and most of it, daisyUI's components and Tailwind's
 * animations among them, is not scoped to js-dos's elements: a class DosKit shares with it
 * picks up its rules, and keyframes of the same name replace one another.
 */

import { describe, it, expect, vi } from 'vitest';

/**
 * A file's text, read from disk: Vitest keeps imported CSS out of tests. node:fs comes
 * through importActual, as the tests have the browser's types only.
 */
async function read(path: string): Promise<string> {
  const fs = await vi.importActual<{ readFileSync(file: URL, encoding: 'utf8'): string }>(
    'node:fs'
  );
  return fs.readFileSync(new URL(path, import.meta.url), 'utf8');
}

/** js-dos's stylesheet, as npm installs it (public/js-dos.css is a copy made before builds) */
const readJsDosCss = () => read('../../node_modules/js-dos/dist/js-dos.css');

const withoutComments = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, '');

/** The class names a stylesheet's selectors name */
function classNames(css: string): Set<string> {
  // Without its declaration blocks, the innermost braces, only selectors and at-rules are left
  const selectors = withoutComments(css).replace(/\{[^{}]*\}/g, ' ');
  return new Set(
    [...selectors.matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)].flatMap((match) => match[1] ?? [])
  );
}

/** The names of a stylesheet's keyframes */
function keyframeNames(css: string): Set<string> {
  const names = withoutComments(css).matchAll(/@keyframes\s+(-?[_a-zA-Z][\w-]*)/g);
  return new Set([...names].flatMap((match) => match[1] ?? []));
}

const PLAYER_STYLESHEETS = ['DosPlayer.css', 'DosPlayerWithApps.css'];

describe("the player's stylesheets", () => {
  it("name no class of js-dos's stylesheet but js-dos's own", async () => {
    const jsDos = classNames(await readJsDosCss());

    for (const file of PLAYER_STYLESHEETS) {
      // The classes that start jsdos- are on js-dos's elements, which DosKit styles on purpose
      const shared = [...classNames(await read(file))].filter(
        (name) => jsDos.has(name) && !name.startsWith('jsdos-')
      );
      expect([file, shared]).toEqual([file, []]);
    }
  });

  it("name no keyframes of js-dos's stylesheet", async () => {
    const jsDos = keyframeNames(await readJsDosCss());

    for (const file of PLAYER_STYLESHEETS) {
      const shared = [...keyframeNames(await read(file))].filter((name) => jsDos.has(name));
      expect([file, shared]).toEqual([file, []]);
    }
  });
});
