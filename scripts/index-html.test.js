// @vitest-environment node
// The metadata in index.html, against the files it names
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC_DIR = join(ROOT, 'public');
const html = readFileSync(join(ROOT, 'index.html'), 'utf8');
const graph = JSON.parse(
  html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]
)['@graph'];

/** The JSON-LD node of a type */
const nodeOf = (type) => graph.find((node) => node['@type'] === type);

/** The content of the meta tag with this property or name */
const metaContent = (key) =>
  html.match(new RegExp(`<meta\\s+(?:property|name)="${key}"\\s+content="([^"]*)"`))?.[1];

describe("index.html's metadata", () => {
  it("names only this site's files that exist", () => {
    const paths = [...html.matchAll(/https:\/\/doskit\.net\/([^"#\s]*)/g)]
      .map(([, path]) => path)
      .filter(Boolean);

    expect(paths.length).toBeGreaterThan(0);
    expect(paths.filter((path) => !existsSync(join(PUBLIC_DIR, path)))).toEqual([]);
  });

  it('gives the Open Graph image its real size', async () => {
    const { width, height } = await sharp(join(PUBLIC_DIR, 'og-image.png')).metadata();
    const pageImage = nodeOf('WebPage').primaryImageOfPage;

    expect([metaContent('og:image:width'), metaContent('og:image:height')]).toEqual([
      String(width),
      String(height),
    ]);
    expect([pageImage.width, pageImage.height]).toEqual([width, height]);
  });

  // schema.org's screenshot is a capture of the app, which the social card is not
  it('does not give the social card as a screenshot of the app', () => {
    expect(metaContent('og:image')).toBe('https://doskit.net/og-image.png');
    expect(nodeOf('SoftwareApplication').screenshot).not.toBe(metaContent('og:image'));
  });

  // The one sentence DosKit introduces itself with, wherever it does
  const IDENTITY = 'DOS demoscene classics and the trackers behind them, playable in your browser.';

  it('introduces DosKit with the same sentence everywhere', () => {
    const manifest = JSON.parse(readFileSync(join(PUBLIC_DIR, 'manifest.json'), 'utf8'));
    const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));

    for (const description of [
      metaContent('description'),
      metaContent('og:description'),
      metaContent('twitter:description'),
      nodeOf('WebSite').description,
      nodeOf('SoftwareApplication').description,
      manifest.description,
      pkg.description,
    ]) {
      expect(description?.startsWith(IDENTITY)).toBe(true);
    }
  });

  it('names what it is in its title', () => {
    const title = 'DosKit - DOS demoscene classics in your browser';

    expect(html).toContain(`<title>${title}</title>`);
    expect([metaContent('title'), metaContent('og:title'), metaContent('twitter:title')]).toEqual([
      title,
      title,
      title,
    ]);
  });
});
