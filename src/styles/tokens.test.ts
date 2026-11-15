// The design tokens in src/index.css: the 16 VGA colours, the semantic tokens built on
// them, and the contrast of every pair of text and ground that later components use
import { describe, expect, it } from 'vitest';
import { readStylesheets } from '../test/stylesheets';

const css = (await readStylesheets()).get('src/index.css') ?? '';

// The first :root block holds the tokens
const root = /:root\s*\{([^}]*)\}/.exec(css)?.[1] ?? '';
const tokens: Record<string, string> = {};
for (const [, name = '', value = ''] of root.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
  tokens[name] = value.trim();
}

/** A token's colour as #rrggbb, with var(--x) resolved one level */
function color(name: string): string {
  const value = tokens[name] ?? '';
  const reference = /^var\((--[\w-]+)\)$/.exec(value)?.[1];
  const resolved = reference ? (tokens[reference] ?? '') : value;
  if (!/^#[0-9a-f]{6}$/i.test(resolved)) {
    throw new Error(`${name} is not a colour: ${value}`);
  }
  return resolved.toLowerCase();
}

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const channel = parseInt(hex.slice(i, i + 2), 16) / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [x, y] = [luminance(a), luminance(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

const PAIRS: [fg: string, bg: string, min: number][] = [
  ['--text', '--surface', 4.5],
  ['--text-strong', '--surface', 4.5],
  ['--author', '--surface', 4.5],
  ['--year', '--surface', 4.5],
  ['--accent', '--surface', 4.5],
  ['--title', '--surface', 4.5],
  ['--window-text', '--window', 4.5],
  ['--window-title', '--window', 4.5],
  ['--accent', '--window', 4.5],
  ['--text-strong', '--window', 4.5],
  ['--menu-text', '--menu', 4.5],
  ['--menu-accel', '--menu', 4.5],
  ['--menu-selected-text', '--menu-selected', 4.5],
  ['--key-text', '--key', 4.5],
  ['--danger', '--surface', 4.5],
  ['--warning', '--window', 4.5],
  ['--focus', '--surface', 3],
];

describe('the design tokens', () => {
  it.each(PAIRS)('%s on %s meets %s:1', (fg, bg, min) => {
    expect(contrast(color(fg), color(bg))).toBeGreaterThanOrEqual(min);
  });

  it('defines the 16 VGA colours', () => {
    expect(color('--vga-blue')).toBe('#0000aa');
    expect(color('--vga-yellow')).toBe('#ffff55');
    expect(Object.keys(tokens).filter((name) => name.startsWith('--vga-'))).toHaveLength(16);
  });
});
