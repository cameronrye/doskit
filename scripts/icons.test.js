// @vitest-environment node
// The icons in public/icons, as index.html and manifest.json declare them
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC_DIR = join(ROOT, 'public');
const indexHtml = readFileSync(join(ROOT, 'index.html'), 'utf8');
const manifest = JSON.parse(readFileSync(join(PUBLIC_DIR, 'manifest.json'), 'utf8'));

/** The apple-touch-icon links of index.html, as { href, sizes } */
const appleTouchIcons = [...indexHtml.matchAll(/<link\b[^>]*\brel="apple-touch-icon"[^>]*>/g)].map(
  ([tag]) => ({
    href: tag.match(/\bhref="([^"]+)"/)?.[1],
    sizes: tag.match(/\bsizes="([^"]+)"/)?.[1],
  })
);

const maskableIcons = manifest.icons.filter((icon) => icon.purpose === 'maskable');

/** The pixel size of a PNG in public/, as `<width>x<height>` */
async function sizeOf(path) {
  const { width, height } = await sharp(join(PUBLIC_DIR, path)).metadata();
  return `${width}x${height}`;
}

/** How many pixels of a PNG in public/ are not fully opaque */
async function countTransparentPixels(path) {
  const { data, info } = await sharp(join(PUBLIC_DIR, path))
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  let transparent = 0;
  for (let i = info.channels - 1; i < data.length; i += info.channels) {
    if (data[i] < 255) transparent++;
  }
  return transparent;
}

describe('the Apple touch icons', () => {
  it('include the 180x180 and 120x120 icons that iPhones use', () => {
    expect(appleTouchIcons.map((icon) => icon.sizes)).toEqual(
      expect.arrayContaining(['180x180', '120x120'])
    );
  });

  // iOS fills transparent pixels with black, which frames the logo
  it.each(appleTouchIcons)('$href is $sizes and opaque', async ({ href, sizes }) => {
    expect(await sizeOf(href)).toBe(sizes);
    expect(await countTransparentPixels(href)).toBe(0);
  });
});

describe('the manifest icons', () => {
  it.each(manifest.icons.filter((icon) => icon.type === 'image/png'))(
    '$src is $sizes',
    async ({ src, sizes }) => {
      expect(await sizeOf(src)).toBe(sizes);
    }
  );

  it('include maskable icons', () => {
    expect(maskableIcons.length).toBeGreaterThan(0);
  });

  // Launchers fill transparent pixels with a colour of their own, inside the mask
  it.each(maskableIcons)('maskable $src is opaque', async ({ src }) => {
    expect(await countTransparentPixels(src)).toBe(0);
  });
});
