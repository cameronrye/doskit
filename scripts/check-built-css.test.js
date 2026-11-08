import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  checkBuiltCss,
  findRangeMediaQueries,
  findViewportUnitsWithoutFallback,
} from './check-built-css.js';

let dist;

/** A build output directory holding the given files, by path and contents */
function createDist(files) {
  dist = mkdtempSync(join(tmpdir(), 'check-built-css-'));
  for (const [file, contents] of Object.entries(files)) {
    mkdirSync(dirname(join(dist, file)), { recursive: true });
    writeFileSync(join(dist, file), contents);
  }
  return dist;
}

afterEach(() => {
  if (dist) {
    rmSync(dist, { recursive: true, force: true });
    dist = undefined;
  }
});

describe('findRangeMediaQueries', () => {
  it('reports media queries written in range syntax', () => {
    const css =
      '@media (width<=768px){.a{color:red}}' +
      '@media (400px<width<=800px){.b{color:red}}' +
      '@media (height>=600px){.c{color:red}}' +
      '@media (width>1200px){.d{color:red}}';

    expect(findRangeMediaQueries(css)).toEqual([
      '@media (width<=768px)',
      '@media (400px<width<=800px)',
      '@media (height>=600px)',
      '@media (width>1200px)',
    ]);
  });

  it('accepts min- and max- media features and the rest', () => {
    const css =
      '@media (max-width:768px){.a{color:red}}' +
      '@media (min-width:481px) and (max-width:768px){.b{color:red}}' +
      '@media print{.c{display:none}}' +
      '@media (prefers-reduced-motion:reduce){.d{animation:none}}';

    expect(findRangeMediaQueries(css)).toEqual([]);
  });
});

describe('findViewportUnitsWithoutFallback', () => {
  it('reports dynamic viewport units with no fallback before them', () => {
    expect(findViewportUnitsWithoutFallback('.app{width:100dvw;height:100dvh}')).toEqual([
      '.app { width: 100dvw }',
      '.app { height: 100dvh }',
    ]);
  });

  it('accepts dynamic viewport units after a fallback for the same property', () => {
    const css =
      '.app{height:100vh;width:100vw;height:100dvh;color:#fff;width:100dvw}' +
      'body{min-height:100vh;min-height:-webkit-fill-available;min-height:100dvh}';

    expect(findViewportUnitsWithoutFallback(css)).toEqual([]);
  });

  it('does not count a fallback after the declaration, or in another rule', () => {
    const css = '.a{height:100dvh;height:100vh}.b{height:100vh}.c{height:100dvh}';

    expect(findViewportUnitsWithoutFallback(css)).toEqual([
      '.a { height: 100dvh }',
      '.c { height: 100dvh }',
    ]);
  });

  it('does not count a fallback that uses a newer viewport unit itself', () => {
    expect(findViewportUnitsWithoutFallback('.a{height:100svh;height:100dvh}')).toEqual([
      '.a { height: 100svh }',
      '.a { height: 100dvh }',
    ]);
  });

  it('checks the rules inside media queries', () => {
    const css =
      '@media (max-width:480px){.app{height:100vh;height:100dvh}.wrapper{height:calc(100dvh - 2rem)}}';

    expect(findViewportUnitsWithoutFallback(css)).toEqual([
      '.wrapper { height: calc(100dvh - 2rem) }',
    ]);
  });

  it('accepts the classic viewport units on their own', () => {
    expect(findViewportUnitsWithoutFallback('.a{min-height:100vh;width:50vw;top:20vh}')).toEqual(
      []
    );
  });
});

describe('checkBuiltCss', () => {
  it('lists the problems of each stylesheet in dist/assets', () => {
    createDist({
      'assets/index-abc123.css': '@media (width<=768px){.app{height:100dvh}}',
      'assets/other-def456.css': '.ok{height:100vh;height:100dvh}',
      'assets/index-abc123.js': '"@media (width<=768px){.app{height:100dvh}}"',
    });

    expect(checkBuiltCss(dist)).toEqual([
      'assets/index-abc123.css: @media (width<=768px) uses range syntax',
      'assets/index-abc123.css: .app { height: 100dvh } has no fallback before it',
    ]);
  });

  it('passes CSS that the oldest supported browsers can use', () => {
    createDist({
      'assets/index-abc123.css':
        '.app{height:100vh;height:100dvh}@media (max-width:768px){.app{height:100vh;height:100dvh}}',
    });

    expect(checkBuiltCss(dist)).toEqual([]);
  });

  it('fails when the build has no stylesheet to check', () => {
    createDist({ 'assets/index-abc123.js': 'console.log(1)' });

    expect(() => checkBuiltCss(dist)).toThrow(/no CSS files/);
  });
});
