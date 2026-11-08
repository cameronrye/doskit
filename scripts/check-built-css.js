/**
 * Check that the CSS in dist/assets works in the oldest browsers README supports
 * (Chrome/Edge 98, Firefox 94, Opera 84, Safari and iOS 15.4). CI runs it after the build.
 *
 * The CSS minifier writes for build.target's browsers. For newer ones it rewrites
 * `max-width` media queries in range syntax, `(width<=768px)`, which Chrome before 104
 * and Safari before 16.4 ignore, and it drops the `100vh` written before `100dvh`.
 * Chrome before 108 and Firefox before 101 have no dynamic viewport units, so without
 * that fallback the app gets no height and the DOS player none either.
 */

import { readdirSync, readFileSync, realpathSync } from 'node:fs';
import { dirname, join, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIST_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');

// Range syntax compares with <, >, <= or >=, which min- and max- features never use
const MEDIA_QUERY = /@media([^{]*)\{/g;
const RANGE_OPERATOR = /[<>=]/;

// The dynamic, small and large viewport units (100dvh, 50svw, 10lvmin, ...)
const NEW_VIEWPORT_UNIT = /\d[dsl]v(?:h|w|i|b|min|max)\b/;

// A rule's selector and the declarations in its braces. The minifier nests only at-rules,
// so every block holding declarations is innermost.
const DECLARATION_BLOCK = /([^{}]+)\{([^{}]*)\}/g;

/**
 * Media queries in range syntax, such as `@media (width<=768px)`
 * @param {string} css
 * @returns {string[]}
 */
export function findRangeMediaQueries(css) {
  return [...css.matchAll(MEDIA_QUERY)]
    .filter(([, query]) => RANGE_OPERATOR.test(query))
    .map(([, query]) => `@media ${query.trim()}`);
}

/**
 * Split a block's declarations at the semicolons outside strings and brackets
 * @param {string} block
 * @returns {{ property: string, value: string }[]}
 */
function parseDeclarations(block) {
  const declarations = [];
  let depth = 0;
  let quote = null;
  let start = 0;
  for (let i = 0; i <= block.length; i++) {
    const char = block[i];
    if (quote) {
      if (char === '\\') i++;
      else if (char === quote) quote = null;
    } else if (char === '"' || char === "'") {
      quote = char;
    } else if (char === '(') {
      depth++;
    } else if (char === ')') {
      depth--;
    } else if ((char === ';' && depth === 0) || char === undefined) {
      const declaration = block.slice(start, i);
      const colon = declaration.indexOf(':');
      if (colon > 0) {
        declarations.push({
          property: declaration.slice(0, colon).trim().toLowerCase(),
          value: declaration.slice(colon + 1).trim(),
        });
      }
      start = i + 1;
    }
  }
  return declarations;
}

/**
 * Declarations that use a dynamic, small or large viewport unit with no declaration of
 * the same property before them in the same rule that older browsers understand
 * @param {string} css
 * @returns {string[]} as `selector { property: value }`
 */
export function findViewportUnitsWithoutFallback(css) {
  const missing = [];
  for (const [, selector, block] of css.matchAll(DECLARATION_BLOCK)) {
    const declarations = parseDeclarations(block);
    declarations.forEach(({ property, value }, index) => {
      if (!NEW_VIEWPORT_UNIT.test(value)) {
        return;
      }
      const hasFallback = declarations
        .slice(0, index)
        .some((earlier) => earlier.property === property && !NEW_VIEWPORT_UNIT.test(earlier.value));
      if (!hasFallback) {
        missing.push(`${selector.trim()} { ${property}: ${value} }`);
      }
    });
  }
  return missing;
}

/**
 * Check every stylesheet under dist/assets
 * @param {string} dir the build output directory
 * @returns {string[]} the problems, each prefixed with its file's path relative to `dir`
 */
export function checkBuiltCss(dir) {
  const stylesheets = readdirSync(join(dir, 'assets'), { recursive: true })
    .filter((file) => file.endsWith('.css'))
    .map((file) => `assets/${file.split(sep).join('/')}`)
    .sort();
  if (stylesheets.length === 0) {
    throw new Error(`there are no CSS files in ${join(dir, 'assets')}`);
  }

  return stylesheets.flatMap((file) => {
    const css = readFileSync(join(dir, file), 'utf8');
    return [
      ...findRangeMediaQueries(css).map((query) => `${file}: ${query} uses range syntax`),
      ...findViewportUnitsWithoutFallback(css).map(
        (declaration) => `${file}: ${declaration} has no fallback before it`
      ),
    ];
  });
}

function main() {
  try {
    const problems = checkBuiltCss(DIST_DIR);
    if (problems.length > 0) {
      console.error('[check-built-css] The built CSS needs newer browsers than README lists:');
      problems.forEach((problem) => console.error(`  ${problem}`));
      console.error('Set build.target in vite.config.ts to the browsers README lists.');
      process.exit(1);
    }
    console.log('[check-built-css] The built CSS works in the oldest browsers README lists');
  } catch (error) {
    console.error(`[check-built-css] ${error.message}`);
    process.exit(1);
  }
}

const isEntryPoint = () => {
  try {
    return realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url));
  } catch {
    return false;
  }
};

if (isEntryPoint()) {
  main();
}
